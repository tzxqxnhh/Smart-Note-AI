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
const mockGet = vi.fn().mockResolvedValue({
  ids: [],
  documents: [],
  metadatas: [],
});
const mockCount = vi.fn().mockResolvedValue(0);
const mockGetOrCreate = vi.fn().mockResolvedValue({
  upsert: mockUpsert,
  query: mockQuery,
  delete: mockDelete,
  get: mockGet,
  count: mockCount,
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

    it('metadata 包含 storedAt 时间戳', async () => {
      const chromaManager = await getChromaManager();
      await chromaManager.initialize();

      await chromaManager.upsertChunks(sampleChunks, sampleEmbeddings);

      const callArgs = mockUpsert.mock.calls[0][0];
      expect(callArgs.metadatas).toHaveLength(2);
      // 验证每一条 metadata 都包含 ISO 8601 格式的 storedAt
      for (const meta of callArgs.metadatas) {
        expect(meta.storedAt).toBeDefined();
        expect(typeof meta.storedAt).toBe('string');
        // ISO 8601 格式应包含 T 分隔符
        expect(meta.storedAt).toContain('T');
      }
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

  describe('listFileChunks', () => {
    it('返回按文件分组的结果', async () => {
      mockGet.mockResolvedValueOnce({
        ids: ['test.md::chunk::0', 'test.md::chunk::1', 'other.md::chunk::0'],
        documents: ['内容A', '内容B', '内容C'],
        metadatas: [
          { sourceFile: 'test.md', headingText: 'H1', storedAt: '2025-01-01T00:00:00.000Z' },
          { sourceFile: 'test.md', headingText: 'H2', storedAt: '2025-01-01T00:00:01.000Z' },
          { sourceFile: 'other.md', headingText: '标题', storedAt: '2025-01-01T00:00:02.000Z' },
        ],
      });

      const chromaManager = await getChromaManager();
      await chromaManager.initialize();

      const result = await chromaManager.listFileChunks();

      expect(result).toHaveLength(2); // 两个文件

      // 按文件名排序：other.md 应在 test.md 之前
      expect(result[0].filePath).toBe('other.md');
      expect(result[0].fileName).toBe('other.md');
      expect(result[0].chunkCount).toBe(1);
      expect(result[0].chunks).toHaveLength(1);
      expect(result[0].chunks[0].id).toBe('other.md::chunk::0');
      expect(result[0].chunks[0].contentPreview).toBe('内容C');
      expect(result[0].chunks[0].storedAt).toBe('2025-01-01T00:00:02.000Z');

      expect(result[1].filePath).toBe('test.md');
      expect(result[1].chunkCount).toBe(2);
      expect(result[1].chunks).toHaveLength(2);
    });

    it('空集合返回空数组', async () => {
      mockGet.mockResolvedValueOnce({
        ids: [],
        documents: [],
        metadatas: [],
      });

      const chromaManager = await getChromaManager();
      await chromaManager.initialize();

      const result = await chromaManager.listFileChunks();
      expect(result).toEqual([]);
    });

    it('contentPreview 截取前 10 个字符', async () => {
      mockGet.mockResolvedValueOnce({
        ids: ['f.md::chunk::0'],
        documents: ['1234567890ABCDEFG'],
        metadatas: [{ sourceFile: 'f.md', headingText: 'H', storedAt: '2025-01-01T00:00:00.000Z' }],
      });

      const chromaManager = await getChromaManager();
      await chromaManager.initialize();

      const result = await chromaManager.listFileChunks();
      expect(result[0].chunks[0].contentPreview).toBe('1234567890');
    });
  });

  describe('getChunkDetail', () => {
    it('有效 ID 返回详情', async () => {
      mockGet.mockResolvedValueOnce({
        ids: ['test.md::chunk::0'],
        documents: ['完整内容'],
        metadatas: [{ sourceFile: 'test.md', headingText: 'H1', storedAt: '2025-01-01T00:00:00.000Z' }],
      });

      const chromaManager = await getChromaManager();
      await chromaManager.initialize();

      const detail = await chromaManager.getChunkDetail('test.md::chunk::0');

      expect(detail).not.toBeNull();
      expect(detail!.id).toBe('test.md::chunk::0');
      expect(detail!.content).toBe('完整内容');
      expect(detail!.sourceFile).toBe('test.md');
      expect(detail!.headingText).toBe('H1');
      expect(detail!.storedAt).toBe('2025-01-01T00:00:00.000Z');
    });

    it('无效 ID 返回 null', async () => {
      mockGet.mockResolvedValueOnce({
        ids: [],
        documents: [],
        metadatas: [],
      });

      const chromaManager = await getChromaManager();
      await chromaManager.initialize();

      const detail = await chromaManager.getChunkDetail('nonexistent');
      expect(detail).toBeNull();
    });
  });

  describe('deleteChunks', () => {
    it('调用 collection.delete 传入正确 IDs', async () => {
      const chromaManager = await getChromaManager();
      await chromaManager.initialize();

      await chromaManager.deleteChunks(['id1', 'id2']);

      expect(mockDelete).toHaveBeenCalledWith({ ids: ['id1', 'id2'] });
    });

    it('空数组不做任何操作', async () => {
      const chromaManager = await getChromaManager();
      await chromaManager.initialize();

      // 清除之前的调用记录
      mockDelete.mockClear();

      await chromaManager.deleteChunks([]);

      expect(mockDelete).not.toHaveBeenCalled();
    });
  });

  describe('getChunkCount', () => {
    it('返回 collection.count 的数字', async () => {
      mockCount.mockResolvedValueOnce(42);

      const chromaManager = await getChromaManager();
      await chromaManager.initialize();

      const count = await chromaManager.getChunkCount();
      expect(count).toBe(42);
      expect(mockCount).toHaveBeenCalled();
    });

    it('空集合返回 0', async () => {
      mockCount.mockResolvedValueOnce(0);

      const chromaManager = await getChromaManager();
      await chromaManager.initialize();

      const count = await chromaManager.getChunkCount();
      expect(count).toBe(0);
    });
  });
});
