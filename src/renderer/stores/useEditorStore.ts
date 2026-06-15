import { create } from 'zustand';
import type { Tab, ViewMode } from '@shared/types';
import * as ipcClient from '../lib/ipc-client';

interface EditorState {
  // 状态
  tabs: Tab[];
  activeTabId: string | null;
  // 内容缓存（filePath -> content）
  contents: Record<string, string>;
  viewMode: ViewMode;

  // 操作
  openFile: (filePath: string) => Promise<void>;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateContent: (filePath: string, content: string) => void;
  getContent: (filePath: string) => string | undefined;
  saveFile: (filePath: string) => Promise<void>;
  saveCurrentFile: () => Promise<void>;
  toggleViewMode: () => void;
}

let tabCounter = 0;

function generateTabId(): string {
  return `tab-${++tabCounter}-${Date.now()}`;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // 初始状态
  tabs: [],
  activeTabId: null,
  contents: {},
  viewMode: 'edit',

  // 打开文件
  openFile: async (filePath: string) => {
    // 检查是否已经打开
    const state = get();
    const existingTab = state.tabs.find((t) => t.filePath === filePath);
    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return;
    }

    // 读取文件内容
    const content = await ipcClient.readFile(filePath);

    // 获取文件名作为标题
    const title = filePath.replace(/^.*[\\/]/, '');

    // 创建新 Tab
    const newTab: Tab = {
      id: generateTabId(),
      filePath,
      title,
      isDirty: false,
    };

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
      contents: { ...state.contents, [filePath]: content },
    }));
  },

  // 关闭 Tab
  closeTab: (tabId: string) => {
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== tabId);
      let newActiveTabId = state.activeTabId;

      if (state.activeTabId === tabId) {
        // 激活相邻的 Tab
        const idx = state.tabs.findIndex((t) => t.id === tabId);
        if (newTabs.length > 0) {
          const newIdx = Math.min(idx, newTabs.length - 1);
          newActiveTabId = newTabs[newIdx].id;
        } else {
          newActiveTabId = null;
        }
      }

      return { tabs: newTabs, activeTabId: newActiveTabId };
    });
  },

  // 设置活动 Tab
  setActiveTab: (tabId: string) => set({ activeTabId: tabId }),

  // 更新内容（标记脏）
  updateContent: (filePath: string, content: string) => {
    set((state) => ({
      contents: { ...state.contents, [filePath]: content },
      tabs: state.tabs.map((t) =>
        t.filePath === filePath ? { ...t, isDirty: true } : t,
      ),
    }));
  },

  // 获取缓存的内容
  getContent: (filePath: string) => {
    return get().contents[filePath];
  },

  // 保存文件
  saveFile: async (filePath: string) => {
    const content = get().contents[filePath];
    if (content !== undefined) {
      await ipcClient.writeFile(filePath, content);
      set((state) => ({
        tabs: state.tabs.map((t) =>
          t.filePath === filePath ? { ...t, isDirty: false } : t,
        ),
      }));
    }
  },

  // 保存当前活动文件
  saveCurrentFile: async () => {
    const state = get();
    if (!state.activeTabId) return;
    const activeTab = state.tabs.find((t) => t.id === state.activeTabId);
    if (activeTab) {
      await get().saveFile(activeTab.filePath);
    }
  },

  // 切换视图模式
  toggleViewMode: () => {
    set((state) => {
      const modes: ViewMode[] = ['edit', 'preview', 'split'];
      const currentIdx = modes.indexOf(state.viewMode);
      const nextMode = modes[(currentIdx + 1) % modes.length];
      return { viewMode: nextMode };
    });
  },
}));

// 用于测试的重置函数
export function resetEditorStore(): void {
  useEditorStore.setState({
    tabs: [],
    activeTabId: null,
    contents: {},
    viewMode: 'edit',
  });
}
