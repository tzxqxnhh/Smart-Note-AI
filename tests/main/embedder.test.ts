import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// 每个测试前重置
beforeEach(() => {
  vi.clearAllMocks();
  // 确保环境变量存在
  process.env.SILICONFLOW_API_KEY = 'sk-test-key';
  // 重置模块以便重新初始化单例
  vi.resetModules();
});

describe('Embedder', () => {
  async function getEmbedder() {
    const mod = await import('../../src/main/services/embedder');
    return mod.embedder;
  }

  describe('initialize', () => {
    it('初始化后 isReady 返回 true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [{ embedding: [0.1, 0.2], index: 0 }] }),
      });

      const embedder = await getEmbedder();
      await embedder.initialize();

      expect(embedder.isReady()).toBe(true);
    });

    it('环境变量未设置时抛出错误', async () => {
      delete (process.env as Record<string, string>).SILICONFLOW_API_KEY;

      const embedder = await getEmbedder();
      await expect(embedder.initialize()).rejects.toThrow('SILICONFLOW_API_KEY');
    });

    it('API 不可用时抛出错误', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const embedder = await getEmbedder();
      await expect(embedder.initialize()).rejects.toThrow('硅基流动');
    });

    it('API 返回错误状态码时抛出', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const embedder = await getEmbedder();
      await expect(embedder.initialize()).rejects.toThrow('硅基流动');
    });
  });

  describe('embed', () => {
    // 辅助：创建已初始化的 embedder
    async function getInitializedEmbedder() {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [{ embedding: [0], index: 0 }] }),
      });
      const embedder = await getEmbedder();
      await embedder.initialize();
      mockFetch.mockClear(); // 清除 init 调用记录，让后续测试计数干净
      return embedder;
    }

    it('embed 返回正确数量的向量', async () => {
      const embedder = await getInitializedEmbedder();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            { embedding: [0.1, 0.2, 0.3], index: 0 },
            { embedding: [0.4, 0.5, 0.6], index: 1 },
            { embedding: [0.7, 0.8, 0.9], index: 2 },
          ],
        }),
      });

      const result = await embedder.embed(['text1', 'text2', 'text3']);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual([0.1, 0.2, 0.3]);
      expect(result[1]).toEqual([0.4, 0.5, 0.6]);
      expect(result[2]).toEqual([0.7, 0.8, 0.9]);
    });

    it('embedQuery 返回单个向量', async () => {
      const embedder = await getInitializedEmbedder();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            { embedding: [0.5, 0.6, 0.7], index: 0 },
          ],
        }),
      });

      const result = await embedder.embedQuery('test query');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([0.5, 0.6, 0.7]);
    });

    it('批量处理时自动分批', async () => {
      const embedder = await getInitializedEmbedder();

      // 66 个文本，应该分 3 批（32 + 32 + 2）
      const texts = Array.from({ length: 66 }, (_, i) => `text ${i}`);

      // 3 批次的 mock
      for (let batch = 0; batch < 3; batch++) {
        const count = batch < 2 ? 32 : 2;
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            data: Array.from({ length: count }, (_, i) => ({
              embedding: [i + batch * 32],
              index: i,
            })),
          }),
        });
      }

      const result = await embedder.embed(texts);

      expect(result).toHaveLength(66);
    });

    it('空输入返回空数组', async () => {
      const embedder = await getEmbedder();
      const result = await embedder.embed([]);
      expect(result).toEqual([]);
    });

    it('API 返回错误时抛出', async () => {
      const embedder = await getInitializedEmbedder();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server Error',
      });

      await expect(embedder.embed(['test'])).rejects.toThrow();
    });

    it('未初始化时自动初始化（懒初始化）', async () => {
      // 第一个 mock：init 验证调用
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ embedding: [0], index: 0 }],
        }),
      });
      // 第二个 mock：实际 embed 调用
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ embedding: [1.0, 2.0], index: 0 }],
        }),
      });

      const embedder = await getEmbedder();
      // 不显式调用 initialize，直接 embed
      expect(embedder.isReady()).toBe(false);
      const result = await embedder.embed(['test']);
      expect(embedder.isReady()).toBe(true);
      expect(result).toHaveLength(1);
    });
  });
});
