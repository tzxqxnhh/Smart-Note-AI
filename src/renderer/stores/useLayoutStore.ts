import { create } from 'zustand';

interface LayoutState {
  // 面板宽度（像素）
  leftPanelWidth: number;
  rightPanelWidth: number;
  // 面板可见性
  showLeftPanel: boolean;
  showRightPanel: boolean;

  // 操作
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
}

const MIN_LEFT_WIDTH = 180;
const MAX_LEFT_WIDTH = 500;
const MIN_RIGHT_WIDTH = 200;
const MAX_RIGHT_WIDTH = 600;

export const useLayoutStore = create<LayoutState>((set) => ({
  // 初始值
  leftPanelWidth: 250,
  rightPanelWidth: 300,
  showLeftPanel: true,
  showRightPanel: true,

  // 设置左面板宽度，带边界限制
  setLeftPanelWidth: (width: number) =>
    set({
      leftPanelWidth: Math.min(Math.max(width, MIN_LEFT_WIDTH), MAX_LEFT_WIDTH),
    }),

  // 设置右面板宽度，带边界限制
  setRightPanelWidth: (width: number) =>
    set({
      rightPanelWidth: Math.min(Math.max(width, MIN_RIGHT_WIDTH), MAX_RIGHT_WIDTH),
    }),

  // 切换左面板可见性
  toggleLeftPanel: () => set((state) => ({ showLeftPanel: !state.showLeftPanel })),

  // 切换右面板可见性
  toggleRightPanel: () => set((state) => ({ showRightPanel: !state.showRightPanel })),
}));
