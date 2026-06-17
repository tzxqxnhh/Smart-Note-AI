import { create } from 'zustand';
import type { FileChunkGroup } from '@shared/types';
import { ragListFileChunks, ragDeleteChunks } from '@/lib/ipc-client';

// 注意：在测试中使用此 reset 函数还原 store 初始状态
let _resetStore: (() => void) | null = null;
export function resetVectorDbStore(): void {
  _resetStore?.();
}

export interface VectorDbState {
  // 面板开关
  isOpen: boolean;
  // 批量删除模式
  batchMode: boolean;
  // 已索引文件的分组列表
  fileGroups: FileChunkGroup[];
  // 展开的文件路径集合
  expandedFiles: Set<string>;
  // 批量模式下选中的切片 ID 集合
  selectedChunkIds: Set<string>;
  // 当前查看的切片详情 ID（null 表示未打开详情弹窗）
  detailChunkId: string | null;
  // 加载状态
  loading: boolean;
  // 错误信息
  error: string | null;

  // 操作
  openPanel: () => Promise<void>;
  closePanel: () => void;
  loadChunks: () => Promise<void>;
  toggleFileExpand: (filePath: string) => void;
  enterBatchMode: () => void;
  exitBatchMode: () => void;
  toggleChunkSelection: (chunkId: string) => void;
  toggleFileSelection: (filePath: string) => void;
  confirmBatchDelete: () => Promise<void>;
  openDetail: (chunkId: string) => void;
  closeDetail: () => void;
  deleteSingleChunk: (chunkId: string) => Promise<void>;
}

const initialState = {
  isOpen: false,
  batchMode: false,
  fileGroups: [] as FileChunkGroup[],
  expandedFiles: new Set<string>(),
  selectedChunkIds: new Set<string>(),
  detailChunkId: null as string | null,
  loading: false,
  error: null as string | null,
};

export const useVectorDbStore = create<VectorDbState>((set, get) => {
  _resetStore = () => set(initialState);

  return {
    ...initialState,

    openPanel: async () => {
      set({ isOpen: true });
      // 自动加载切片列表
      await get().loadChunks();
    },

    closePanel: () => {
      set(initialState);
    },

    loadChunks: async () => {
      set({ loading: true, error: null });
      try {
        const groups = await ragListFileChunks();
        set({ fileGroups: groups, loading: false });
      } catch (err) {
        const message = err instanceof Error ? err.message : '加载失败';
        set({ error: message, loading: false, fileGroups: [] });
      }
    },

    toggleFileExpand: (filePath: string) => {
      set((state) => {
        const next = new Set(state.expandedFiles);
        if (next.has(filePath)) {
          next.delete(filePath);
        } else {
          next.add(filePath);
        }
        return { expandedFiles: next };
      });
    },

    enterBatchMode: () => {
      set({ batchMode: true, selectedChunkIds: new Set<string>() });
    },

    exitBatchMode: () => {
      set({ batchMode: false, selectedChunkIds: new Set<string>() });
    },

    toggleChunkSelection: (chunkId: string) => {
      set((state) => {
        const next = new Set(state.selectedChunkIds);
        if (next.has(chunkId)) {
          next.delete(chunkId);
        } else {
          next.add(chunkId);
        }
        return { selectedChunkIds: next };
      });
    },

    toggleFileSelection: (filePath: string) => {
      set((state) => {
        const group = state.fileGroups.find((g) => g.filePath === filePath);
        if (!group) return state;

        const chunkIds = group.chunks.map((c) => c.id);
        const allSelected = chunkIds.every((id) => state.selectedChunkIds.has(id));

        const next = new Set(state.selectedChunkIds);
        if (allSelected) {
          // 取消全部选中
          for (const id of chunkIds) next.delete(id);
        } else {
          // 选中全部
          for (const id of chunkIds) next.add(id);
        }
        return { selectedChunkIds: next };
      });
    },

    confirmBatchDelete: async () => {
      const { selectedChunkIds } = get();
      if (selectedChunkIds.size === 0) return;

      const ids = Array.from(selectedChunkIds);
      await ragDeleteChunks(ids);
      // 删除后刷新列表并退出批量模式
      await get().loadChunks();
      set({ batchMode: false, selectedChunkIds: new Set<string>() });
    },

    openDetail: (chunkId: string) => {
      set({ detailChunkId: chunkId });
    },

    closeDetail: () => {
      set({ detailChunkId: null });
    },

    deleteSingleChunk: async (chunkId: string) => {
      await ragDeleteChunks([chunkId]);
      // 删除后刷新列表并关闭详情
      await get().loadChunks();
      set({ detailChunkId: null });
    },
  };
});
