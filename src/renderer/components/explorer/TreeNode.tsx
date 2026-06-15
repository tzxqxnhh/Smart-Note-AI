import React from 'react';
import type { FileNode } from '@shared/types';
import { Folder, File, ChevronRight, ChevronDown } from 'lucide-react';

interface TreeNodeProps {
  node: FileNode;
  depth: number;
  selectedPath: string | null;
  expandedPaths: Set<string>;
  onSelect?: (node: FileNode) => void;
  onToggleExpand?: (path: string) => void;
  // 右键菜单回调，传递事件和当前节点信息
  onContextMenu?: (e: React.MouseEvent, node: FileNode) => void;
}

export function TreeNode({
  node,
  depth,
  selectedPath,
  expandedPaths,
  onSelect,
  onToggleExpand,
  onContextMenu,
}: TreeNodeProps) {
  const isSelected = selectedPath === node.path;
  const isExpanded = expandedPaths.has(node.path);
  const paddingLeft = depth * 16 + 4;

  const handleClick = () => {
    if (node.isDirectory) {
      onToggleExpand?.(node.path);
    }
    onSelect?.(node);
  };

  // 右键菜单处理：阻止浏览器默认菜单和事件冒泡，传递节点信息
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(e, node);
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-1 py-0.5 cursor-pointer rounded text-sm hover:bg-gray-700
          ${isSelected ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        data-testid={`tree-node-${node.name}`}
      >
        {node.isDirectory ? (
          <>
            <span className="w-4 h-4 flex items-center justify-center text-gray-500 shrink-0">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <Folder size={16} className="text-yellow-500 shrink-0" />
          </>
        ) : (
          <>
            <span className="w-4 shrink-0" />
            <File size={16} className="text-gray-400 shrink-0" />
          </>
        )}
        <span className="truncate" title={node.name}>
          {node.name}
        </span>
      </div>
      {/* 递归渲染子节点 */}
      {node.isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              expandedPaths={expandedPaths}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}
