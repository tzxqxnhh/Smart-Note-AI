import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Chunk } from '../../src/shared/types';

// Mock chromadb module
const mockUpsert = vi.fn().mockResolvedValue(undefined);
const mockQuery = vi.fn().mockResolvedValue({
  ids: [['id1', 'id2']],
  documents: [['content1', 'content2']],
  metadatas: [
    [
      { sourceFile: 'test.md', headingText: 'H1' },
      { sourceFile: 'test.md', headingText: 'H2' },
    ],
  ],
  distances: [[0.1, 0.2]],
});
const mockDelete = vi.fn().mockResolvedValue(undefined);
const mockGetOrCreate = vi.fn().mockResolvedValue({
  upsert: mockUpsert,
  query: mockQuery,
  delete: mockDelete,
});
const mockDeleteCollection = vi.fn().mockResolvedValue(undefined);

vi.mock('chromadb', () => ({
  ChromaClient: vi.fn().mockImplementation(() => ({
    getOrCreateCollection: mockGetOrCreate,
    deleteCollection: mockDeleteCollection,
  })),
}));

const sampleChunks: Chunk[] = [
  {
    id: 'test.md::chunk::0',
    content: '这是第一段内容',
    metadata: {
      sourceFile: 'test.md',
      headingText: '第一节',
      headingLevel: 2,
      parentHeading: null,
      chunkIndex: 0,
      totalChunks: 2,
    },
  },
  {
    id: 'test.md::chunk::1',
    content: '这是第二段内容',
    metadata: {
      sourceFile: 'test.md',
      headingText: '第二节',
      headingLevel: 2,
      parentHeading: null,
      chunkIndex: 1,
      totalChunks: 2,
    },
  },
];

const sampleEmbeddings = [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]];

describe('ChromaManager', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  async function getChromaManager() {
    const mod = await import('../../src/main/services/chroma-manager');
    return mod.chromaManager;
  }

  describe('initialize', () => {
    it('初始化后 isConnected 返回 true', async () => {
      const chromaManager = await getChromaManager();
      await chromaManager.initialize();

      expect(chromaManager.isConnected()).toBe(true);
      expect(mockGetOrCreate).toHaveBeenCalledWith({
        name: 'smart_note_demo',
        embeddingFunction: expect.objectContaining({ generate: expect.any(Function) }),
      });
    });

    it('ChromaDB 不可用时抛出错误', async () => {
      mockGetOrCreate.mockRejectedValueOnce(new Error('Connection refused'));

      const chromaManager = await getChromaManager();
      await expect(chromaManager.initialize()).rejects.toThrow('无法连接到 ChromaDB');
    });
  });

  describe('upsertChunks', () => {
    it('upsert 存入块和向量', async () => {
      const chromaManager = await getChromaManager();
      // 先初始化
      await chromaManager.initialize();

      await chromaManager.upsertChunks(sampleChunks, sampleEmbeddings);

      expect(mockUpsert).toHaveBeenCalledTimes(1);
      const callArgs = mockUpsert.mock.calls[0][0];
      expect(callArgs.ids).toEqual(['test.md::chunk::0', 'test.md::chunk::1']);
      expect(callArgs.embeddings).toEqual(sampleEmbeddings);
      expect(callArgs.documents).toEqual(['这是第一段内容', '这是第二段内容']);
      expect(callArgs.metadatas).toHaveLength(2);
    });

    it('未初始化时自动初始化', async () => {
      const chromaManager = await getChromaManager();
      expect(chromaManager.isConnected()).toBe(false);

      await chromaManager.upsertChunks(sampleChunks, sampleEmbeddings);

      expect(chromaManager.isConnected()).toBe(true);
      expect(mockUpsert).toHaveBeenCalled();
    });
  });

  describe('queryChunks', () => {
    it('查询返回正确格式的结果', async () => {
      const chromaManager = await getChromaManager();
      await chromaManager.initialize();

      const results = await chromaManager.queryChunks([0.5, 0.6, 0.7], 5);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        id: 'id1',
        content: 'content1',
        metadata: { sourceFile: 'test.md', headingText: 'H1' },
        distance: 0.1,
      });
      expect(results[1]).toEqual({
        id: 'id2',
        content: 'content2',
        metadata: { sourceFile: 'test.md', headingText: 'H2' },
        distance: 0.2,
      });
      expect(mockQuery).toHaveBeenCalledWith({
        queryEmbeddings: [[0.5, 0.6, 0.7]],
        nResults: 5,
      });
    });

    it('无结果时返回空数组', async () => {
      mockQuery.mockResolvedValueOnce({
        ids: [[]],
        documents: [[]],
        metadatas: [[]],
        distances: [[]],
      });

      const chromaManager = await getChromaManager();
      await chromaManager.initialize();

      const results = await chromaManager.queryChunks([0.1, 0.2], 3);
      expect(results).toEqual([]);
    });
  });

  describe('deleteFileChunks', () => {
    it('按 sourceFile 过滤删除', async () => {
      const chromaManager = await getChromaManager();
      await chromaManager.initialize();

      await chromaManager.deleteFileChunks('test.md');

      expect(mockDelete).toHaveBeenCalledWith({
        where: { sourceFile: 'test.md' },
      });
    });
  });

  describe('resetCollection', () => {
    it('重置：删除并重建集合', async () => {
      const chromaManager = await getChromaManager();
      await chromaManager.initialize();

      await chromaManager.resetCollection();

      expect(mockDeleteCollection).toHaveBeenCalledWith({ name: 'smart_note_demo' });
      // 重建应该调用 getOrCreateCollection
      expect(mockGetOrCreate).toHaveBeenCalledTimes(2); // init + reset
    });

    it('连接状态在重置后保持', async () => {
      const chromaManager = await getChromaManager();
      await chromaManager.initialize();
      await chromaManager.resetCollection();

      expect(chromaManager.isConnected()).toBe(true);
    });
  });

  describe('isConnected', () => {
    it('初始化前返回 false', async () => {
      const chromaManager = await getChromaManager();
      expect(chromaManager.isConnected()).toBe(false);
    });
  });
});
