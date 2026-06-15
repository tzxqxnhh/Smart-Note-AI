import type { RagResponse, Citation } from '../../shared/types';

/**
 * RAG 流水线编排
 * 协调分块、嵌入、检索、生成四个阶段
 */
export class RagPipeline {
  /**
   * 全量重索引工作空间
   * 扫描所有 .md 文件 → 分块 → 嵌入 → 存入 ChromaDB
   */
  async reindexAll(workspacePath: string): Promise<{ fileCount: number; chunkCount: number }> {
    // TODO: Phase 6 实现
    throw new Error('RAG 索引尚未实现');
  }

  /**
   * 单文件重索引
   */
  async reindexFile(filePath: string): Promise<void> {
    // TODO: Phase 6 实现
    throw new Error('单文件索引尚未实现');
  }

  /**
   * RAG 查询
   * 嵌入查询 → ChromaDB 检索 Top-K → 构建 Prompt → LLM 生成 → 返回带引用的响应
   */
  async ragQuery(query: string, workspacePath: string): Promise<RagResponse> {
    // TODO: Phase 6 实现
    throw new Error('RAG 查询尚未实现');
  }
}

// 单例导出
export const ragPipeline = new RagPipeline();
