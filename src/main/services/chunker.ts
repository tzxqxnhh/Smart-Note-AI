import type { Chunk } from '../../shared/types';
import { remark } from 'remark';

/**
 * Markdown 分块配置
 */
export interface ChunkerOptions {
  /** 最大切分字符数 */
  maxChunkSize: number;
  /** 最大重叠字符数 */
  maxOverlap: number;
  /** 分割标题分隔符，如 "##" 或 "###" */
  separator: string;
}

/**
 * 从 Markdown AST 节点中提取纯文本
 */
function extractTextFromNode(node: { children?: Array<{ type: string; value?: string; children?: unknown[] }> }): string {
  if (!node.children) return '';
  const parts: string[] = [];
  for (const child of node.children) {
    if (child.type === 'text' && child.value) {
      parts.push(child.value);
    } else if (child.type === 'inlineCode' && child.value) {
      parts.push(child.value);
    } else if (child.children) {
      // 递归处理嵌套节点
      parts.push(extractTextFromNode(child as { children: Array<{ type: string; value?: string }> }));
    }
  }
  return parts.join('');
}

/**
 * 获取节点的起始字符偏移
 */
function getStartOffset(node: { position?: { start: { offset: number } } }): number {
  return node.position?.start?.offset ?? 0;
}

/**
 * 将一段文本按 maxChunkSize 切分为多个块，支持 overlap
 */
function chunkText(
  text: string,
  maxSize: number,
  overlap: number,
): string[] {
  if (text.length <= maxSize) {
    return [text];
  }

  const result: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxSize;
    if (end >= text.length) {
      result.push(text.slice(start));
      break;
    }

    // 在段落边界处截断（查找最近的 \n\n）
    const chunkCandidate = text.slice(start, end);
    const lastParagraphBreak = chunkCandidate.lastIndexOf('\n\n');

    if (lastParagraphBreak > maxSize * 0.3) {
      // 在合理位置找到段落边界
      end = start + lastParagraphBreak;
    } else {
      // 退回到最后一个换行符
      const lastNewline = chunkCandidate.lastIndexOf('\n');
      if (lastNewline > maxSize * 0.3) {
        end = start + lastNewline;
      }
    }

    result.push(text.slice(start, end));
    start = end - overlap;
    if (start < 0) start = 0;
    // 防止无限循环
    if (end <= start + overlap) {
      start = end;
    }
  }

  return result;
}

/**
 * Markdown 文本分块器
 * 以指定标题级别为边界切分笔记内容
 */
export function chunkMarkdown(
  content: string,
  filePath: string,
  options: ChunkerOptions = { maxChunkSize: 2000, maxOverlap: 0, separator: '##' },
): Chunk[] {
  // 空内容快速返回
  const trimmed = content.trim();
  if (!trimmed) {
    return [];
  }

  // 根据 separator 确定分割级别
  const splitLevel = options.separator.length;

  // 使用 remark 解析 Markdown AST
  const tree = remark.parse(content);

  // 第一阶段：识别所有标题边界，划分段落
  interface Section {
    headingText: string;
    headingLevel: number;
    parentHeading: string | null;
    startOffset: number;
    endOffset: number;
    // 内部的子标题在父标题上下文中的起始位置
    isSubHeading: boolean;
  }

  // 使用偏移量来划分段落区域
  // 在遍历 children 时，记录每个匹配标题的位置
  const children = tree.children as Array<{
    type: string;
    depth?: number;
    position?: { start: { offset: number }; end: { offset: number } };
    children?: Array<{ type: string; value?: string }>;
  }>;

  // 找到所有标题节点，用于计算 parentHeading（包括所有级别）
  // 分割点只保留深度 >= splitLevel 的标题
  const allHeadings: Array<{ index: number; depth: number; text: string; startOffset: number }> = [];
  const splitPoints: Array<{ index: number; depth: number; text: string; startOffset: number }> = [];

  for (let i = 0; i < children.length; i++) {
    const node = children[i];

    if (node.type === 'heading' && node.depth !== undefined) {
      const headingText = extractTextFromNode(node as { children: Array<{ type: string; value?: string }> });
      allHeadings.push({
        index: i,
        depth: node.depth,
        text: headingText,
        startOffset: getStartOffset(node),
      });

      if (node.depth >= splitLevel) {
        splitPoints.push({
          index: i,
          depth: node.depth,
          text: headingText,
          startOffset: getStartOffset(node),
        });
      }
    }
  }

  // 第二阶段：构建段落（sections）
  // 如果没有分割点，整个内容作为一个前言块
  if (splitPoints.length === 0) {
    return [{
      id: `${filePath}::preamble`,
      content: trimmed,
      metadata: {
        sourceFile: filePath,
        headingText: '(前言)',
        headingLevel: 0,
        parentHeading: null,
        chunkIndex: 0,
        totalChunks: 1,
      },
    }];
  }

  // 跟踪标题栈，用于确定 parentHeading（基于所有级别的标题）
  const headingStack: Array<{ depth: number; text: string }> = [];

  // 构建段落（sections）
  const sections: Section[] = [];
  const contentLength = content.length;

  // 前导内容：第一个分割点之前的内容
  const firstSplit = splitPoints[0];
  if (firstSplit.startOffset > 0) {
    const preambleText = content.slice(0, firstSplit.startOffset).trim();
    if (preambleText) {
      sections.push({
        headingText: '(前言)',
        headingLevel: 0,
        parentHeading: null,
        startOffset: 0,
        endOffset: firstSplit.startOffset,
        isSubHeading: false,
      });
    }
  }

  // 遍历所有标题来维护 headingStack，同时处理分割点
  let headingPointer = 0; // allHeadings 的指针
  let splitPointer = 0; // splitPoints 的指针

  // 同步遍历 headings 和 splitPoints
  // 维护 headingStack 始终反映当前分割点到之前最近的各级标题
  for (let i = 0; i < splitPoints.length; i++) {
    const sp = splitPoints[i];

    // 将 allHeadings 中出现在当前分割点之前的标题压入栈
    while (headingPointer < allHeadings.length && allHeadings[headingPointer].startOffset < sp.startOffset) {
      const h = allHeadings[headingPointer];
      // 弹出深度 >= 当前标题深度的旧标题
      while (headingStack.length > 0 && headingStack[headingStack.length - 1].depth >= h.depth) {
        headingStack.pop();
      }
      headingStack.push({ depth: h.depth, text: h.text });
      headingPointer++;
    }

    // 同时需要弹出与当前分割点等深的标题（当前分割点的标题替换旧标题）
    while (headingStack.length > 0 && headingStack[headingStack.length - 1].depth >= sp.depth) {
      headingStack.pop();
    }

    // 父标题 = 栈顶（深度小于当前标题的最近标题）
    const parentHeading = headingStack.length > 0 ? headingStack[headingStack.length - 1].text : null;

    // 当前分割点标题入栈
    headingStack.push({ depth: sp.depth, text: sp.text });

    // 确定此段落的结束位置
    let endOffset = contentLength;
    if (i + 1 < splitPoints.length) {
      endOffset = splitPoints[i + 1].startOffset;
    }

    const sectionContent = content.slice(sp.startOffset, endOffset).trim();
    if (sectionContent) {
      sections.push({
        headingText: sp.text,
        headingLevel: sp.depth,
        parentHeading,
        startOffset: sp.startOffset,
        endOffset,
        isSubHeading: sp.depth > splitLevel,
      });
    }
  }

  // 第三阶段：将 sections 转换为 chunks，处理大文本切分
  const allChunks: Chunk[] = [];

  for (const section of sections) {
    const sectionContent = content.slice(section.startOffset, section.endOffset).trim();
    if (!sectionContent) continue;

    if (sectionContent.length <= options.maxChunkSize) {
      allChunks.push({
        id: `${filePath}::${section.headingText}`,
        content: sectionContent,
        metadata: {
          sourceFile: filePath,
          headingText: section.headingText,
          headingLevel: section.headingLevel,
          parentHeading: section.parentHeading,
          chunkIndex: 0, // 稍后统一分配
          totalChunks: 0,
        },
      });
    } else {
      // 需要切分大段落
      // 先尝试按段落切分
      const headingLine = sectionContent.split('\n')[0]; // 标题行
      const bodyText = sectionContent.slice(headingLine.length).trim();

      const bodyChunks = chunkText(bodyText, options.maxChunkSize, options.maxOverlap);

      for (let i = 0; i < bodyChunks.length; i++) {
        const chunkContent = i === 0
          ? headingLine + '\n\n' + bodyChunks[i]
          : bodyChunks[i];

        allChunks.push({
          id: `${filePath}::${section.headingText}::${i}`,
          content: chunkContent,
          metadata: {
            sourceFile: filePath,
            headingText: section.headingText,
            headingLevel: section.headingLevel,
            parentHeading: section.parentHeading,
            chunkIndex: 0,
            totalChunks: 0,
          },
        });
      }
    }
  }

  // 最终统一分配索引和总数
  const totalChunks = allChunks.length;
  for (let i = 0; i < allChunks.length; i++) {
    allChunks[i].id = `${filePath}::chunk::${i}`;
    allChunks[i].metadata.chunkIndex = i;
    allChunks[i].metadata.totalChunks = totalChunks;
  }

  return allChunks;
}
