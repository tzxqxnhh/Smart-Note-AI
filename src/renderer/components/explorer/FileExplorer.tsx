import React, { useState } from 'react';
import { FolderOpen, RefreshCw, X } from 'lucide-react';
import { useExplorerStore } from '../../stores/useExplorerStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { useAgentStore } from '../../stores/useAgentStore';
import { useRagSettingsStore } from '../../stores/useRagSettingsStore';
import { useContextMenu } from '../../hooks/useContextMenu';
import { TreeNode } from './TreeNode';
import { ContextMenu } from './ContextMenu';
import { ConfirmDialog } from '../common/ConfirmDialog';
import * as ipcClient from '../../lib/ipc-client';

export function FileExplorer() {
  const {
    rootPath,
    tree,
    selectedPath,
    expandedPaths,
    isLoading,
    clipboardPath,
    setRootPath,
    setTree,
    selectNode,
    toggleExpand,
    setLoading,
    setClipboardPath,
  } = useExplorerStore();

  const { menuState, menuRef, showMenu, hideMenu } = useContextMenu();
  const [createInput, setCreateInput] = useState<{ parentPath: string; type: 'file' | 'folder' } | null>(null);
  const [newName, setNewName] = useState('');
  const [renamePath, setRenamePath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteConfirmPath, setDeleteConfirmPath] = useState<string | null>(null);

  // 加载文件树
  const loadTree = async (dirPath: string) => {
    setLoading(true);
    try {
      const fileTree = await ipcClient.listDirectory(dirPath);
      setTree(fileTree);
      // 自动展开根目录下的第一层目录（通过 set 保证不可变性）
      const newExpanded = new Set<string>();
      fileTree.forEach((node: import('@shared/types').FileNode) => {
        if (node.isDirectory) {
          newExpanded.add(node.path);
        }
      });
      useExplorerStore.setState({ expandedPaths: newExpanded });
    } catch (err) {
      console.error('加载文件树失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 选择工作空间
  const handleSelectWorkspace = async () => {
    const dir = await ipcClient.selectDirectory();
    if (dir) {
      setRootPath(dir);
      loadTree(dir);
    }
  };

  // 刷新
  const handleRefresh = () => {
    if (rootPath) {
      loadTree(rootPath);
    }
  };

  // 关闭工作空间
  const handleCloseWorkspace = () => {
    setRootPath(null);
    setTree([]);
  };

  // 点击文件节点
  const openFile = useEditorStore((s) => s.openFile);
  const openRagSettings = useRagSettingsStore((s) => s.openSettings);

  // 点击文件节点
  const handleNodeSelect = (node: import('@shared/types').FileNode) => {
    selectNode(node.path);
    // 点击 .md 文件时在编辑器中打开
    if (!node.isDirectory && node.name.endsWith('.md')) {
      openFile(node.path);
    }
  };

  // 右键菜单：针对具体文件/文件夹节点
  const handleNodeContextMenu = (e: React.MouseEvent, node: import('@shared/types').FileNode) => {
    showMenu(e, node.path, node.name, node.isDirectory);
  };

  // 右键菜单操作
  const handleCreateFile = () => {
    hideMenu();
    // 如果在文件夹上右键，在文件夹内创建；如果在文件上右键，在文件同级目录创建
    const parentPath = menuState.isDirectory
      ? menuState.targetPath!
      : menuState.targetPath
        ? menuState.targetPath.replace(/[\\/][^\\/]+$/, '') // 去掉文件名，取父目录
        : rootPath!;
    setCreateInput({ parentPath, type: 'file' });
  };

  const handleCreateFolder = () => {
    hideMenu();
    const parentPath = menuState.isDirectory
      ? menuState.targetPath!
      : menuState.targetPath
        ? menuState.targetPath.replace(/[\\/][^\\/]+$/, '')
        : rootPath!;
    setCreateInput({ parentPath, type: 'folder' });
  };

  const handleRename = () => {
    hideMenu();
    setRenamePath(menuState.targetPath);
    const name = menuState.targetName || '';
    // 文件去掉扩展名（仅匹配最后一个 .xxx），目录保留完整名称
    const baseName = menuState.isDirectory ? name : name.replace(/\.[^.\\/]+$/, '');
    setRenameValue(baseName);
  };

  const handleDelete = () => {
    hideMenu();
    if (!menuState.targetPath) return;
    // 显示确认对话框
    setDeleteConfirmPath(menuState.targetPath);
  };

  // 复制文件/文件夹路径到剪切板
  const handleCopy = () => {
    hideMenu();
    if (!menuState.targetPath) return;
    setClipboardPath(menuState.targetPath);
  };

  // 粘贴复制的内容到当前右键目标目录
  const handlePaste = async () => {
    hideMenu();
    if (!clipboardPath || !menuState.targetPath) return;
    try {
      await ipcClient.copyItem(clipboardPath, menuState.targetPath);
      setClipboardPath(null);
      if (rootPath) loadTree(rootPath);
    } catch (err) {
      console.error('粘贴失败:', err);
    }
  };

  // 文本切分：打开 RAG 设置
  const handleChunk = () => {
    hideMenu();
    if (menuState.targetPath) {
      openRagSettings(menuState.targetPath);
    }
  };

  // 生成结构图：设置选中文件夹并触发 visualize 操作
  const handleVisualize = () => {
    hideMenu();
    useAgentStore.getState().setSelectedFolder(menuState.targetPath);
    useAgentStore.getState().runPresetAction('visualize');
  };

  // 确认删除：优先使用系统回收站，降级到永久删除
  const confirmDelete = async () => {
    if (!deleteConfirmPath) return;
    try {
      await ipcClient.trashItem(deleteConfirmPath);
    } catch (trashErr) {
      // 如果放入回收站失败（如跨卷移动），降级到永久删除
      console.warn('放入回收站失败，尝试永久删除:', trashErr);
      try {
        await ipcClient.deleteItem(deleteConfirmPath);
      } catch (err) {
        console.error('删除失败:', err);
      }
    }
    if (rootPath) loadTree(rootPath);
    setDeleteConfirmPath(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmPath(null);
  };

  // 确认创建
  const confirmCreate = async () => {
    if (!createInput || !newName.trim()) return;
    try {
      if (createInput.type === 'file') {
        await ipcClient.createFile(createInput.parentPath, newName.trim());
      } else {
        await ipcClient.createDirectory(createInput.parentPath, newName.trim());
      }
      if (rootPath) loadTree(rootPath);
    } catch (err) {
      console.error('创建失败:', err);
    }
    setCreateInput(null);
    setNewName('');
  };

  // 确认重命名
  const confirmRename = async () => {
    if (!renamePath || !renameValue.trim()) return;
    try {
      await ipcClient.rename(renamePath, renameValue.trim());
      if (rootPath) loadTree(rootPath);
    } catch (err) {
      console.error('重命名失败:', err);
    }
    setRenamePath(null);
    setRenameValue('');
  };

  // 无工作空间时的提示
  if (!rootPath) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b border-gray-700 text-sm font-medium text-gray-300">
          资源管理器
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <FolderOpen size={40} className="text-gray-600 mb-3" />
          <p className="text-gray-500 text-sm text-center mb-3">尚未选择工作空间</p>
          <button
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-500"
            onClick={handleSelectWorkspace}
          >
            选择文件夹
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶部：工作空间路径 */}
      <div className="px-4 py-3 border-b border-gray-700 text-sm font-medium text-gray-300 flex items-center justify-between shrink-0">
        <span className="truncate text-xs text-gray-400" title={rootPath}>
          资源管理器
        </span>
        <div className="flex items-center gap-0.5">
          <button
            className="p-0.5 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
            onClick={handleRefresh}
            title="刷新"
          >
            <RefreshCw size={14} />
          </button>
          <button
            className="p-0.5 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
            onClick={handleCloseWorkspace}
            title="关闭工作空间"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 文件树 */}
      <div
        className="flex-1 overflow-auto py-1"
        onContextMenu={(e) => {
          if (rootPath) {
            showMenu(e, rootPath, '', true /* 工作空间根目录 */);
          }
        }}
      >
        {isLoading ? (
          <div className="p-3 text-sm text-gray-500">加载中...</div>
        ) : tree.length === 0 ? (
          <div className="p-3 text-sm text-gray-500">空文件夹</div>
        ) : (
          tree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              depth={0}
              selectedPath={selectedPath}
              expandedPaths={expandedPaths}
              onSelect={handleNodeSelect}
              onToggleExpand={toggleExpand}
              onContextMenu={handleNodeContextMenu}
            />
          ))
        )}
      </div>

      {/* 右键菜单 */}
      <ContextMenu
        ref={menuRef}
        x={menuState.x}
        y={menuState.y}
        isVisible={menuState.isVisible}
        isDirectory={menuState.isDirectory}
        clipboardPath={clipboardPath}
        showChunkItem={
          !menuState.isDirectory &&
          menuState.targetName !== null &&
          menuState.targetName.endsWith('.md')
        }
        onCreateFile={handleCreateFile}
        onCreateFolder={handleCreateFolder}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onRename={handleRename}
        onDelete={handleDelete}
        onChunk={handleChunk}
        onVisualize={handleVisualize}
      />

      {/* 创建输入弹窗 */}
      {createInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setCreateInput(null); setNewName(''); }}>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 w-80" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-gray-200 mb-3">
              新建{createInput.type === 'file' ? '文件' : '文件夹'}
            </h3>
            <input
              className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
              placeholder={createInput.type === 'file' ? '例如: note.md' : '例如: my-folder'}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmCreate();
                if (e.key === 'Escape') { setCreateInput(null); setNewName(''); }
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <button className="px-3 py-1 text-sm text-gray-400 hover:text-gray-200" onClick={() => { setCreateInput(null); setNewName(''); }}>
                取消
              </button>
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-500" onClick={confirmCreate}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 重命名输入弹窗 */}
      {renamePath && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setRenamePath(null)}>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 w-80" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-gray-200 mb-3">重命名</h3>
            <input
              className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename();
                if (e.key === 'Escape') setRenamePath(null);
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <button className="px-3 py-1 text-sm text-gray-400 hover:text-gray-200" onClick={() => setRenamePath(null)}>
                取消
              </button>
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-500" onClick={confirmRename}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {deleteConfirmPath && (
        <ConfirmDialog
          title="确认删除"
          message={`确定要删除此${menuState.isDirectory ? '文件夹' : '文件'}吗？此操作会将其移动到系统回收站。`}
          confirmLabel="删除"
          isDestructive={true}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}
