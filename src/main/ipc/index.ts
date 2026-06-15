import { setupWorkspaceHandlers } from './workspace';
import { setupFileSystemHandlers } from './file-system';
import { setupSearchHandlers } from './search';
import { setupRagHandlers } from './rag';
import { setupLLMHandlers } from './llm';

/**
 * 注册所有 IPC 处理器
 */
export function setupIPC(): void {
  setupWorkspaceHandlers();
  setupFileSystemHandlers();
  setupSearchHandlers();
  setupRagHandlers();
  setupLLMHandlers();
}
