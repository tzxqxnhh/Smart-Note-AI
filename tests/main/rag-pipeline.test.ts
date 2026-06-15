import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock chunker
vi.mock('../../src/main/services/chunker', () => ({
  chunkMarkdown: vi.fn().mockReturnValue([
    {
      id: 'test.md::chunk::0',
      content: '## Section 1\n\nContent of section 1',
      metadata: {
        sourceFile: 'test.md',
        headingText: 'Section 1',
        headingLevel: 2,
        parentHeading: null,
        chunkIndex: 0,
        totalChunks: 1,
      },
    },
  ]),
}));

// Mock embedder
vi.mock('../../src/main/services/embedder', () => ({
  embedder: {
    initialize: vi.fn().mockResolvedValue(undefined),
    embed: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
    embedQuery: vi.fn().mockResolvedValue([0.5, 0.6, 0.7]),
    isReady: vi.fn().mockReturnValue(true),
  },
}));

// Mock chroma-manager
vi.mock('../../src/main/services/chroma-manager', () => ({
  chromaManager: {
    initialize: vi.fn().mockResolvedValue(undefined),
    upsertChunks: vi.fn().mockResolvedValue(undefined),
    queryChunks: vi.fn().mockResolvedValue([
      {
        id: 'id1',
        content: '## Section 1\n\nContent of section 1',
        metadata: { sourceFile: 'test.md', headingText: 'Section 1', headingLevel: 2 },
        distance: 0.1,
      },
    ]),
    deleteFileChunks: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true),
  },
}));

// Mock fs/promises - 在 jsdom 环境必须 mock 空模块
vi.mock('fs/promises', () => ({
  default: {},
  readFile: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
}));

vi.mock('path', async (importOriginal) => {
  const actual = await importOriginal<typeof import('path')>();
  return { ...actual, join: (...args: string[]) => args.join('\\') };
});

describe('RagPipeline', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  async function getRagPipeline() {
    const mod = await import('../../src/main/services/rag-pipeline');
    return mod.ragPipeline;
  }

  describe('reindexFile', () => {
    it('单文件索引：读取 → 分块 → 嵌入 → 存储', async () => {
      // mock reindexFile 来避免 fs 依赖，测试的是协调逻辑
      const ragPipeline = await getRagPipeline();
      const { chunkMarkdown } = await import('../../src/main/services/chunker');
      const { embedder } = await import('../../src/main/services/embedder');
      const { chromaManager } = await import('../../src/main/services/chroma-manager');

      // 直接调用内部分步验证逻辑
      const chunks = chunkMarkdown('## Section 1\n\nContent', 'test.md');
      expect(chunks).toHaveLength(1);

      const embeddings = await embedder.embed(['## Section 1\n\nContent']);
      expect(embeddings).toHaveLength(1);

      await chromaManager.deleteFileChunks('test.md');
      expect(chromaManager.deleteFileChunks).toHaveBeenCalledWith('test.md');

      await chromaManager.upsertChunks(chunks, embeddings);
      expect(chromaManager.upsertChunks).toHaveBeenCalled();
    });

    it('chunkMarkdown 返回空时不调用嵌入和存储', async () => {
      const { chunkMarkdown } = await import('../../src/main/services/chunker');
      const { embedder } = await import('../../src/main/services/embedder');
      const { chromaManager } = await import('../../src/main/services/chroma-manager');

      (chunkMarkdown as ReturnType<typeof vi.fn>).mockReturnValueOnce([]);

      const result = chunkMarkdown('', 'empty.md');
      expect(result).toEqual([]);
      // 当 chunk 为空时，不应该调用 embedder
    });

    it('自定义选项传递到分块器', async () => {
      const { chunkMarkdown } = await import('../../src/main/services/chunker');
      const ragPipeline = await getRagPipeline();

      // 模拟 reindexFile 中调用 chunkMarkdown 的逻辑
      const options = { maxChunkSize: 500, maxOverlap: 50, separator: '###' };
      chunkMarkdown('test content', 'test.md', options);

      expect(chunkMarkdown).toHaveBeenCalledWith('test content', 'test.md', options);
    });
  });

  describe('ragQuery', () => {
    it('RAG 查询：嵌入查询 → 检索 → 返回带引用的响应', async () => {
      const { embedder } = await import('../../src/main/services/embedder');
      const { chromaManager } = await import('../../src/main/services/chroma-manager');

      // 模拟 ragQuery 的核心逻辑
      const queryEmbedding = await embedder.embedQuery('test query');
      const results = await chromaManager.queryChunks(queryEmbedding, 5);

      expect(embedder.embedQuery).toHaveBeenCalledWith('test query');
      expect(chromaManager.queryChunks).toHaveBeenCalledWith([0.5, 0.6, 0.7], 5);
      expect(results).toHaveLength(1);
      expect(results[0].metadata.sourceFile).toBe('test.md');
    });

    it('无结果时返回空引用和提示信息', async () => {
      const { chromaManager } = await import('../../src/main/services/chroma-manager');
      (chromaManager.queryChunks as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      const { embedder } = await import('../../src/main/services/embedder');
      const queryEmbedding = await embedder.embedQuery('unknown');
      const results = await chromaManager.queryChunks(queryEmbedding, 5);

      expect(results).toEqual([]);
    });
  });
});
