import { create } from 'zustand';
import type { FileNode } from '@shared/types';

interface ExplorerState {
  // 状态
  rootPath: string | null;
  tree: FileNode[];
  selectedPath: string | null;
  expandedPaths: Set<string>;
  isLoading: boolean;

  // 复制/粘贴剪切板
  clipboardPath: string | null;

  // 操作
  setRootPath: (path: string | null) => void;
  setTree: (tree: FileNode[]) => void;
  selectNode: (path: string | null) => void;
  toggleExpand: (path: string) => void;
  setLoading: (loading: boolean) => void;
  setClipboardPath: (path: string | null) => void;
}

export const useExplorerStore = create<ExplorerState>((set) => ({
  // 初始状态
  rootPath: null,
  tree: [],
  selectedPath: null,
  expandedPaths: new Set(),
  isLoading: false,
  clipboardPath: null,

  setRootPath: (rootPath) => set({ rootPath }),

  setTree: (tree) => set({ tree }),

  selectNode: (selectedPath) => set({ selectedPath }),

  toggleExpand: (path) =>
    set((state) => {
      const next = new Set(state.expandedPaths);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return { expandedPaths: next };
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setClipboardPath: (clipboardPath) => set({ clipboardPath }),
}));

// 用于测试的 reset 函数
export function resetExplorerStore(): void {
  useExplorerStore.setState({
    rootPath: null,
    tree: [],
    selectedPath: null,
    expandedPaths: new Set(),
    isLoading: false,
    clipboardPath: null,
  });
}
