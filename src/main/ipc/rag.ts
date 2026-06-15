import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';

/**
 * 注册 RAG IPC 处理器（当前为占位实现）
 */
export function setupRagHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.RAG_INDEX_ALL, async () => {
    throw new Error('RAG 索引功能尚未实现');
  });

  ipcMain.handle(IPC_CHANNELS.RAG_QUERY, async () => {
    throw new Error('RAG 查询功能尚未实现');
  });

  ipcMain.handle(IPC_CHANNELS.RAG_GET_STATUS, async () => {
    return null; // 索引未构建
  });

  ipcMain.handle(IPC_CHANNELS.RAG_RESET_INDEX, async () => {
    throw new Error('RAG 索引重置尚未实现');
  });
}
