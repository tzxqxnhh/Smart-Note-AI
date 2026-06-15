import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useExplorerStore, resetExplorerStore } from '../../../../src/renderer/stores/useExplorerStore';

// Mock IPC 客户端
vi.mock('../../../../src/renderer/lib/ipc-client', () => ({
  listDirectory: vi.fn().mockResolvedValue([
    { name: 'note.md', path: '/ws/note.md', isDirectory: false },
    { name: 'docs', path: '/ws/docs', isDirectory: true, children: [] },
  ]),
  selectDirectory: vi.fn().mockResolvedValue('/ws'),
  createFile: vi.fn().mockResolvedValue(undefined),
  createDirectory: vi.fn().mockResolvedValue(undefined),
  rename: vi.fn().mockResolvedValue(undefined),
  deleteItem: vi.fn().mockResolvedValue(undefined),
  trashItem: vi.fn().mockResolvedValue(undefined),
  copyItem: vi.fn().mockResolvedValue(undefined),
  searchFiles: vi.fn().mockResolvedValue([]),
}));

// Mock allotment, 因为它在 jsdom 中不可用
vi.mock('allotment', () => ({
  Allotment: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { FileExplorer } from '../../../../src/renderer/components/explorer/FileExplorer';
import { createMockElectronAPI } from '../../../mocks/electron';

describe('FileExplorer', () => {
  beforeEach(() => {
    resetExplorerStore();
    window.electronAPI = createMockElectronAPI();
  });

  it('应该在无工作空间时显示空状态', () => {
    render(<FileExplorer />);
    expect(screen.getByText('选择文件夹')).toBeInTheDocument();
  });

  it('有工作空间时应该显示文件树区域', () => {
    useExplorerStore.setState({
      rootPath: '/ws',
      tree: [
        { name: 'note.md', path: '/ws/note.md', isDirectory: false },
        { name: 'docs', path: '/ws/docs', isDirectory: true, children: [] },
      ],
    });
    render(<FileExplorer />);
    // 文件树中应显示文件名
    expect(screen.getByText('note.md')).toBeInTheDocument();
    expect(screen.getByText('docs')).toBeInTheDocument();
  });

  it('重命名输入框应预填不含扩展名的文件名', async () => {
    // 模拟右键菜单状态，通过对 TreeNode 右键触发
    useExplorerStore.setState({
      rootPath: '/ws',
      tree: [
        { name: 'note.md', path: '/ws/note.md', isDirectory: false },
        { name: 'docs', path: '/ws/docs', isDirectory: true, children: [] },
      ],
    });

    render(<FileExplorer />);

    // 找到名为 note.md 的 tree node 并右键
    const fileNode = screen.getByTestId('tree-node-note.md');
    fireEvent.contextMenu(fileNode);

    // 点击重命名菜单项
    const renameButton = await screen.findByText('重命名');
    fireEvent.click(renameButton);

    // 验证重命名输入框预填的值（不含 .md 扩展名）
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('note');
  });

  it('重命名目录时应预填完整目录名', async () => {
    useExplorerStore.setState({
      rootPath: '/ws',
      tree: [
        { name: 'note.md', path: '/ws/note.md', isDirectory: false },
        { name: 'docs', path: '/ws/docs', isDirectory: true, children: [] },
      ],
    });

    render(<FileExplorer />);

    // 找到文件夹节点并右键
    const folderNode = screen.getByTestId('tree-node-docs');
    fireEvent.contextMenu(folderNode);

    // 点击重命名菜单项
    const renameButton = await screen.findByText('重命名');
    fireEvent.click(renameButton);

    // 验证重命名输入框预填的值（目录保留完整名称）
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('docs');
  });

  it('删除操作前应显示确认对话框', async () => {
    useExplorerStore.setState({
      rootPath: '/ws',
      tree: [
        { name: 'note.md', path: '/ws/note.md', isDirectory: false },
      ],
    });

    render(<FileExplorer />);

    // 右键文件节点
    const fileNode = screen.getByTestId('tree-node-note.md');
    fireEvent.contextMenu(fileNode);

    // 点击删除菜单项
    const deleteButton = await screen.findByText('删除');
    fireEvent.click(deleteButton);

    // 确认对话框应出现，显示标题和取消按钮
    expect(screen.getByText('确认删除')).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();
  });

  it('确认对话框中点击取消不应触发删除', async () => {
    const { trashItem: mockTrash } = await import('../../../../src/renderer/lib/ipc-client');

    useExplorerStore.setState({
      rootPath: '/ws',
      tree: [
        { name: 'note.md', path: '/ws/note.md', isDirectory: false },
      ],
    });

    render(<FileExplorer />);

    // 右键文件节点并点击删除
    const fileNode = screen.getByTestId('tree-node-note.md');
    fireEvent.contextMenu(fileNode);
    const deleteButton = await screen.findByText('删除');
    fireEvent.click(deleteButton);

    // 点击取消按钮
    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);

    // trashItem 不应被调用
    expect(mockTrash).not.toHaveBeenCalled();
  });

  it('有工作空间时应显示关闭工作空间按钮', () => {
    useExplorerStore.setState({
      rootPath: '/ws',
      tree: [],
    });
    render(<FileExplorer />);
    // 关闭按钮应存在（通过 title 查找）
    expect(screen.getByTitle('关闭工作空间')).toBeInTheDocument();
  });

  it('点击关闭工作空间按钮后应返回空状态', () => {
    useExplorerStore.setState({
      rootPath: '/ws',
      tree: [],
    });
    render(<FileExplorer />);

    // 点击关闭按钮
    const closeButton = screen.getByTitle('关闭工作空间');
    fireEvent.click(closeButton);

    // rootPath 应为 null，显示空状态界面
    expect(useExplorerStore.getState().rootPath).toBeNull();
    expect(screen.getByText('选择文件夹')).toBeInTheDocument();
  });

  it('复制文件应将路径存入 clipboardPath', async () => {
    useExplorerStore.setState({
      rootPath: '/ws',
      tree: [
        { name: 'note.md', path: '/ws/note.md', isDirectory: false },
      ],
    });

    render(<FileExplorer />);

    // 右键文件节点
    const fileNode = screen.getByTestId('tree-node-note.md');
    fireEvent.contextMenu(fileNode);

    // 点击复制菜单项
    const copyButton = await screen.findByText('复制');
    fireEvent.click(copyButton);

    // clipboardPath 应被设置为文件路径
    expect(useExplorerStore.getState().clipboardPath).toBe('/ws/note.md');
  });

  it('粘贴时应调用 copyItem 并清除剪切板', async () => {
    const { copyItem: mockCopy } = await import('../../../../src/renderer/lib/ipc-client');

    // 预设剪切板中有内容
    useExplorerStore.setState({
      rootPath: '/ws',
      clipboardPath: '/ws/source.md',
      tree: [
        { name: 'docs', path: '/ws/docs', isDirectory: true, children: [] },
      ],
    });

    render(<FileExplorer />);

    // 右键文件夹节点
    const folderNode = screen.getByTestId('tree-node-docs');
    fireEvent.contextMenu(folderNode);

    // 点击粘贴菜单项
    const pasteButton = await screen.findByText('粘贴');
    fireEvent.click(pasteButton);

    // copyItem 应被调用
    expect(mockCopy).toHaveBeenCalledWith('/ws/source.md', '/ws/docs');
    // 等待异步操作完成，剪切板应被清除
    await waitFor(() => {
      expect(useExplorerStore.getState().clipboardPath).toBeNull();
    });
  });
});
