import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import { ragPipeline } from '../services/rag-pipeline';
import { embedder } from '../services/embedder';
import { chromaManager } from '../services/chroma-manager';
import type { ChunkerSettings } from '../../shared/types';

/**
 * 注册 RAG IPC 处理器
 */
export function setupRagHandlers(): void {
  // 全量索引
  ipcMain.handle(IPC_CHANNELS.RAG_INDEX_ALL, async (_event, workspacePath: string) => {
    return ragPipeline.reindexAll(workspacePath);
  });

  // 单文件索引
  ipcMain.handle(IPC_CHANNELS.RAG_INDEX_FILE, async (_event, filePath: string, settings?: ChunkerSettings) => {
    await ragPipeline.reindexFile(filePath, settings ? {
      maxChunkSize: settings.maxChunkSize,
      maxOverlap: settings.maxOverlap,
      separator: settings.separator,
    } : undefined);
  });

  // RAG 查询
  ipcMain.handle(IPC_CHANNELS.RAG_QUERY, async (_event, query: string, workspacePath: string) => {
    return ragPipeline.ragQuery(query, workspacePath);
  });

  // 获取索引状态
  ipcMain.handle(IPC_CHANNELS.RAG_GET_STATUS, async () => {
    return {
      embedderReady: embedder.isReady(),
      chromaConnected: chromaManager.isConnected(),
    };
  });

  // 重置索引
  ipcMain.handle(IPC_CHANNELS.RAG_RESET_INDEX, async () => {
    await chromaManager.resetCollection();
  });
}
