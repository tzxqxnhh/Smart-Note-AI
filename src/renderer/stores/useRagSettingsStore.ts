import { create } from 'zustand';
import type { ChunkerSettings } from '@shared/types';
import * as ipcClient from '../lib/ipc-client';

/**
 * RAG 文本切分配置 Store
 */
interface RagSettingsState {
  /** 设置窗口是否打开 */
  isOpen: boolean;
  /** 目标文件路径 */
  targetFilePath: string | null;
  /** 切分配置 */
  settings: ChunkerSettings;
  /** 是否正在索引 */
  isIndexing: boolean;

  /** 打开设置窗口 */
  openSettings: (filePath: string) => void;
  /** 关闭设置窗口 */
  closeSettings: () => void;
  /** 设置最大切分字符数 */
  setMaxChunkSize: (size: number) => void;
  /** 设置最大重叠字符数 */
  setMaxOverlap: (overlap: number) => void;
  /** 设置分隔符 */
  setSeparator: (separator: string) => void;
  /** 确认切分并索引 */
  confirmIndex: () => Promise<void>;
}

export const useRagSettingsStore = create<RagSettingsState>((set, get) => ({
  isOpen: false,
  targetFilePath: null,
  settings: {
    maxChunkSize: 2000,
    maxOverlap: 0,
    separator: '##',
  },
  isIndexing: false,

  openSettings: (filePath) => set({ isOpen: true, targetFilePath: filePath }),

  closeSettings: () => set({ isOpen: false, targetFilePath: null, isIndexing: false }),

  setMaxChunkSize: (maxChunkSize) =>
    set((state) => ({ settings: { ...state.settings, maxChunkSize } })),

  setMaxOverlap: (maxOverlap) =>
    set((state) => ({ settings: { ...state.settings, maxOverlap } })),

  setSeparator: (separator) =>
    set((state) => ({ settings: { ...state.settings, separator } })),

  confirmIndex: async () => {
    const { targetFilePath, settings } = get();
    if (!targetFilePath) return;
    set({ isIndexing: true });
    try {
      await ipcClient.ragIndexFile(targetFilePath, settings);
      set({ isIndexing: false, isOpen: false, targetFilePath: null });

      // 如果向量库管理面板打开，自动刷新
      const { useVectorDbStore } = await import('./useVectorDbStore');
      if (useVectorDbStore.getState().isOpen) {
        await useVectorDbStore.getState().loadChunks();
      }
    } catch (err) {
      console.error('索引失败:', err);
      set({ isIndexing: false });
    }
  },
}));
