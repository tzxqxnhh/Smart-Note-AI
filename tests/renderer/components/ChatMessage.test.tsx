import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatMessage } from '../../../src/renderer/components/agent/ChatMessage';
import type { ChatMessage as ChatMessageType } from '@shared/types';

/** 创建测试用的消息对象 */
function makeMessage(
  overrides: Partial<ChatMessageType> = {},
): ChatMessageType {
  return {
    id: 'msg-1',
    role: 'agent',
    content: '你好！这是回复内容。',
    timestamp: '2026-06-17T00:00:00.000Z',
    ...overrides,
  };
}

describe('ChatMessage', () => {
  describe('基础渲染', () => {
    it('渲染用户消息', () => {
      render(
        <ChatMessage
          message={makeMessage({ role: 'user', content: '用户问题' })}
        />,
      );

      expect(screen.getByText('用户问题')).toBeInTheDocument();
    });

    it('渲染 Agent 消息', () => {
      render(<ChatMessage message={makeMessage()} />);

      expect(screen.getByText('你好！这是回复内容。')).toBeInTheDocument();
    });

    it('用户消息靠右样式', () => {
      const { container } = render(
        <ChatMessage
          message={makeMessage({ role: 'user', content: 'test' })}
        />,
      );

      const wrapper = container.firstElementChild!;
      expect(wrapper.className).toContain('justify-end');
    });

    it('Agent 消息靠左样式', () => {
      const { container } = render(
        <ChatMessage message={makeMessage()} />,
      );

      const wrapper = container.firstElementChild!;
      expect(wrapper.className).toContain('justify-start');
    });
  });

  describe('引用标签', () => {
    it('渲染引用来源', () => {
      render(
        <ChatMessage
          message={makeMessage({
            citations: [
              { sourceFile: 'd:/notes/test.md', headingText: '第一章' },
              { sourceFile: 'd:/notes/ch2.md', headingText: '概述' },
            ],
          })}
        />,
      );

      expect(screen.getByText(/test.md/)).toBeInTheDocument();
      expect(screen.getByText(/ch2.md/)).toBeInTheDocument();
    });

    it('无引用时不渲染引用区域', () => {
      render(<ChatMessage message={makeMessage({ citations: [] })} />);

      expect(screen.queryByText('来源:')).toBeNull();
    });

    it('点击引用触发回调', async () => {
      const onCitationClick = vi.fn();
      render(
        <ChatMessage
          message={makeMessage({
            citations: [
              { sourceFile: 'd:/notes/test.md', headingText: '第一章' },
            ],
          })}
          onCitationClick={onCitationClick}
        />,
      );

      fireEvent.click(screen.getByText(/test.md/));
      expect(onCitationClick).toHaveBeenCalledWith('d:/notes/test.md');
    });
  });

  describe('流式闪烁光标', () => {
    it('isStreaming 时渲染闪烁光标', () => {
      render(
        <ChatMessage
          message={makeMessage({ content: '正在生成' })}
          isStreaming={true}
        />,
      );

      expect(screen.getByText('正在生成')).toBeInTheDocument();
      // 验证 animate-pulse 类存在（闪烁动画）
      const { container } = render(
        <ChatMessage
          message={makeMessage({ content: 'test' })}
          isStreaming={true}
        />,
      );
      expect(container.querySelector('.animate-pulse')).toBeTruthy();
    });

    it('非流式时不渲染闪烁光标', () => {
      const { container } = render(
        <ChatMessage message={makeMessage()} isStreaming={false} />,
      );

      expect(container.querySelector('.animate-pulse')).toBeNull();
    });

    it('默认 isStreaming 为 false', () => {
      const { container } = render(
        <ChatMessage message={makeMessage()} />,
      );

      expect(container.querySelector('.animate-pulse')).toBeNull();
    });
  });

  describe('toolStep 渲染', () => {
    it('渲染 search 类型 toolStep', () => {
      render(
        <ChatMessage
          message={makeMessage({
            toolSteps: [
              {
                id: 'step-1',
                type: 'search',
                status: 'done',
                chunkCount: 3,
                chunkSources: [
                  {
                    chunkId: 'c1',
                    sourceFile: 'd:/notes/test.md',
                    headingText: '第一章',
                    contentPreview: '这是第一章的内容...',
                  },
                ],
              },
            ],
          })}
        />,
      );

      expect(screen.getByText('检索笔记')).toBeInTheDocument();
      expect(screen.getByText(/3/)).toBeInTheDocument(); // chunkCount
    });

    it('渲染 read 类型 toolStep', () => {
      render(
        <ChatMessage
          message={makeMessage({
            toolSteps: [
              {
                id: 'step-1',
                type: 'read',
                status: 'done',
                filePath: 'd:/notes/test.md',
              },
            ],
          })}
        />,
      );

      expect(screen.getByText('读取文件')).toBeInTheDocument();
    });

    it('渲染 write 类型 toolStep', () => {
      render(
        <ChatMessage
          message={makeMessage({
            toolSteps: [
              {
                id: 'step-1',
                type: 'write',
                status: 'done',
                writtenPath: 'd:/notes/output.md',
              },
            ],
          })}
        />,
      );

      expect(screen.getByText('写入文件')).toBeInTheDocument();
    });

    it('无 toolStep 时不渲染工具步骤区域', () => {
      render(<ChatMessage message={makeMessage({ toolSteps: [] })} />);

      expect(screen.queryByText('检索笔记')).toBeNull();
      expect(screen.queryByText('读取文件')).toBeNull();
      expect(screen.queryByText('写入文件')).toBeNull();
    });

    it('用户消息不渲染 toolStep', () => {
      render(
        <ChatMessage
          message={makeMessage({
            role: 'user',
            toolSteps: [{ id: 's1', type: 'search', status: 'done', chunkCount: 1 }],
          })}
        />,
      );

      expect(screen.queryByText('检索笔记')).toBeNull();
    });
  });

  describe('toolStep 展开/折叠', () => {
    it('点击 toolStep 展开详情', async () => {
      render(
        <ChatMessage
          message={makeMessage({
            toolSteps: [
              {
                id: 'step-1',
                type: 'search',
                status: 'done',
                chunkCount: 1,
                chunkSources: [
                  {
                    chunkId: 'c1',
                    sourceFile: 'd:/notes/test.md',
                    headingText: '第一章',
                    contentPreview: '这是第一章的内容...',
                  },
                ],
              },
            ],
          })}
        />,
      );

      // 详情应该初始隐藏
      expect(screen.queryByText('这是第一章的内容...')).toBeNull();

      // 点击展开
      fireEvent.click(screen.getByText('检索笔记'));
      expect(screen.getByText('这是第一章的内容...')).toBeInTheDocument();
    });

    it('无详情时不可展开', async () => {
      render(
        <ChatMessage
          message={makeMessage({
            toolSteps: [
              {
                id: 'step-1',
                type: 'search',
                status: 'done',
                chunkCount: 0,
                // 没有 chunkSources
              },
            ],
          })}
        />,
      );

      // 不应该有可点击展开的箭头
      expect(screen.queryByText('检索笔记')).toBeInTheDocument();
    });
  });
});
