import { forwardRef } from 'react';
import { FilePlus, FolderPlus, Pencil, Trash2 } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  isVisible: boolean;
  isDirectory: boolean;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(
  ({ x, y, isVisible, isDirectory, onCreateFile, onCreateFolder, onRename, onDelete }, ref) => {
    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        className="fixed z-50 min-w-[160px] bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1"
        style={{ left: x, top: y }}
      >
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
      </div>
    );
  },
);

ContextMenu.displayName = 'ContextMenu';
