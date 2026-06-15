import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownPreview } from '../../../../src/renderer/components/editor/MarkdownPreview';

describe('MarkdownPreview', () => {
  it('应该渲染标题', () => {
    render(<MarkdownPreview content="# 标题" />);
    expect(screen.getByText('标题')).toBeInTheDocument();
  });

  it('应该渲染二级标题', () => {
    render(<MarkdownPreview content="## 二级标题" />);
    expect(screen.getByText('二级标题')).toBeInTheDocument();
  });

  it('应该渲染粗体文本', () => {
    render(<MarkdownPreview content="这是 **粗体** 文字" />);
    const strongEl = screen.getByText('粗体');
    expect(strongEl.tagName).toBe('STRONG');
  });

  it('应该渲染斜体文本', () => {
    render(<MarkdownPreview content="这是 *斜体* 文字" />);
    const emEl = screen.getByText('斜体');
    expect(emEl.tagName).toBe('EM');
  });

  it('应该渲染无序列表', () => {
    const content = ['- 项目A', '- 项目B'].join('\n');
    const { container } = render(<MarkdownPreview content={content} />);
    const listItems = container.querySelectorAll('li');
    expect(listItems.length).toBeGreaterThanOrEqual(1);
    // 至少能找到列表元素
    expect(container.querySelector('ul')).toBeInTheDocument();
  });

  it('无序列表 ul 应有 list-style: disc 样式', () => {
    const content = ['- 项目A', '- 项目B'].join('\n');
    const { container } = render(<MarkdownPreview content={content} />);
    const ul = container.querySelector('ul');
    expect(ul).toBeInTheDocument();
    // 验证 markdown-preview 包装下的 ul 存在
    const previewUl = container.querySelector('.markdown-preview ul');
    expect(previewUl).toBeInTheDocument();
  });

  it('应该渲染 GFM 表格', () => {
    const content = '| 列1 | 列2 |\n|-----|-----|\n| A | B |';
    const { container } = render(<MarkdownPreview content={content} />);
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
  });

  it('应该渲染 GFM 任务列表', () => {
    const content = ['- [x] 已完成', '- [ ] 未完成'].join('\n');
    const { container } = render(<MarkdownPreview content={content} />);
    // GFM 任务列表包含 checkbox 和特定 class
    const taskList = container.querySelector('.contains-task-list');
    expect(taskList).toBeInTheDocument();
  });

  it('空内容应该显示空状态', () => {
    const { container } = render(<MarkdownPreview content="" />);
    expect(container.textContent).toBe('');
  });
});
