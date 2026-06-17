import { create } from 'zustand';
import type { ChatMessage, AgentStatus, AgentAction, ToolStep } from '@shared/types';
import * as ipcClient from '../lib/ipc-client';
import type { LlmStreamChunkData, LlmStreamEndData } from '../lib/ipc-client';

interface AgentState {
  messages: ChatMessage[];
  isProcessing: boolean;
  status: AgentStatus;
  selectedText: string | null;
  selectedFolderPath: string | null;
  indexStats: { fileCount: number; chunkCount: number } | null;
  streamingMessage: ChatMessage | null;
  toolSteps: ToolStep[];
  vectorDbEnabled: boolean;

  // 操作
  addMessage: (msg: ChatMessage) => void;
  sendQuery: (query: string) => Promise<void>;
  runPresetAction: (action: AgentAction) => Promise<void>;
  clearHistory: () => void;
  setStatus: (status: AgentStatus) => void;
  setSelectedText: (text: string | null) => void;
  setSelectedFolder: (path: string | null) => void;
  toggleVectorDb: () => void;
}

let msgCounter = 0;

// 保存流式监听器的取消函数，用于清理
let unsubChunk: (() => void) | null = null;
let unsubEnd: (() => void) | null = null;

/**
 * 清理流式监听器
 */
function cleanupStreamListeners(): void {
  if (unsubChunk) {
    unsubChunk();
    unsubChunk = null;
  }
  if (unsubEnd) {
    unsubEnd();
    unsubEnd = null;
  }
}

export const useAgentStore = create<AgentState>((set, get) => ({
  messages: [],
  isProcessing: false,
  status: 'idle',
  selectedText: null,
  selectedFolderPath: null,
  indexStats: null,
  streamingMessage: null,
  toolSteps: [],
  vectorDbEnabled: true,

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  // RAG 流式问答
  sendQuery: async (query: string) => {
    const messageId = `msg-${++msgCounter}`;

    // 1. 添加用户消息
    const userMsg: ChatMessage = {
      id: `msg-${++msgCounter}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };
    get().addMessage(userMsg);

    // 清理上一次的流式监听器（防御性编程）
    cleanupStreamListeners();

    // 2. 初始化流式消息
    const streamingMsg: ChatMessage = {
      id: messageId,
      role: 'agent',
      content: '',
      citations: [],
      toolSteps: [],
      timestamp: new Date().toISOString(),
    };

    set({
      isProcessing: true,
      status: 'thinking',
      streamingMessage: streamingMsg,
      toolSteps: [],
    });

    // 3. 注册流式监听
    unsubChunk = ipcClient.onLlmStreamChunk((data: LlmStreamChunkData) => {
      if (data.messageId !== messageId) return;

      set((s) => {
        if (!s.streamingMessage || s.streamingMessage.id !== messageId) return {};

        const newToolSteps =
          data.toolSteps && data.toolSteps.length > 0
            ? [...s.toolSteps, ...data.toolSteps]
            : s.toolSteps;

        return {
          status: 'generating',
          streamingMessage: {
            ...s.streamingMessage,
            content: s.streamingMessage.content + (data.content || ''),
          },
          toolSteps: newToolSteps,
        };
      });
    });

    unsubEnd = ipcClient.onLlmStreamEnd((data: LlmStreamEndData) => {
      if (data.messageId !== messageId) return;

      const currentStreaming = get().streamingMessage;
      const currentToolSteps = get().toolSteps;

      cleanupStreamListeners();

      if (data.error) {
        // 错误处理
        const errorMsg: ChatMessage = {
          id: messageId,
          role: 'agent',
          content: `出错了：${data.error}`,
          citations: [],
          toolSteps: currentToolSteps,
          timestamp: new Date().toISOString(),
        };
        set((s) => ({
          messages: [...s.messages, errorMsg],
          isProcessing: false,
          status: 'error',
          streamingMessage: null,
          toolSteps: [],
        }));
        return;
      }

      // 将流式消息固化到消息列表（toolSteps 已通过 stream-chunk 累积，此处不重复合并）
      const finalMsg: ChatMessage = {
        id: messageId,
        role: 'agent',
        content: currentStreaming?.content || data.content || '',
        citations: data.citations,
        toolSteps: currentToolSteps,
        timestamp: new Date().toISOString(),
      };

      set((s) => ({
        messages: [...s.messages, finalMsg],
        isProcessing: false,
        status: 'done',
        streamingMessage: null,
        toolSteps: [],
      }));
    });

    // 4. 发起 LLM 流式请求
    try {
      ipcClient.llmChatStream(query, messageId, get().vectorDbEnabled);
    } catch {
      cleanupStreamListeners();
      set({
        isProcessing: false,
        status: 'error',
        streamingMessage: null,
      });
    }
  },

  // 预设动作
  runPresetAction: async (action: AgentAction) => {
    const { selectedText, selectedFolderPath } = get();

    set({ isProcessing: true, status: 'thinking' });

    try {
      let result = '';

      switch (action) {
        case 'summarize': {
          if (!selectedText) {
            result = '请先在编辑器中选中需要总结的文本。';
            break;
          }
          result = await ipcClient.llmSummarize(selectedText);
          break;
        }
        case 'expand': {
          if (!selectedText) {
            result = '请先在编辑器中选中需要扩写的文本。';
            break;
          }
          result = await ipcClient.llmExpand(selectedText);
          break;
        }
        case 'format': {
          if (!selectedText) {
            result = '请先在编辑器中选中需要格式化的文本。';
            break;
          }
          result = await ipcClient.llmFormat(selectedText);
          break;
        }
        case 'visualize': {
          if (!selectedFolderPath) {
            result = '请先在文件资源管理器中右键点击文件夹，选择生成结构图。';
            break;
          }
          const treeData = await ipcClient.llmGenerateTree(selectedFolderPath);
          result = `\`\`\`mermaid\n${treeData.mermaid}\n\`\`\`\n\n**目录结构：**\n\`\`\`\n${treeData.ascii}\n\`\`\``;
          break;
        }
        case 'ask': {
          // 'ask' 委托给 sendQuery，但需要用户输入，这里给提示
          result = '请在下方输入框中输入问题，我会基于笔记内容为你回答。';
          break;
        }
        default:
          result = '未知操作';
      }

      const agentMsg: ChatMessage = {
        id: `msg-${++msgCounter}`,
        role: 'agent',
        content: result,
        timestamp: new Date().toISOString(),
      };

      set((s) => ({
        messages: [...s.messages, agentMsg],
        isProcessing: false,
        status: 'done',
      }));
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `msg-${++msgCounter}`,
        role: 'agent',
        content: `操作失败：${err instanceof Error ? err.message : String(err)}`,
        timestamp: new Date().toISOString(),
      };

      set((s) => ({
        messages: [...s.messages, errorMsg],
        isProcessing: false,
        status: 'error',
      }));
    }
  },

  clearHistory: () =>
    set({ messages: [], streamingMessage: null, toolSteps: [] }),

  setStatus: (status) => set({ status }),

  setSelectedText: (text) => set({ selectedText: text }),

  setSelectedFolder: (path) => set({ selectedFolderPath: path }),

  toggleVectorDb: () => set((s) => ({ vectorDbEnabled: !s.vectorDbEnabled })),
}));

/** 重置 Store 到初始状态（测试用） */
export function resetAgentStore(): void {
  cleanupStreamListeners();
  msgCounter = 0;
  useAgentStore.setState({
    messages: [],
    isProcessing: false,
    status: 'idle',
    selectedText: null,
    selectedFolderPath: null,
    indexStats: null,
    streamingMessage: null,
    toolSteps: [],
    vectorDbEnabled: true,
  });
}
