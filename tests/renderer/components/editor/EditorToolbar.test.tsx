import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorToolbar } from '../../../../src/renderer/components/editor/EditorToolbar';
import type { ViewMode } from '@shared/types';

describe('EditorToolbar', () => {
  const defaultProps: {
    viewMode: ViewMode;
    isDirty: boolean;
    wordCount: number;
    onSave: () => void;
    onToggleViewMode: () => void;
    onSearchOpen: () => void;
  } = {
    viewMode: 'edit',
    isDirty: false,
    wordCount: 0,
    onSave: vi.fn(),
    onToggleViewMode: vi.fn(),
    onSearchOpen: vi.fn(),
  };

  it('应该渲染搜索按钮', () => {
    render(<EditorToolbar {...defaultProps} />);
    // 搜索按钮应存在（通过 title 查找）
    expect(screen.getByTitle('搜索 (Ctrl+Shift+F)')).toBeInTheDocument();
  });

  it('点击搜索按钮应触发 onSearchOpen', () => {
    const onSearchOpen = vi.fn();
    render(<EditorToolbar {...defaultProps} onSearchOpen={onSearchOpen} />);

    const searchButton = screen.getByTitle('搜索 (Ctrl+Shift+F)');
    fireEvent.click(searchButton);

    expect(onSearchOpen).toHaveBeenCalledTimes(1);
  });

  it('有脏标记时应显示保存指示器', () => {
    render(<EditorToolbar {...defaultProps} isDirty={true} />);
    // 脏标记显示为黄色圆点
    const saveButton = screen.getByTitle('保存 (Ctrl+S)');
    expect(saveButton).toBeInTheDocument();
    expect(saveButton.textContent).toContain('●');
  });
});
