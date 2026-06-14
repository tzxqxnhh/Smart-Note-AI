import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

function HelloWorld() {
  return <div>Hello demo_smart_note</div>;
}

describe('渲染进程烟雾测试', () => {
  it('应该能渲染 React 组件', () => {
    render(<HelloWorld />);
    expect(screen.getByText('Hello demo_smart_note')).toBeInTheDocument();
  });

  it('jsdom 环境应该可用', () => {
    expect(typeof document).toBe('object');
    expect(typeof window).toBe('object');
  });
});
