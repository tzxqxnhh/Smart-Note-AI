import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEditorStore, resetEditorStore } from '../../../src/renderer/stores/useEditorStore';

// Mock IPC 客户端
vi.mock('../../../src/renderer/lib/ipc-client', () => ({
  readFile: vi.fn().mockImplementation((path: string) => {
    if (path === '/ws/not-found.md') throw new Error('文件不存在');
    return Promise.resolve('# 文件内容\n\n这是一段测试文本。');
  }),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

describe('useEditorStore', () => {
  beforeEach(() => {
    resetEditorStore();
  });

  it('初始状态应该为空', () => {
    const state = useEditorStore.getState();
    expect(state.tabs).toEqual([]);
    expect(state.activeTabId).toBeNull();
    expect(state.viewMode).toBe('edit');
  });

  it('打开文件应该创建新 Tab 并激活', async () => {
    await useEditorStore.getState().openFile('/ws/test.md');
    const state = useEditorStore.getState();
    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0].filePath).toBe('/ws/test.md');
    expect(state.tabs[0].isDirty).toBe(false);
    expect(state.activeTabId).toBe(state.tabs[0].id);
  });

  it('重复打开同一文件应该激活已有 Tab 而不是创建新 Tab', async () => {
    await useEditorStore.getState().openFile('/ws/test.md');
    await useEditorStore.getState().openFile('/ws/test.md');
    expect(useEditorStore.getState().tabs).toHaveLength(1);
  });

  it('更新内容应该标记文件为脏', async () => {
    await useEditorStore.getState().openFile('/ws/test.md');
    const path = '/ws/test.md';
    useEditorStore.getState().updateContent(path, '# 修改后的内容');
    const tab = useEditorStore.getState().tabs.find((t) => t.filePath === path);
    expect(tab!.isDirty).toBe(true);
  });

  it('保存文件应该清除脏标记', async () => {
    await useEditorStore.getState().openFile('/ws/test.md');
    const path = '/ws/test.md';
    useEditorStore.getState().updateContent(path, '# 修改后的内容');
    await useEditorStore.getState().saveFile(path);
    const tab = useEditorStore.getState().tabs.find((t) => t.filePath === path);
    expect(tab!.isDirty).toBe(false);
  });

  it('关闭 Tab 应该从列表中移除', async () => {
    await useEditorStore.getState().openFile('/ws/test.md');
    const tabId = useEditorStore.getState().activeTabId!;
    useEditorStore.getState().closeTab(tabId);
    expect(useEditorStore.getState().tabs).toHaveLength(0);
    expect(useEditorStore.getState().activeTabId).toBeNull();
  });

  it('切换活动 Tab', async () => {
    await useEditorStore.getState().openFile('/ws/note1.md');
    await useEditorStore.getState().openFile('/ws/note2.md');
    const note1Tab = useEditorStore.getState().tabs.find((t) => t.filePath === '/ws/note1.md')!;
    useEditorStore.getState().setActiveTab(note1Tab.id);
    expect(useEditorStore.getState().activeTabId).toBe(note1Tab.id);
  });

  it('应该能切换视图模式', () => {
    useEditorStore.getState().toggleViewMode();
    expect(useEditorStore.getState().viewMode).toBe('preview');
    useEditorStore.getState().toggleViewMode();
    expect(useEditorStore.getState().viewMode).toBe('split');
    useEditorStore.getState().toggleViewMode();
    expect(useEditorStore.getState().viewMode).toBe('edit');
  });

  it('打开不存在的文件应该抛出错误', async () => {
    await expect(useEditorStore.getState().openFile('/ws/not-found.md')).rejects.toThrow('文件不存在');
  });

  it('更新内容后内容应缓存在 store 中', async () => {
    await useEditorStore.getState().openFile('/ws/test.md');
    useEditorStore.getState().updateContent('/ws/test.md', '# 新内容');
    const content = useEditorStore.getState().getContent('/ws/test.md');
    expect(content).toBe('# 新内容');
  });
});
