import { create } from 'zustand';
import type { ChatMessage, AgentStatus, AgentAction } from '@shared/types';

interface AgentState {
  messages: ChatMessage[];
  isProcessing: boolean;
  status: AgentStatus;
  selectedText: string | null;
  selectedFolderPath: string | null;
  indexStats: { fileCount: number; chunkCount: number } | null;

  // 操作
  addMessage: (msg: ChatMessage) => void;
  sendQuery: (query: string) => Promise<void>;
  runPresetAction: (action: AgentAction) => Promise<void>;
  clearHistory: () => void;
  setStatus: (status: AgentStatus) => void;
  setSelectedText: (text: string | null) => void;
  setSelectedFolder: (path: string | null) => void;
}

let msgCounter = 0;

export const useAgentStore = create<AgentState>((set, get) => ({
  messages: [],
  isProcessing: false,
  status: 'idle',
  selectedText: null,
  selectedFolderPath: null,
  indexStats: null,

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  // 发送查询（当前返回占位消息）
  sendQuery: async (query: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${++msgCounter}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };
    get().addMessage(userMsg);

    set({ isProcessing: true, status: 'thinking' });

    // TODO: Phase 7 实现 — 调用 IPC ragQuery
    // 当前返回占位
    const placeholderMsg: ChatMessage = {
      id: `msg-${++msgCounter}`,
      role: 'agent',
      content: 'RAG 功能开发中。您的消息已收到：' + query,
      citations: [],
      timestamp: new Date().toISOString(),
    };

    set((s) => ({
      messages: [...s.messages, placeholderMsg],
      isProcessing: false,
      status: 'done',
    }));
  },

  // 预设动作（当前返回占位消息）
  runPresetAction: async (action: AgentAction) => {
    set({ isProcessing: true, status: 'thinking' });

    const actionLabels: Record<AgentAction, string> = {
      summarize: '总结',
      expand: '扩写',
      format: '格式优化',
      visualize: '生成树形结构',
      ask: 'RAG 问答',
    };

    const placeholderMsg: ChatMessage = {
      id: `msg-${++msgCounter}`,
      role: 'agent',
      content: `"${actionLabels[action]}" 功能开发中。请选择笔记内容后重试。`,
      timestamp: new Date().toISOString(),
    };

    set((s) => ({
      messages: [...s.messages, placeholderMsg],
      isProcessing: false,
      status: 'done',
    }));
  },

  clearHistory: () => set({ messages: [] }),

  setStatus: (status) => set({ status }),

  setSelectedText: (text) => set({ selectedText: text }),

  setSelectedFolder: (path) => set({ selectedFolderPath: path }),
}));
