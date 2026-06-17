import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock ipc-client
const mockRagListFileChunks = vi.fn().mockResolvedValue([]);
const mockRagDeleteChunks = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/ipc-client', () => ({
  ragListFileChunks: mockRagListFileChunks,
  ragDeleteChunks: mockRagDeleteChunks,
}));

describe('useVectorDbStore', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    // 重置 mock 默认值
    mockRagListFileChunks.mockResolvedValue([]);
    mockRagDeleteChunks.mockResolvedValue(undefined);
  });

  async function getStore() {
    const mod = await import('@/stores/useVectorDbStore');
    return mod.useVectorDbStore;
  }

  describe('初始状态', () => {
    it('isOpen 为 false', async () => {
      const useVectorDbStore = await getStore();
      expect(useVectorDbStore.getState().isOpen).toBe(false);
    });

    it('batchMode 为 false', async () => {
      const useVectorDbStore = await getStore();
      expect(useVectorDbStore.getState().batchMode).toBe(false);
    });

    it('fileGroups 为空数组', async () => {
      const useVectorDbStore = await getStore();
      expect(useVectorDbStore.getState().fileGroups).toEqual([]);
    });

    it('expandedFiles 为空 Set', async () => {
      const useVectorDbStore = await getStore();
      expect(useVectorDbStore.getState().expandedFiles.size).toBe(0);
    });

    it('selectedChunkIds 为空 Set', async () => {
      const useVectorDbStore = await getStore();
      expect(useVectorDbStore.getState().selectedChunkIds.size).toBe(0);
    });

    it('detailChunkId 为 null', async () => {
      const useVectorDbStore = await getStore();
      expect(useVectorDbStore.getState().detailChunkId).toBeNull();
    });

    it('loading 为 false', async () => {
      const useVectorDbStore = await getStore();
      expect(useVectorDbStore.getState().loading).toBe(false);
    });

    it('error 为 null', async () => {
      const useVectorDbStore = await getStore();
      expect(useVectorDbStore.getState().error).toBeNull();
    });
  });

  describe('openPanel', () => {
    it('设置 isOpen 为 true 并自动调用 loadChunks', async () => {
      mockRagListFileChunks.mockResolvedValueOnce([
        {
          filePath: 'notes/test.md',
          fileName: 'test.md',
          chunkCount: 1,
          chunks: [{ id: 'c1', contentPreview: '预览内容', storedAt: '2025-01-01T00:00:00.000Z' }],
        },
      ]);

      const useVectorDbStore = await getStore();
      await useVectorDbStore.getState().openPanel();

      expect(useVectorDbStore.getState().isOpen).toBe(true);
      expect(mockRagListFileChunks).toHaveBeenCalled();
      expect(useVectorDbStore.getState().fileGroups).toHaveLength(1);
    });
  });

  describe('closePanel', () => {
    it('重置全部状态', async () => {
      const useVectorDbStore = await getStore();
      // 先设置一些非默认状态
      useVectorDbStore.setState({
        isOpen: true,
        batchMode: true,
        fileGroups: [{ filePath: 'x.md', fileName: 'x.md', chunkCount: 1, chunks: [] }],
        expandedFiles: new Set(['x.md']),
        selectedChunkIds: new Set(['c1']),
        detailChunkId: 'c1',
        loading: true,
        error: 'some error',
      });

      useVectorDbStore.getState().closePanel();

      const state = useVectorDbStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.batchMode).toBe(false);
      expect(state.fileGroups).toEqual([]);
      expect(state.expandedFiles.size).toBe(0);
      expect(state.selectedChunkIds.size).toBe(0);
      expect(state.detailChunkId).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('loadChunks', () => {
    it('成功加载时填充 fileGroups', async () => {
      const sampleData = [
        {
          filePath: 'notes/test.md',
          fileName: 'test.md',
          chunkCount: 2,
          chunks: [
            { id: 'c1', contentPreview: '第一段内容', storedAt: '2025-01-01T00:00:00.000Z' },
            { id: 'c2', contentPreview: '第二段内容', storedAt: '2025-01-01T00:00:01.000Z' },
          ],
        },
      ];
      mockRagListFileChunks.mockResolvedValueOnce(sampleData);

      const useVectorDbStore = await getStore();
      await useVectorDbStore.getState().loadChunks();

      const state = useVectorDbStore.getState();
      expect(state.fileGroups).toEqual(sampleData);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('加载失败时设置 error', async () => {
      mockRagListFileChunks.mockRejectedValueOnce(new Error('连接失败'));

      const useVectorDbStore = await getStore();
      await useVectorDbStore.getState().loadChunks();

      const state = useVectorDbStore.getState();
      expect(state.error).toBe('连接失败');
      expect(state.loading).toBe(false);
      expect(state.fileGroups).toEqual([]);
    });
  });

  describe('toggleFileExpand', () => {
    it('展开未展开的文件', async () => {
      const useVectorDbStore = await getStore();
      useVectorDbStore.getState().toggleFileExpand('test.md');

      expect(useVectorDbStore.getState().expandedFiles.has('test.md')).toBe(true);
    });

    it('折叠已展开的文件', async () => {
      const useVectorDbStore = await getStore();
      useVectorDbStore.getState().toggleFileExpand('test.md');
      useVectorDbStore.getState().toggleFileExpand('test.md');

      expect(useVectorDbStore.getState().expandedFiles.has('test.md')).toBe(false);
    });
  });

  describe('批量模式', () => {
    it('enterBatchMode 设置 batchMode 为 true 并清空勾选', async () => {
      const useVectorDbStore = await getStore();
      useVectorDbStore.setState({ selectedChunkIds: new Set(['c1']) });

      useVectorDbStore.getState().enterBatchMode();

      expect(useVectorDbStore.getState().batchMode).toBe(true);
      expect(useVectorDbStore.getState().selectedChunkIds.size).toBe(0);
    });

    it('exitBatchMode 设置 batchMode 为 false 并清空勾选', async () => {
      const useVectorDbStore = await getStore();
      useVectorDbStore.setState({ batchMode: true, selectedChunkIds: new Set(['c1']) });

      useVectorDbStore.getState().exitBatchMode();

      expect(useVectorDbStore.getState().batchMode).toBe(false);
      expect(useVectorDbStore.getState().selectedChunkIds.size).toBe(0);
    });
  });

  describe('toggleChunkSelection', () => {
    it('选中未选中的切片', async () => {
      const useVectorDbStore = await getStore();
      useVectorDbStore.getState().toggleChunkSelection('c1');

      expect(useVectorDbStore.getState().selectedChunkIds.has('c1')).toBe(true);
    });

    it('取消已选中的切片', async () => {
      const useVectorDbStore = await getStore();
      useVectorDbStore.getState().toggleChunkSelection('c1');
      useVectorDbStore.getState().toggleChunkSelection('c1');

      expect(useVectorDbStore.getState().selectedChunkIds.has('c1')).toBe(false);
    });
  });

  describe('toggleFileSelection', () => {
    it('选中整个文件的所有切片', async () => {
      const useVectorDbStore = await getStore();
      useVectorDbStore.setState({
        fileGroups: [
          {
            filePath: 'test.md',
            fileName: 'test.md',
            chunkCount: 2,
            chunks: [
              { id: 'c1', contentPreview: 'A', storedAt: null },
              { id: 'c2', contentPreview: 'B', storedAt: null },
            ],
          },
        ],
      });

      useVectorDbStore.getState().toggleFileSelection('test.md');

      const selected = useVectorDbStore.getState().selectedChunkIds;
      expect(selected.has('c1')).toBe(true);
      expect(selected.has('c2')).toBe(true);
    });

    it('取消整个文件的选中（当全部已选中时）', async () => {
      const useVectorDbStore = await getStore();
      useVectorDbStore.setState({
        fileGroups: [
          {
            filePath: 'test.md',
            fileName: 'test.md',
            chunkCount: 2,
            chunks: [
              { id: 'c1', contentPreview: 'A', storedAt: null },
              { id: 'c2', contentPreview: 'B', storedAt: null },
            ],
          },
        ],
        selectedChunkIds: new Set(['c1', 'c2']),
      });

      useVectorDbStore.getState().toggleFileSelection('test.md');

      expect(useVectorDbStore.getState().selectedChunkIds.size).toBe(0);
    });
  });

  describe('confirmBatchDelete', () => {
    it('删除选中切片并刷新和退出批量模式', async () => {
      mockRagDeleteChunks.mockResolvedValueOnce(undefined);
      mockRagListFileChunks.mockResolvedValueOnce([]);

      const useVectorDbStore = await getStore();
      useVectorDbStore.setState({
        batchMode: true,
        selectedChunkIds: new Set(['c1', 'c2']),
      });

      await useVectorDbStore.getState().confirmBatchDelete();

      expect(mockRagDeleteChunks).toHaveBeenCalledWith(['c1', 'c2']);
      expect(mockRagListFileChunks).toHaveBeenCalled(); // 刷新
      expect(useVectorDbStore.getState().batchMode).toBe(false);
      expect(useVectorDbStore.getState().selectedChunkIds.size).toBe(0);
    });

    it('无选中切片时不做任何操作', async () => {
      const useVectorDbStore = await getStore();
      useVectorDbStore.setState({ batchMode: true, selectedChunkIds: new Set() });

      await useVectorDbStore.getState().confirmBatchDelete();

      expect(mockRagDeleteChunks).not.toHaveBeenCalled();
    });
  });

  describe('openDetail / closeDetail', () => {
    it('openDetail 设置 detailChunkId', async () => {
      const useVectorDbStore = await getStore();
      useVectorDbStore.getState().openDetail('c1');

      expect(useVectorDbStore.getState().detailChunkId).toBe('c1');
    });

    it('closeDetail 设置 detailChunkId 为 null', async () => {
      const useVectorDbStore = await getStore();
      useVectorDbStore.getState().openDetail('c1');
      useVectorDbStore.getState().closeDetail();

      expect(useVectorDbStore.getState().detailChunkId).toBeNull();
    });
  });

  describe('deleteSingleChunk', () => {
    it('删除单个切片并刷新并关闭详情', async () => {
      mockRagDeleteChunks.mockResolvedValueOnce(undefined);
      mockRagListFileChunks.mockResolvedValueOnce([]);

      const useVectorDbStore = await getStore();
      useVectorDbStore.setState({ detailChunkId: 'c1' });

      await useVectorDbStore.getState().deleteSingleChunk('c1');

      expect(mockRagDeleteChunks).toHaveBeenCalledWith(['c1']);
      expect(mockRagListFileChunks).toHaveBeenCalled(); // 刷新
      expect(useVectorDbStore.getState().detailChunkId).toBeNull();
    });
  });
});
