import { forwardRef } from 'react';
import { FilePlus, FolderPlus, Pencil, Trash2, Copy, ClipboardPaste, Scissors, GitBranch } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  isVisible: boolean;
  isDirectory: boolean;
  clipboardPath: string | null;
  showChunkItem: boolean;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onRename: () => void;
  onDelete: () => void;
  onChunk: () => void;
  onVisualize?: () => void;
}

export const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(
  ({ x, y, isVisible, isDirectory, clipboardPath, showChunkItem, onCreateFile, onCreateFolder, onCopy, onPaste, onRename, onDelete, onChunk, onVisualize }, ref) => {
    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        className="fixed z-50 min-w-[160px] bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1"
        style={{ left: x, top: y }}
      >
        {isDirectory ? (
          <>
            <button
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
              onClick={onCreateFile}
            >
              <FilePlus size={14} />
              新建文件
            </button>
            <button
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
              onClick={onCreateFolder}
            >
              <FolderPlus size={14} />
              新建文件夹
            </button>
            {clipboardPath && (
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
                onClick={onPaste}
              >
                <ClipboardPaste size={14} />
                粘贴
              </button>
            )}
            {onVisualize && (
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
                onClick={onVisualize}
              >
                <GitBranch size={14} />
                生成结构图
              </button>
            )}
            <div className="border-t border-gray-700 my-1" />
            <button
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
              onClick={onRename}
            >
              <Pencil size={14} />
              重命名
            </button>
            <button
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-gray-700"
              onClick={onDelete}
            >
              <Trash2 size={14} />
              删除
            </button>
          </>
        ) : (
          <>
            {showChunkItem && (
              <>
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
                  onClick={onChunk}
                >
                  <Scissors size={14} />
                  文本切分
                </button>
                <div className="border-t border-gray-700 my-1" />
              </>
            )}
            <button
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
              onClick={onCopy}
            >
              <Copy size={14} />
              复制
            </button>
            <div className="border-t border-gray-700 my-1" />
            <button
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
              onClick={onRename}
            >
              <Pencil size={14} />
              重命名
            </button>
            <button
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-gray-700"
              onClick={onDelete}
            >
              <Trash2 size={14} />
              删除
            </button>
          </>
        )}
      </div>
    );
  },
);

ContextMenu.displayName = 'ContextMenu';
