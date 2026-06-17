import { BrowserWindow } from 'electron';
import { setupWorkspaceHandlers } from './workspace';
import { setupFileSystemHandlers } from './file-system';
import { setupSearchHandlers } from './search';
import { setupRagHandlers } from './rag';
import { setupLLMHandlers } from './llm';

/**
 * 注册所有 IPC 处理器
 * @param mainWindow 主窗口引用，供需要推送事件的 handler 使用（如 LLM 流式）
 */
export function setupIPC(mainWindow: BrowserWindow): void {
  setupWorkspaceHandlers();
  setupFileSystemHandlers();
  setupSearchHandlers();
  setupRagHandlers();
  setupLLMHandlers(mainWindow);
}
