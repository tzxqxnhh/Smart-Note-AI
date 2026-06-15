import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContextMenu } from '../../../../src/renderer/components/explorer/ContextMenu';

describe('ContextMenu', () => {
  const defaultProps = {
    x: 100,
    y: 200,
    isVisible: true,
    isDirectory: false,
    clipboardPath: null as string | null,
    onCreateFile: vi.fn(),
    onCreateFolder: vi.fn(),
    onCopy: vi.fn(),
    onPaste: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
  };

  it('不可见时返回 null', () => {
    const { container } = render(<ContextMenu {...defaultProps} isVisible={false} />);
    expect(container.innerHTML).toBe('');
  });

  describe('文件右键菜单', () => {
    it('应该显示复制、重命名、删除', () => {
      render(<ContextMenu {...defaultProps} isDirectory={false} />);
      expect(screen.getByText('复制')).toBeInTheDocument();
      expect(screen.getByText('重命名')).toBeInTheDocument();
      expect(screen.getByText('删除')).toBeInTheDocument();
    });

    it('不应该显示新建文件', () => {
      render(<ContextMenu {...defaultProps} isDirectory={false} />);
      expect(screen.queryByText('新建文件')).not.toBeInTheDocument();
    });

    it('不应该显示新建文件夹', () => {
      render(<ContextMenu {...defaultProps} isDirectory={false} />);
      expect(screen.queryByText('新建文件夹')).not.toBeInTheDocument();
    });

    it('不应该显示粘贴', () => {
      render(<ContextMenu {...defaultProps} isDirectory={false} />);
      expect(screen.queryByText('粘贴')).not.toBeInTheDocument();
    });
  });

  describe('文件夹右键菜单', () => {
    it('应该显示新建文件、新建文件夹、重命名、删除', () => {
      render(<ContextMenu {...defaultProps} isDirectory={true} />);
      expect(screen.getByText('新建文件')).toBeInTheDocument();
      expect(screen.getByText('新建文件夹')).toBeInTheDocument();
      expect(screen.getByText('重命名')).toBeInTheDocument();
      expect(screen.getByText('删除')).toBeInTheDocument();
    });

    it('不应该显示复制', () => {
      render(<ContextMenu {...defaultProps} isDirectory={true} />);
      expect(screen.queryByText('复制')).not.toBeInTheDocument();
    });

    it('有剪切板内容时应该显示粘贴', () => {
      render(<ContextMenu {...defaultProps} isDirectory={true} clipboardPath="/ws/note.md" />);
      expect(screen.getByText('粘贴')).toBeInTheDocument();
    });

    it('无剪切板内容时不应该显示粘贴', () => {
      render(<ContextMenu {...defaultProps} isDirectory={true} clipboardPath={null} />);
      expect(screen.queryByText('粘贴')).not.toBeInTheDocument();
    });
  });
});
