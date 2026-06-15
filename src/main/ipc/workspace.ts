import { ipcMain, dialog, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';

let currentWorkspacePath: string | null = null;

/**
 * 获取当前工作空间路径
 */
export function getWorkspacePath(): string | null {
  return currentWorkspacePath;
}

/**
 * 设置工作空间路径
 */
export function setupWorkspaceHandlers(): void {
  // 选择目录
  ipcMain.handle(IPC_CHANNELS.SELECT_DIRECTORY, async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) return null;

    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory'],
      title: '选择工作空间文件夹',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    currentWorkspacePath = result.filePaths[0];
    return currentWorkspacePath;
  });

  // 获取当前工作空间路径
  ipcMain.handle(IPC_CHANNELS.GET_WORKSPACE_PATH, async () => {
    return currentWorkspacePath;
  });
}
