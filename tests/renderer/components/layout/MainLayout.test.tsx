import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MainLayout } from '../../../../src/renderer/components/layout/MainLayout';
import { useLayoutStore } from '../../../../src/renderer/stores/useLayoutStore';

// Mock allotment 组件（它在 jsdom 中没有尺寸，简单 stub 即可）
vi.mock('allotment', () => {
  function Pane({ children }: { children?: React.ReactNode }) {
    return <div data-testid="allotment-pane">{children}</div>;
  }
  function Allotment({ children }: { children?: React.ReactNode }) {
    return <div data-testid="allotment">{children}</div>;
  }
  Allotment.Pane = Pane;
  return { Allotment, default: Allotment };
});

describe('MainLayout', () => {
  beforeEach(() => {
    useLayoutStore.setState({
      leftPanelWidth: 250,
      rightPanelWidth: 300,
      showLeftPanel: true,
      showRightPanel: true,
    });
  });

  it('应该渲染三栏布局', () => {
    render(<MainLayout />);
    const allotment = screen.getByTestId('allotment');
    expect(allotment).toBeInTheDocument();
    expect(allotment.children.length).toBe(3);
  });

  it('当左面板隐藏时应该只渲染两栏', () => {
    useLayoutStore.getState().toggleLeftPanel();
    render(<MainLayout />);
    const allotment = screen.getByTestId('allotment');
    expect(allotment.children.length).toBe(2);
  });

  it('当右面板隐藏时应该只渲染两栏', () => {
    useLayoutStore.getState().toggleRightPanel();
    render(<MainLayout />);
    const allotment = screen.getByTestId('allotment');
    expect(allotment.children.length).toBe(2);
  });
});
