import { watch, FSWatcher } from 'chokidar';
import { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';

let watcher: FSWatcher | null = null;

/**
 * 启动文件监控
 * 监听工作空间的文件变化，通过 IPC 通知渲染进程
 */
export function startFileWatcher(workspacePath: string): void {
  stopFileWatcher();

  watcher = watch(workspacePath, {
    ignored: [
      /(^|[/\\])\../, // 隐藏文件/目录
      '**/node_modules/**',
      '**/.git/**',
    ],
    persistent: true,
    ignoreInitial: true,
    depth: 99,
  });

  watcher.on('all', (eventName, changedPath) => {
    // 将事件发送到所有渲染进程窗口
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.FILE_CHANGED, {
          event: eventName,
          path: changedPath,
        });
      }
    }
  });
}

/**
 * 停止文件监控
 */
export function stopFileWatcher(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}
