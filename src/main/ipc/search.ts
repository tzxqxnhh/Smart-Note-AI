import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import { searchFiles } from '../services/search-ops';

export { searchFiles };

/**
 * 注册搜索 IPC 处理器
 */
export function setupSearchHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.SEARCH, async (_event, query: string, rootPath: string) => {
    return searchFiles(query, rootPath);
  });
}
