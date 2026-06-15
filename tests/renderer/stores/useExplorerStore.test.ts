import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useExplorerStore, resetExplorerStore } from '../../../src/renderer/stores/useExplorerStore';

// Mock IPC 客户端
vi.mock('../../../src/renderer/lib/ipc-client', () => ({
  listDirectory: vi.fn().mockResolvedValue([
    { name: 'folder1', path: '/ws/folder1', isDirectory: true, children: [] },
    { name: 'note.md', path: '/ws/note.md', isDirectory: false },
  ]),
  readFile: vi.fn().mockResolvedValue('# 测试内容'),
  writeFile: vi.fn().mockResolvedValue(undefined),
  createFile: vi.fn().mockResolvedValue(undefined),
  createDirectory: vi.fn().mockResolvedValue(undefined),
  rename: vi.fn().mockResolvedValue(undefined),
  deleteItem: vi.fn().mockResolvedValue(undefined),
  searchFiles: vi.fn().mockResolvedValue([]),
}));

describe('useExplorerStore', () => {
  beforeEach(() => {
    resetExplorerStore();
  });

  it('初始状态应该为空', () => {
    const state = useExplorerStore.getState();
    expect(state.rootPath).toBeNull();
    expect(state.tree).toEqual([]);
    expect(state.selectedPath).toBeNull();
    expect(state.expandedPaths).toBeInstanceOf(Set);
    expect(state.isLoading).toBe(false);
  });

  it('setRootPath 应该设置根路径', () => {
    useExplorerStore.getState().setRootPath('/test/workspace');
    expect(useExplorerStore.getState().rootPath).toBe('/test/workspace');
  });

  it('selectNode 应该设置选中路径', () => {
    useExplorerStore.getState().selectNode('/path/to/file.md');
    expect(useExplorerStore.getState().selectedPath).toBe('/path/to/file.md');
  });

  it('toggleExpand 应该切换展开状态', () => {
    const path = '/test/folder';
    useExplorerStore.getState().toggleExpand(path);
    expect(useExplorerStore.getState().expandedPaths.has(path)).toBe(true);
    useExplorerStore.getState().toggleExpand(path);
    expect(useExplorerStore.getState().expandedPaths.has(path)).toBe(false);
  });

  it('setTree 应该设置文件树', () => {
    const tree = [
      { name: 'test.md', path: '/ws/test.md', isDirectory: false },
    ];
    useExplorerStore.getState().setTree(tree);
    expect(useExplorerStore.getState().tree).toEqual(tree);
  });

  it('setLoading 应该设置加载状态', () => {
    useExplorerStore.getState().setLoading(true);
    expect(useExplorerStore.getState().isLoading).toBe(true);
    useExplorerStore.getState().setLoading(false);
    expect(useExplorerStore.getState().isLoading).toBe(false);
  });

  it('toggleExpand 每次调用应产生新的 Set 引用（不可变性）', () => {
    const originalSet = useExplorerStore.getState().expandedPaths;
    useExplorerStore.getState().toggleExpand('/test/folder');
    const newSet = useExplorerStore.getState().expandedPaths;
    // 引用应不同（新 Set）
    expect(newSet).not.toBe(originalSet);
    expect(newSet.has('/test/folder')).toBe(true);
    // 原始 Set 不应被修改
    expect(originalSet.has('/test/folder')).toBe(false);
  });

  describe('clipboardPath', () => {
    it('clipboardPath 初始为 null', () => {
      expect(useExplorerStore.getState().clipboardPath).toBeNull();
    });

    it('setClipboardPath 应该存储路径', () => {
      useExplorerStore.getState().setClipboardPath('/ws/note.md');
      expect(useExplorerStore.getState().clipboardPath).toBe('/ws/note.md');
    });

    it('setClipboardPath 应该能清除路径', () => {
      useExplorerStore.getState().setClipboardPath('/ws/note.md');
      useExplorerStore.getState().setClipboardPath(null);
      expect(useExplorerStore.getState().clipboardPath).toBeNull();
    });

    it('resetExplorerStore 应该清除 clipboardPath', () => {
      useExplorerStore.getState().setClipboardPath('/ws/note.md');
      resetExplorerStore();
      expect(useExplorerStore.getState().clipboardPath).toBeNull();
    });
  });
});
