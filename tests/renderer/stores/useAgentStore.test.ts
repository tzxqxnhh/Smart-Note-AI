import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock ipc-client
const mockLlmChatStream = vi.fn();
const mockLlmSummarize = vi.fn().mockResolvedValue('');
const mockLlmExpand = vi.fn().mockResolvedValue('');
const mockLlmFormat = vi.fn().mockResolvedValue('');
const mockLlmGenerateTree = vi.fn().mockResolvedValue({ mermaid: '', ascii: '' });
const mockOnLlmStreamChunk = vi.fn().mockReturnValue(vi.fn());
const mockOnLlmStreamEnd = vi.fn().mockReturnValue(vi.fn());

vi.mock('@/lib/ipc-client', () => ({
  llmChatStream: mockLlmChatStream,
  llmSummarize: mockLlmSummarize,
  llmExpand: mockLlmExpand,
  llmFormat: mockLlmFormat,
  llmGenerateTree: mockLlmGenerateTree,
  onLlmStreamChunk: mockOnLlmStreamChunk,
  onLlmStreamEnd: mockOnLlmStreamEnd,
}));

// 用于在测试中捕获回调
let capturedChunkCb: ((data: unknown) => void) | null = null;
let capturedEndCb: ((data: unknown) => void) | null = null;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();

  // 重置捕获的回调
  capturedChunkCb = null;
  capturedEndCb = null;

  // Mock onLlmStreamChunk 和 onLlmStreamEnd 捕获回调
  mockOnLlmStreamChunk.mockImplementation((cb: (data: unknown) => void) => {
    capturedChunkCb = cb;
    return vi.fn(); // 返回取消订阅函数
  });
  mockOnLlmStreamEnd.mockImplementation((cb: (data: unknown) => void) => {
    capturedEndCb = cb;
    return vi.fn(); // 返回取消订阅函数
  });

  // Mock 默认返回值
  mockLlmSummarize.mockResolvedValue('总结结果');
  mockLlmExpand.mockResolvedValue('扩写结果');
  mockLlmFormat.mockResolvedValue('格式化结果');
  mockLlmGenerateTree.mockResolvedValue({
    mermaid: 'mindmap\n  root\n    子节点',
    ascii: '- root/\n  - file.md',
  });

  // 重置 useAgentStore
  const { resetAgentStore } = await import('@/stores/useAgentStore');
  resetAgentStore();
});

async function getStore() {
  const mod = await import('@/stores/useAgentStore');
  return mod.useAgentStore;
}

describe('useAgentStore', () => {
  describe('初始状态', () => {
    it('messages 为空数组', async () => {
      const store = await getStore();
      expect(store.getState().messages).toEqual([]);
    });

    it('isProcessing 为 false', async () => {
      const store = await getStore();
      expect(store.getState().isProcessing).toBe(false);
    });

    it('status 为 idle', async () => {
      const store = await getStore();
      expect(store.getState().status).toBe('idle');
    });

    it('selectedText 为 null', async () => {
      const store = await getStore();
      expect(store.getState().selectedText).toBeNull();
    });

    it('selectedFolderPath 为 null', async () => {
      const store = await getStore();
      expect(store.getState().selectedFolderPath).toBeNull();
    });

    it('streamingMessage 为 null', async () => {
      const store = await getStore();
      expect(store.getState().streamingMessage).toBeNull();
    });

    it('toolSteps 为空数组', async () => {
      const store = await getStore();
      expect(store.getState().toolSteps).toEqual([]);
    });

    it('vectorDbEnabled 默认为 true', async () => {
      const store = await getStore();
      expect(store.getState().vectorDbEnabled).toBe(true);
    });
  });

  describe('toggleVectorDb', () => {
    it('切换 vectorDbEnabled 状态', async () => {
      const store = await getStore();
      expect(store.getState().vectorDbEnabled).toBe(true);
      store.getState().toggleVectorDb();
      expect(store.getState().vectorDbEnabled).toBe(false);
      store.getState().toggleVectorDb();
      expect(store.getState().vectorDbEnabled).toBe(true);
    });
  });

  describe('sendQuery', () => {
    it('添加用户消息到 messages', async () => {
      const store = await getStore();
      await store.getState().sendQuery('测试问题');

      const messages = store.getState().messages;
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe('测试问题');
    });

    it('设置 isProcessing 和 status', async () => {
      const store = await getStore();
      // sendQuery 是异步的但我们在测试中不等待它完成
      store.getState().sendQuery('test');

      // 验证状态已设置
      const state = store.getState();
      expect(state.isProcessing).toBe(true);
      expect(state.status).toBe('thinking');
    });

    it('创建 streamingMessage', async () => {
      const store = await getStore();
      store.getState().sendQuery('test');

      const state = store.getState();
      expect(state.streamingMessage).not.toBeNull();
      expect(state.streamingMessage!.role).toBe('agent');
      expect(state.streamingMessage!.content).toBe('');
    });

    it('调用 llmChatStream', async () => {
      const store = await getStore();
      await store.getState().sendQuery('test');

      expect(mockLlmChatStream).toHaveBeenCalled();
      const callArgs = mockLlmChatStream.mock.calls[0];
      expect(callArgs[0]).toBe('test'); // query
      expect(typeof callArgs[1]).toBe('string'); // messageId
      expect(callArgs[2]).toBe(true); // vectorDbEnabled 默认为 true
    });

    it('sendQuery 传入 vectorDbEnabled=false 时跳过 RAG', async () => {
      const store = await getStore();
      store.getState().toggleVectorDb(); // 设置为 false
      await store.getState().sendQuery('test');

      expect(mockLlmChatStream).toHaveBeenCalled();
      expect(mockLlmChatStream.mock.calls[0][2]).toBe(false);
    });

    it('注册流式监听器', async () => {
      const store = await getStore();
      await store.getState().sendQuery('test');

      expect(mockOnLlmStreamChunk).toHaveBeenCalled();
      expect(mockOnLlmStreamEnd).toHaveBeenCalled();
    });

    it('收到 stream-chunk 时追加内容', async () => {
      const store = await getStore();
      store.getState().sendQuery('test');

      // 等待状态更新
      await vi.waitFor(() => {
        expect(store.getState().streamingMessage).not.toBeNull();
      });

      const messageId = store.getState().streamingMessage!.id;

      // 模拟收到 chunk
      capturedChunkCb!({ messageId, content: '这是' });
      capturedChunkCb!({ messageId, content: '回复' });

      expect(store.getState().streamingMessage!.content).toBe('这是回复');
      expect(store.getState().status).toBe('generating');
    });

    it('收到包含 toolSteps 的 chunk 时追加 toolSteps', async () => {
      const store = await getStore();
      store.getState().sendQuery('test');

      await vi.waitFor(() => {
        expect(store.getState().streamingMessage).not.toBeNull();
      });

      const messageId = store.getState().streamingMessage!.id;

      capturedChunkCb!({
        messageId,
        content: '',
        toolSteps: [
          {
            id: 'step-1',
            type: 'search',
            status: 'done',
            chunkCount: 3,
          },
        ],
      });

      expect(store.getState().toolSteps).toHaveLength(1);
    });

    it('stream-end 不会重复追加 toolSteps（去重）', async () => {
      const store = await getStore();
      store.getState().sendQuery('test');

      await vi.waitFor(() => {
        expect(store.getState().streamingMessage).not.toBeNull();
      });

      const messageId = store.getState().streamingMessage!.id;

      // 先通过 chunk 发送 toolStep
      capturedChunkCb!({
        messageId,
        content: '',
        toolSteps: [
          {
            id: 'step-search-1',
            type: 'search',
            status: 'done',
            chunkCount: 3,
          },
        ],
      });

      expect(store.getState().toolSteps).toHaveLength(1);

      // stream-end 不再发送 toolSteps（已修复去重）
      capturedEndCb!({
        messageId,
        content: '回答内容',
        citations: [{ sourceFile: 'test.md', headingText: '标题' }],
      });

      // toolSteps 仍然是 1 个，没有被 stream-end 重复追加
      expect(store.getState().toolSteps).toHaveLength(0); // end 后 toolSteps 被清空
      expect(store.getState().messages[1].toolSteps).toHaveLength(1);
      expect(store.getState().messages[1].toolSteps![0].id).toBe('step-search-1');
    });

    it('收到 stream-end 时固化消息', async () => {
      const store = await getStore();
      store.getState().sendQuery('test');

      await vi.waitFor(() => {
        expect(store.getState().streamingMessage).not.toBeNull();
      });

      const messageId = store.getState().streamingMessage!.id;

      // 先追加一些内容
      capturedChunkCb!({ messageId, content: '你好' });

      // 结束流
      capturedEndCb!({
        messageId,
        content: '你好',
        citations: [{ sourceFile: 'test.md', headingText: '标题' }],
        toolSteps: [],
      });

      const state = store.getState();
      expect(state.messages).toHaveLength(2); // user + agent
      expect(state.messages[1].role).toBe('agent');
      expect(state.messages[1].content).toBe('你好');
      expect(state.messages[1].citations).toHaveLength(1);
      expect(state.streamingMessage).toBeNull();
      expect(state.isProcessing).toBe(false);
      expect(state.status).toBe('done');
    });

    it('收到 stream-end 带 error 时设置错误状态', async () => {
      const store = await getStore();
      store.getState().sendQuery('test');

      await vi.waitFor(() => {
        expect(store.getState().streamingMessage).not.toBeNull();
      });

      const messageId = store.getState().streamingMessage!.id;

      capturedEndCb!({
        messageId,
        content: '',
        citations: [],
        toolSteps: [],
        error: 'API Key 未设置',
      });

      const state = store.getState();
      expect(state.messages).toHaveLength(2); // user + error
      expect(state.messages[1].content).toContain('API Key 未设置');
      expect(state.status).toBe('error');
      expect(state.isProcessing).toBe(false);
      expect(state.streamingMessage).toBeNull();
    });

    it('忽略不匹配 messageId 的 chunk', async () => {
      const store = await getStore();
      store.getState().sendQuery('test');

      await vi.waitFor(() => {
        expect(store.getState().streamingMessage).not.toBeNull();
      });

      // 发送不匹配的 chunk
      capturedChunkCb!({ messageId: 'other-id', content: '不应该出现' });

      expect(store.getState().streamingMessage!.content).toBe('');
    });

    it('忽略不匹配 messageId 的 end', async () => {
      const store = await getStore();
      store.getState().sendQuery('test');

      await vi.waitFor(() => {
        expect(store.getState().streamingMessage).not.toBeNull();
      });

      capturedEndCb!({
        messageId: 'other-id',
        content: '',
        citations: [],
        toolSteps: [],
      });

      // streamingMessage 应该仍然存在
      expect(store.getState().streamingMessage).not.toBeNull();
    });
  });

  describe('runPresetAction', () => {
    it('summarize 调用 llmSummarize', async () => {
      const store = await getStore();
      store.getState().setSelectedText('选中的文本内容');
      await store.getState().runPresetAction('summarize');

      expect(mockLlmSummarize).toHaveBeenCalledWith('选中的文本内容');
      expect(store.getState().messages).toHaveLength(1);
      expect(store.getState().messages[0].content).toBe('总结结果');
    });

    it('summarize 无选中文本时提示', async () => {
      const store = await getStore();
      await store.getState().runPresetAction('summarize');

      expect(mockLlmSummarize).not.toHaveBeenCalled();
      expect(store.getState().messages[0].content).toContain('选中');
    });

    it('expand 调用 llmExpand', async () => {
      const store = await getStore();
      store.getState().setSelectedText('选中的文本');
      await store.getState().runPresetAction('expand');

      expect(mockLlmExpand).toHaveBeenCalledWith('选中的文本');
    });

    it('format 调用 llmFormat', async () => {
      const store = await getStore();
      store.getState().setSelectedText('选中的文本');
      await store.getState().runPresetAction('format');

      expect(mockLlmFormat).toHaveBeenCalledWith('选中的文本');
    });

    it('visualize 调用 llmGenerateTree', async () => {
      const store = await getStore();
      store.getState().setSelectedFolder('d:/notes');

      await store.getState().runPresetAction('visualize');

      expect(mockLlmGenerateTree).toHaveBeenCalledWith('d:/notes');
      expect(store.getState().messages[0].content).toContain('mindmap');
      expect(store.getState().messages[0].content).toContain('mermaid');
    });

    it('visualize 无选中文件夹时提示', async () => {
      const store = await getStore();
      await store.getState().runPresetAction('visualize');

      expect(mockLlmGenerateTree).not.toHaveBeenCalled();
      expect(store.getState().messages[0].content).toContain('文件夹');
    });

    it('ask 返回提示消息', async () => {
      const store = await getStore();
      await store.getState().runPresetAction('ask');

      expect(store.getState().messages[0].content).toContain('输入');
    });

    it('操作失败时显示错误消息', async () => {
      mockLlmSummarize.mockRejectedValueOnce(new Error('API 调用失败'));
      const store = await getStore();
      store.getState().setSelectedText('文本');
      await store.getState().runPresetAction('summarize');

      expect(store.getState().messages[0].content).toContain('API 调用失败');
      expect(store.getState().status).toBe('error');
    });
  });

  describe('clearHistory', () => {
    it('清空消息列表、streamingMessage 和 toolSteps', async () => {
      const store = await getStore();
      store.getState().addMessage({
        id: '1',
        role: 'user',
        content: 'test',
        timestamp: '',
      });

      store.getState().clearHistory();

      expect(store.getState().messages).toEqual([]);
      expect(store.getState().streamingMessage).toBeNull();
      expect(store.getState().toolSteps).toEqual([]);
    });
  });
});
