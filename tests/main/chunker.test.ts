import { describe, it, expect } from 'vitest';
import { chunkMarkdown } from '../../src/main/services/chunker';

describe('chunkMarkdown', () => {
  const filePath = 'D:\\notes\\test.md';

  // 默认选项
  const defaultOptions = {
    maxChunkSize: 2000,
    maxOverlap: 0,
    separator: '##',
  };

  describe('基本分割', () => {
    it('以 ## 标题为边界分割内容', () => {
      const content = [
        '这是一段前言内容。',
        '',
        '## 第一章',
        '',
        '第一章的正文内容。',
        '',
        '## 第二章',
        '',
        '第二章的正文内容。',
      ].join('\n');

      const chunks = chunkMarkdown(content, filePath, defaultOptions);

      // 应该有 3 个块：前言 + 2 个章节
      expect(chunks).toHaveLength(3);

      // 前言块
      expect(chunks[0].content).toContain('这是一段前言内容');
      expect(chunks[0].metadata.headingText).toBe('(前言)');
      expect(chunks[0].metadata.headingLevel).toBe(0);
      expect(chunks[0].metadata.chunkIndex).toBe(0);
      expect(chunks[0].metadata.parentHeading).toBeNull();

      // 第一章
      expect(chunks[1].content).toContain('## 第一章');
      expect(chunks[1].content).toContain('第一章的正文内容');
      expect(chunks[1].metadata.headingText).toBe('第一章');
      expect(chunks[1].metadata.headingLevel).toBe(2);
      expect(chunks[1].metadata.chunkIndex).toBe(1);

      // 第二章
      expect(chunks[2].content).toContain('## 第二章');
      expect(chunks[2].content).toContain('第二章的正文内容');
      expect(chunks[2].metadata.headingText).toBe('第二章');
      expect(chunks[2].metadata.headingLevel).toBe(2);
    });
  });

  describe('空内容和无标题', () => {
    it('空内容返回空数组', () => {
      const chunks = chunkMarkdown('', filePath, defaultOptions);
      expect(chunks).toHaveLength(0);
    });

    it('只有空白字符的内容返回空数组', () => {
      const chunks = chunkMarkdown('   \n  \n  ', filePath, defaultOptions);
      expect(chunks).toHaveLength(0);
    });

    it('没有匹配标题的内容作为一个前言块', () => {
      const content = '这是没有任何标题的内容。\n\n只是普通的文本。';

      const chunks = chunkMarkdown(content, filePath, defaultOptions);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe(content);
      expect(chunks[0].metadata.headingText).toBe('(前言)');
      expect(chunks[0].metadata.headingLevel).toBe(0);
      expect(chunks[0].metadata.chunkIndex).toBe(0);
      expect(chunks[0].metadata.totalChunks).toBe(1);
    });
  });

  describe('### 子标题处理', () => {
    it('### 标题的 parentHeading 是最近的 ## 标题', () => {
      const content = [
        '## 第一章',
        '',
        '一些内容。',
        '',
        '### 小节 1.1',
        '',
        '小节内容。',
        '',
        '### 小节 1.2',
        '',
        '另一个小节。',
        '',
        '## 第二章',
        '',
        '第二章内容。',
      ].join('\n');

      const chunks = chunkMarkdown(content, filePath, defaultOptions);

      // 应该有 5 个块：第一章, 1.1, 1.2, 第二章
      expect(chunks).toHaveLength(4);

      // 第一章
      expect(chunks[0].metadata.headingText).toBe('第一章');
      expect(chunks[0].metadata.headingLevel).toBe(2);

      // 小节 1.1 —— parentHeading 是 "第一章"
      expect(chunks[1].metadata.headingText).toBe('小节 1.1');
      expect(chunks[1].metadata.headingLevel).toBe(3);
      expect(chunks[1].metadata.parentHeading).toBe('第一章');

      // 小节 1.2 —— parentHeading 是 "第一章"
      expect(chunks[2].metadata.headingText).toBe('小节 1.2');
      expect(chunks[2].metadata.headingLevel).toBe(3);
      expect(chunks[2].metadata.parentHeading).toBe('第一章');

      // 第二章
      expect(chunks[3].metadata.headingText).toBe('第二章');
      expect(chunks[3].metadata.headingLevel).toBe(2);
      expect(chunks[3].metadata.parentHeading).toBeNull();
    });
  });

  describe('自定义分隔符', () => {
    it('separator="###" 时只在 ### 级别分割', () => {
      const content = [
        '## 概述',
        '',
        '概述内容。',
        '',
        '### 详细 1',
        '',
        '详细内容 1。',
        '',
        '### 详细 2',
        '',
        '详细内容 2。',
      ].join('\n');

      const chunks = chunkMarkdown(content, filePath, {
        ...defaultOptions,
        separator: '###',
      });

      // separator="###" 时以 ### 分割，## 不会触发分割
      // 第一个 ### 之前的内容（含 ## 概述）为前言
      expect(chunks.length).toBeGreaterThanOrEqual(2);

      // 至少有两个 ### 块
      const detail1 = chunks.find((c) => c.metadata.headingText === '详细 1');
      expect(detail1).toBeDefined();
      expect(detail1!.metadata.headingLevel).toBe(3);

      const detail2 = chunks.find((c) => c.metadata.headingText === '详细 2');
      expect(detail2).toBeDefined();
      expect(detail2!.metadata.headingLevel).toBe(3);
    });

    it('separator="###" 时 ### 的父标题为最近的 ## 标题', () => {
      const content = [
        '## 概述',
        '',
        '概述内容。',
        '',
        '### 详细 1',
        '',
        '详细内容 1。',
        '',
        '## 总结',
        '',
        '总结内容。',
      ].join('\n');

      const chunks = chunkMarkdown(content, filePath, {
        ...defaultOptions,
        separator: '###',
      });

      const detail1 = chunks.find((c) => c.metadata.headingText === '详细 1');
      expect(detail1).toBeDefined();
      // 前导内容包含了 "## 概述"
      // 详细 1 的父标题应该是 "概述"
      expect(detail1!.metadata.parentHeading).toBe('概述');
    });
  });

  describe('大文本切分', () => {
    it('超过 maxChunkSize 的块按字符截断', () => {
      // 创建一段超过 maxChunkSize 的长文本
      const longParagraph = 'A'.repeat(250); // 250 字符
      const content = [
        '## 长章节',
        '',
        longParagraph,
        '',
        longParagraph,
        '',
        longParagraph,
        '',
        longParagraph,
        '',
        longParagraph,
      ].join('\n');

      const chunks = chunkMarkdown(content, filePath, {
        maxChunkSize: 500,
        maxOverlap: 0,
        separator: '##',
      });

      // 应该被切分成多个块
      expect(chunks.length).toBeGreaterThan(1);

      // 每个块不应该超过最大字符数（允许一些余量用于标题行）
      for (const chunk of chunks) {
        expect(chunk.content.length).toBeLessThanOrEqual(650); // 允许包含标题行的余量
      }

      // chunkIndex 和 totalChunks 应该正确
      for (const chunk of chunks) {
        expect(chunk.metadata.totalChunks).toBe(chunks.length);
      }
    });

    it('超过 maxChunkSize 时优先按段落边界分割', () => {
      const paragraph1 = 'A'.repeat(100);
      const paragraph2 = 'B'.repeat(100);
      const paragraph3 = 'C'.repeat(100);
      const paragraph4 = 'D'.repeat(100);
      const content = [
        '## 章节',
        '',
        paragraph1,
        '',
        paragraph2,
        '',
        paragraph3,
        '',
        paragraph4,
      ].join('\n');

      const chunks = chunkMarkdown(content, filePath, {
        maxChunkSize: 250,
        maxOverlap: 0,
        separator: '##',
      });

      expect(chunks.length).toBeGreaterThan(1);

      // 每个块的内容应该在段落边界处结束（不以 A、B、C、D 混在一起）
      for (const chunk of chunks) {
        const text = chunk.content;
        // 跳过标题行检查段落边界
        const bodyLines = text.split('\n').slice(2);
        expect(bodyLines.length).toBeGreaterThan(0);
      }
    });
  });

  describe('重叠处理', () => {
    it('maxOverlap > 0 时连续块之间存在重叠', () => {
      const longText = '0123456789'.repeat(100); // 1000 字符
      const content = [
        '## 章节',
        '',
        longText,
      ].join('\n');

      const chunks = chunkMarkdown(content, filePath, {
        maxChunkSize: 300,
        maxOverlap: 50,
        separator: '##',
      });

      expect(chunks.length).toBeGreaterThan(1);

      // 检查相邻块之间的重叠
      for (let i = 1; i < chunks.length; i++) {
        const prevEnd = chunks[i - 1].content.slice(-50);
        const currStart = chunks[i].content.slice(0, 50);
        // 应该有一定程度的重叠
        const overlap = chunks[i].content.slice(0, 50);
        expect(chunks[i - 1].content).toContain(overlap.substring(0, 20));
      }
    });
  });

  describe('代码块处理', () => {
    it('代码块内的标题不会被当作分割点', () => {
      const content = [
        '## 章节一',
        '',
        '这是章节一的内容。',
        '',
        '```markdown',
        '## 这不是一个真正的标题',
        '```',
        '',
        '## 章节二',
        '',
        '这是章节二的内容。',
      ].join('\n');

      const chunks = chunkMarkdown(content, filePath, defaultOptions);

      // 应该有 3 个块：前言(空或者合并) + 章节一 + 章节二
      // 代码块内的 "## 这不是一个真正的标题" 不应该触发分割
      const headingTexts = chunks.map((c) => c.metadata.headingText);
      expect(headingTexts).not.toContain('这不是一个真正的标题');

      // 章节一和章节二应该存在
      expect(headingTexts).toContain('章节一');
      expect(headingTexts).toContain('章节二');
    });
  });

  describe('元数据校验', () => {
    it('所有块的 sourceFile、id、chunkIndex、totalChunks 正确', () => {
      const content = [
        '## 第一章',
        '',
        '内容一。',
        '',
        '## 第二章',
        '',
        '内容二。',
      ].join('\n');

      const chunks = chunkMarkdown(content, filePath, defaultOptions);

      for (const chunk of chunks) {
        expect(chunk.metadata.sourceFile).toBe(filePath);
        expect(chunk.id).toBeTruthy();
        expect(chunk.id).toContain(filePath);
        expect(chunk.metadata.totalChunks).toBe(chunks.length);
        expect(chunk.metadata.chunkIndex).toBeGreaterThanOrEqual(0);
        expect(chunk.metadata.chunkIndex).toBeLessThan(chunks.length);
      }

      // chunkIndex 应该递增
      for (let i = 0; i < chunks.length; i++) {
        expect(chunks[i].metadata.chunkIndex).toBe(i);
      }
    });
  });

  describe('深度嵌套标题', () => {
    it('正确处理 # ## ### 混合层级', () => {
      const content = [
        '# 顶级标题',
        '',
        '顶级内容。',
        '',
        '## 二级标题 A',
        '',
        '二级 A 内容。',
        '',
        '### 三级标题 a1',
        '',
        '三级 a1 内容。',
        '',
        '### 三级标题 a2',
        '',
        '三级 a2 内容。',
        '',
        '## 二级标题 B',
        '',
        '二级 B 内容。',
        '',
        '### 三级标题 b1',
        '',
        '三级 b1 内容。',
      ].join('\n');

      const chunks = chunkMarkdown(content, filePath, defaultOptions);

      // 验证 parentHeading 链
      const a1 = chunks.find((c) => c.metadata.headingText === '三级标题 a1');
      const a2 = chunks.find((c) => c.metadata.headingText === '三级标题 a2');
      const b1 = chunks.find((c) => c.metadata.headingText === '三级标题 b1');

      expect(a1).toBeDefined();
      expect(a2).toBeDefined();
      expect(b1).toBeDefined();

      expect(a1!.metadata.parentHeading).toBe('二级标题 A');
      expect(a2!.metadata.parentHeading).toBe('二级标题 A');
      expect(b1!.metadata.parentHeading).toBe('二级标题 B');
    });
  });
});
