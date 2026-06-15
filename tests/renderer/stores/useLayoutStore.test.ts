import { describe, it, expect, beforeEach } from 'vitest';
import { useLayoutStore } from '../../../src/renderer/stores/useLayoutStore';

describe('useLayoutStore', () => {
  beforeEach(() => {
    // 重置 store 状态
    useLayoutStore.setState({
      leftPanelWidth: 250,
      rightPanelWidth: 300,
      showLeftPanel: true,
      showRightPanel: true,
    });
  });

  it('应该有默认的初始值', () => {
    const state = useLayoutStore.getState();
    expect(state.leftPanelWidth).toBe(250);
    expect(state.rightPanelWidth).toBe(300);
    expect(state.showLeftPanel).toBe(true);
    expect(state.showRightPanel).toBe(true);
  });

  it('应该能设置左面板宽度', () => {
    useLayoutStore.getState().setLeftPanelWidth(200);
    expect(useLayoutStore.getState().leftPanelWidth).toBe(200);
  });

  it('左面板宽度不应小于最小值 180px', () => {
    useLayoutStore.getState().setLeftPanelWidth(100);
    expect(useLayoutStore.getState().leftPanelWidth).toBe(180);
  });

  it('左面板宽度不应大于最大值 500px', () => {
    useLayoutStore.getState().setLeftPanelWidth(600);
    expect(useLayoutStore.getState().leftPanelWidth).toBe(500);
  });

  it('应该能设置右面板宽度', () => {
    useLayoutStore.getState().setRightPanelWidth(350);
    expect(useLayoutStore.getState().rightPanelWidth).toBe(350);
  });

  it('右面板宽度不应小于最小值 200px', () => {
    useLayoutStore.getState().setRightPanelWidth(150);
    expect(useLayoutStore.getState().rightPanelWidth).toBe(200);
  });

  it('右面板宽度不应大于最大值 600px', () => {
    useLayoutStore.getState().setRightPanelWidth(700);
    expect(useLayoutStore.getState().rightPanelWidth).toBe(600);
  });

  it('应该能切换左面板显示状态', () => {
    useLayoutStore.getState().toggleLeftPanel();
    expect(useLayoutStore.getState().showLeftPanel).toBe(false);
    useLayoutStore.getState().toggleLeftPanel();
    expect(useLayoutStore.getState().showLeftPanel).toBe(true);
  });

  it('应该能切换右面板显示状态', () => {
    useLayoutStore.getState().toggleRightPanel();
    expect(useLayoutStore.getState().showRightPanel).toBe(false);
    useLayoutStore.getState().toggleRightPanel();
    expect(useLayoutStore.getState().showRightPanel).toBe(true);
  });
});
