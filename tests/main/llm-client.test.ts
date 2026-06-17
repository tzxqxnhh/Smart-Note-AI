import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeepSeekClient } from '../../src/main/services/llm-client';
import type { ChatMessage } from '../../src/main/services/llm-client';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DeepSeekClient', () => {
  describe('isConfigured', () => {
    it('未设置 API Key 时返回 false', () => {
      delete (process.env as Record<string, string>).DEEPSEEK_API_KEY;
      const client = new DeepSeekClient();
      expect(client.isConfigured()).toBe(false);
    });

    it('设置了 API Key 时返回 true', () => {
      process.env.DEEPSEEK_API_KEY = 'sk-test-key';
      const client = new DeepSeekClient();
      expect(client.isConfigured()).toBe(true);
    });
  });

  describe('chat', () => {
    it('返回 AI 回复内容', async () => {
      process.env.DEEPSEEK_API_KEY = 'sk-test-key';
      const client = new DeepSeekClient();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: '你好！有什么可以帮助你的？' } }],
        }),
      });

      const messages: ChatMessage[] = [
        { role: 'user', content: '你好' },
      ];
      const result = await client.chat(messages);

      expect(result).toBe('你好！有什么可以帮助你的？');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // 验证请求体
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe('https://api.deepseek.com/v1/chat/completions');
      expect(callArgs[1].method).toBe('POST');
      expect(callArgs[1].headers).toHaveProperty('Authorization', 'Bearer sk-test-key');

      const body = JSON.parse(callArgs[1].body);
      expect(body.model).toBe('deepseek-chat');
      expect(body.stream).toBe(false);
      expect(body.messages).toEqual(messages);
    });

    it('传递自定义选项', async () => {
      process.env.DEEPSEEK_API_KEY = 'sk-test-key';
      const client = new DeepSeekClient();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: 'OK' } }],
        }),
      });

      await client.chat(
        [{ role: 'user', content: 'test' }],
        { model: 'deepseek-reasoner', temperature: 0.7, maxTokens: 1000 },
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe('deepseek-reasoner');
      expect(body.temperature).toBe(0.7);
      expect(body.max_tokens).toBe(1000);
    });

    it('使用 DEEPSEEK_MODEL 环境变量覆盖默认模型', async () => {
      process.env.DEEPSEEK_API_KEY = 'sk-test-key';
      process.env.DEEPSEEK_MODEL = 'deepseek-reasoner';
      const client = new DeepSeekClient();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: 'OK' } }],
        }),
      });

      await client.chat([{ role: 'user', content: 'test' }]);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe('deepseek-reasoner');

      delete (process.env as Record<string, string>).DEEPSEEK_MODEL;
    });

    it('API 返回错误时抛出', async () => {
      process.env.DEEPSEEK_API_KEY = 'sk-test-key';
      const client = new DeepSeekClient();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(
        client.chat([{ role: 'user', content: 'test' }]),
      ).rejects.toThrow('DeepSeek API');
    });

    it('网络错误时抛出', async () => {
      process.env.DEEPSEEK_API_KEY = 'sk-test-key';
      const client = new DeepSeekClient();

      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(
        client.chat([{ role: 'user', content: 'test' }]),
      ).rejects.toThrow('Connection refused');
    });
  });

  describe('chatStream', () => {
    /** 创建模拟的 SSE ReadableStream */
    function createSSEStream(chunks: string[]) {
      const encoder = new TextEncoder();
      let index = 0;

      return {
        getReader: () => ({
          read: async (): Promise<{ done: boolean; value?: Uint8Array }> => {
            if (index >= chunks.length) {
              return { done: true };
            }
            const value = encoder.encode(chunks[index++]);
            return { done: false, value };
          },
          releaseLock: vi.fn(),
        }),
      };
    }

    it('逐 token yield', async () => {
      process.env.DEEPSEEK_API_KEY = 'sk-test-key';
      const client = new DeepSeekClient();

      const sseBody = createSSEStream([
        'data: {"choices":[{"delta":{"content":"你"}}]}\n',
        'data: {"choices":[{"delta":{"content":"好"}}]}\n',
        'data: {"choices":[{"delta":{"content":"！"}}]}\n',
        'data: [DONE]\n',
      ]);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: sseBody,
      });

      const tokens: string[] = [];
      for await (const token of client.chatStream([
        { role: 'user', content: '你好' },
      ])) {
        tokens.push(token);
      }

      expect(tokens).toEqual(['你', '好', '！']);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // 验证请求体使用 stream: true
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.stream).toBe(true);
    });

    it('空流没有 token', async () => {
      process.env.DEEPSEEK_API_KEY = 'sk-test-key';
      const client = new DeepSeekClient();

      const sseBody = createSSEStream(['data: [DONE]\n']);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: sseBody,
      });

      const tokens: string[] = [];
      for await (const token of client.chatStream([
        { role: 'user', content: 'test' },
      ])) {
        tokens.push(token);
      }

      expect(tokens).toEqual([]);
    });

    it('跳过无法解析的 SSE 行', async () => {
      process.env.DEEPSEEK_API_KEY = 'sk-test-key';
      const client = new DeepSeekClient();

      const sseBody = createSSEStream([
        '\n', // 空行
        'data: {"choices":[{"delta":{"content":"OK"}}]}\n',
        'data: invalid json\n', // 无效 JSON
        'data: [DONE]\n',
      ]);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: sseBody,
      });

      const tokens: string[] = [];
      for await (const token of client.chatStream([
        { role: 'user', content: 'test' },
      ])) {
        tokens.push(token);
      }

      expect(tokens).toEqual(['OK']);
    });

    it('API 返回错误时抛出', async () => {
      process.env.DEEPSEEK_API_KEY = 'sk-test-key';
      const client = new DeepSeekClient();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const iter = client.chatStream([{ role: 'user', content: 'test' }]);
      await expect(iter[Symbol.asyncIterator]().next()).rejects.toThrow(
        'DeepSeek API',
      );
    });
  });
});
