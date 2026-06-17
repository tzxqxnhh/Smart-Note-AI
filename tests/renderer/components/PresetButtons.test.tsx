import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PresetButtons } from '@/components/agent/PresetButtons';

describe('PresetButtons', () => {
  let mockToggleVectorDb: ReturnType<typeof vi.fn>;
  let mockClearHistory: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockToggleVectorDb = vi.fn();
    mockClearHistory = vi.fn();
  });

  function renderButtons(vectorDbEnabled = true, disabled = false) {
    return render(
      <PresetButtons
        vectorDbEnabled={vectorDbEnabled}
        onToggleVectorDb={mockToggleVectorDb}
        onClearHistory={mockClearHistory}
        disabled={disabled}
      />,
    );
  }

  it('渲染向量库开关按钮', () => {
    renderButtons();
    const btn = screen.getByTitle(/向量库已开启/);
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('向量库');
  });

  it('向量库关闭时显示关闭状态', () => {
    renderButtons(false);
    const btn = screen.getByTitle(/向量库已关闭/);
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('向量库(关)');
  });

  it('渲染清空对话按钮', () => {
    renderButtons();
    const btn = screen.getByTitle('清空对话');
    expect(btn).toBeInTheDocument();
  });

  it('点击向量库开关调用 onToggleVectorDb', () => {
    renderButtons();
    const btn = screen.getByTitle(/向量库已开启/);
    fireEvent.click(btn);
    expect(mockToggleVectorDb).toHaveBeenCalledTimes(1);
  });

  it('点击清空对话调用 onClearHistory', () => {
    renderButtons();
    const btn = screen.getByTitle('清空对话');
    fireEvent.click(btn);
    expect(mockClearHistory).toHaveBeenCalledTimes(1);
  });

  it('disabled 时按钮不可点击', () => {
    renderButtons(true, true);
    const btns = screen.getAllByRole('button');
    btns.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('不渲染旧的 preset action 按钮', () => {
    renderButtons();
    // 不应该有总结/扩写/格式化/结构图/问答按钮
    expect(screen.queryByText('总结')).not.toBeInTheDocument();
    expect(screen.queryByText('扩写')).not.toBeInTheDocument();
    expect(screen.queryByText('格式化')).not.toBeInTheDocument();
    expect(screen.queryByText('结构图')).not.toBeInTheDocument();
    expect(screen.queryByText('问答')).not.toBeInTheDocument();
  });
});
