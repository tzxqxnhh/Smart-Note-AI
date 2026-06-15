import type { RagResponse, Citation } from '../../shared/types';
import { readFile, readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { chunkMarkdown, type ChunkerOptions } from './chunker';
import { embedder } from './embedder';
import { chromaManager } from './chroma-manager';

/**
 * RAG 流水线编排
 * 协调分块、嵌入、检索三个阶段
 */
export class RagPipeline {
  /**
   * 单文件索引
   * 读取文件 → 分块 → 嵌入 → 删除旧数据 → 存入 ChromaDB
   */
  async reindexFile(
    filePath: string,
    options?: ChunkerOptions,
  ): Promise<void> {
    const content = await readFile(filePath, 'utf-8');
    const chunks = chunkMarkdown(
      content,
      filePath,
      options ?? { maxChunkSize: 2000, maxOverlap: 0, separator: '##' },
    );

    if (chunks.length === 0) {
      return;
    }

    // 生成嵌入
    const texts = chunks.map((c) => c.content);
    const embeddings = await embedder.embed(texts);

    // 删除旧数据并存储新数据
    await chromaManager.deleteFileChunks(filePath);
    await chromaManager.upsertChunks(chunks, embeddings);
  }

  /**
   * 全量重索引工作空间
   * 扫描所有 .md 文件 → 分块 → 嵌入 → 存入 ChromaDB
   */
  async reindexAll(workspacePath: string): Promise<{ fileCount: number; chunkCount: number }> {
    let fileCount = 0;
    let chunkCount = 0;

    const mdFiles = await this.scanMarkdownFiles(workspacePath);

    for (const filePath of mdFiles) {
      try {
        await this.reindexFile(filePath);
        fileCount++;
        // 读取文件并分块来计算 chunkCount
        const content = await readFile(filePath, 'utf-8');
        const chunks = chunkMarkdown(content, filePath);
        chunkCount += chunks.length;
      } catch (err) {
        console.error(`索引文件失败: ${filePath}`, err);
      }
    }

    return { fileCount, chunkCount };
  }

  /**
   * RAG 查询
   * 嵌入查询 → ChromaDB 检索 Top-K → 构建上下文 → 返回带引用的响应
   * LLM 生成将在 Phase 8 接入
   */
  async ragQuery(query: string, _workspacePath: string): Promise<RagResponse> {
    // 嵌入查询
    const queryEmbedding = await embedder.embedQuery(query);

    // ChromaDB 检索 Top-K
    const results = await chromaManager.queryChunks(queryEmbedding, 5);

    if (results.length === 0) {
      return {
        content: '未找到相关笔记内容。',
        citations: [],
      };
    }

    // 构建引用列表
    const citations: Citation[] = results.map((r) => ({
      sourceFile: (r.metadata.sourceFile as string) ?? '',
      headingText: (r.metadata.headingText as string) ?? '',
    }));

    // 构建上下文字符串
    const contextParts = results.map((r) => {
      const source = r.metadata.sourceFile as string ?? '';
      const heading = r.metadata.headingText as string ?? '';
      return `[来源: ${source} > ${heading}]\n${r.content}`;
    });

    const context = contextParts.join('\n\n---\n\n');

    // Phase 8 将接入 LLM 生成，当前返回检索结果
    const content = [
      'RAG 查询结果（LLM 生成将在后续版本接入）：',
      '',
      context,
      '',
      `共找到 ${citations.length} 个相关片段`,
    ].join('\n');

    return { content, citations };
  }

  /**
   * 递归扫描目录中的 .md 文件
   */
  private async scanMarkdownFiles(dirPath: string): Promise<string[]> {
    const results: string[] = [];
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      // 跳过隐藏文件和 node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      if (entry.isDirectory()) {
        try {
          const subFiles = await this.scanMarkdownFiles(fullPath);
          results.push(...subFiles);
        } catch {
          // 跳过无法访问的目录
        }
      } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.md') {
        results.push(fullPath);
      }
    }

    return results;
  }
}

// 单例导出
export const ragPipeline = new RagPipeline();
