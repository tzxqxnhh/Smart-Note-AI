import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';

/**
 * 注册 LLM IPC 处理器（当前为占位实现）
 */
export function setupLLMHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.LLM_CHAT, async () => {
    throw new Error('LLM 聊天功能尚未实现');
  });

  ipcMain.handle(IPC_CHANNELS.LLM_SUMMARIZE, async () => {
    throw new Error('文本总结功能尚未实现');
  });

  ipcMain.handle(IPC_CHANNELS.LLM_EXPAND, async () => {
    throw new Error('文本扩写功能尚未实现');
  });

  ipcMain.handle(IPC_CHANNELS.LLM_FORMAT, async () => {
    throw new Error('文本格式化功能尚未实现');
  });

  ipcMain.handle(IPC_CHANNELS.LLM_GENERATE_TREE, async () => {
    throw new Error('文件树结构生成功能尚未实现');
  });
}
