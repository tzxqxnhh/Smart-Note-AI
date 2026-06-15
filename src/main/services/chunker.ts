import type { Chunk } from '../../shared/types';

/**
 * Markdown 分块配置
 */
export interface ChunkerOptions {
  /** 分割的标题级别，默认 ['##', '###'] */
  headingLevels: string[];
}

/**
 * Markdown 文本分块器
 * 以指定标题级别为边界切分笔记内容
 */
export function chunkMarkdown(
  content: string,
  filePath: string,
  options: ChunkerOptions = { headingLevels: ['##', '###'] },
): Chunk[] {
  // TODO: Phase 6 实现
  // 使用 remark AST 解析 Markdown
  // 按 ## 和 ### 标题分割
  // 保留元数据：sourceFile, headingText, headingLevel, parentHeading, chunkIndex
  throw new Error('Markdown 分块器尚未实现');
}
