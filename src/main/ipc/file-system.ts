import { ipcMain, shell } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import {
  listDirectory,
  readFileContent,
  writeFileContent,
  createEmptyFile,
  createNewDirectory,
  renameItem,
  deleteItemFromDisk,
} from '../services/file-ops';

// 重新导出纯函数供测试使用
export { listDirectory, readFileContent, writeFileContent, createEmptyFile, createNewDirectory, renameItem, deleteItemFromDisk };

// 别名，保持原有 API 名称兼容
export const readFile = readFileContent;
export const writeFile = writeFileContent;
export const createFile = createEmptyFile;
export const createDirectory = createNewDirectory;
export const rename = renameItem;
export const deleteItem = deleteItemFromDisk;

/**
 * 注册文件系统 IPC 处理器
 */
export function setupFileSystemHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.LIST_DIRECTORY, async (_event, dirPath: string) => {
    return listDirectory(dirPath);
  });

  ipcMain.handle(IPC_CHANNELS.READ_FILE, async (_event, filePath: string) => {
    return readFileContent(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.WRITE_FILE, async (_event, filePath: string, content: string) => {
    return writeFileContent(filePath, content);
  });

  ipcMain.handle(IPC_CHANNELS.CREATE_FILE, async (_event, parentDir: string, name: string) => {
    return createEmptyFile(parentDir, name);
  });

  ipcMain.handle(IPC_CHANNELS.CREATE_DIRECTORY, async (_event, parentDir: string, name: string) => {
    return createNewDirectory(parentDir, name);
  });

  ipcMain.handle(IPC_CHANNELS.RENAME, async (_event, oldPath: string, newName: string) => {
    return renameItem(oldPath, newName);
  });

  ipcMain.handle(IPC_CHANNELS.DELETE, async (_event, itemPath: string) => {
    return deleteItemFromDisk(itemPath);
  });

  // 放入系统回收站（仅在 Electron 主进程中可用）
  ipcMain.handle(IPC_CHANNELS.TRASH_ITEM, async (_event, itemPath: string) => {
    await shell.trashItem(itemPath);
  });
}
