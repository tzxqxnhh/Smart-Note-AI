import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/ipc-channels';

// 暴露给渲染进程的 API
const electronAPI = {
  // 工作空间
  selectDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.SELECT_DIRECTORY),
  getWorkspacePath: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_WORKSPACE_PATH),

  // 文件操作
  readFile: (filePath: string): Promise<string> =>
    ipcRenderer.invoke(IPC_CHANNELS.READ_FILE, filePath),
  writeFile: (filePath: string, content: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.WRITE_FILE, filePath, content),
  listDirectory: (dirPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.LIST_DIRECTORY, dirPath),
  createFile: (parentDir: string, name: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.CREATE_FILE, parentDir, name),
  createDirectory: (parentDir: string, name: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.CREATE_DIRECTORY, parentDir, name),
  rename: (oldPath: string, newName: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.RENAME, oldPath, newName),
  deleteItem: (itemPath: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.DELETE, itemPath),
  trashItem: (itemPath: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.TRASH_ITEM, itemPath),
  copyItem: (sourcePath: string, destDir: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.FS_COPY, sourcePath, destDir),

  // 搜索
  searchFiles: (query: string, rootPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SEARCH, query, rootPath),

  // RAG 操作
  ragIndexAll: (workspacePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.RAG_INDEX_ALL, workspacePath),
  ragQuery: (query: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.RAG_QUERY, query),
  ragGetStatus: () =>
    ipcRenderer.invoke(IPC_CHANNELS.RAG_GET_STATUS),
  ragResetIndex: () =>
    ipcRenderer.invoke(IPC_CHANNELS.RAG_RESET_INDEX),

  // LLM 操作
  llmChat: (messages: unknown[]) =>
    ipcRenderer.invoke(IPC_CHANNELS.LLM_CHAT, messages),
  llmSummarize: (text: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.LLM_SUMMARIZE, text),
  llmExpand: (text: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.LLM_EXPAND, text),
  llmFormat: (text: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.LLM_FORMAT, text),
  llmGenerateTree: (folderPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.LLM_GENERATE_TREE, folderPath),

  // 文件监控事件监听
  onFileChanged: (callback: (event: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown): void => callback(data);
    ipcRenderer.on(IPC_CHANNELS.FILE_CHANGED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.FILE_CHANGED, handler);
  },

  // RAG 索引进度监听
  onIndexProgress: (callback: (data: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown): void => callback(data);
    ipcRenderer.on(IPC_CHANNELS.RAG_INDEX_PROGRESS, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.RAG_INDEX_PROGRESS, handler);
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 类型声明
export type ElectronAPI = typeof electronAPI;
