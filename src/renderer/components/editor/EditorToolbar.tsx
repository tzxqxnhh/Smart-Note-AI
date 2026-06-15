import { Save, Eye, FileText, Columns2, Search } from 'lucide-react';
import type { ViewMode } from '@shared/types';

interface EditorToolbarProps {
  viewMode: ViewMode;
  isDirty: boolean;
  wordCount: number;
  onSave: () => void;
  onToggleViewMode: () => void;
  onSearchOpen: () => void;
}

export function EditorToolbar({ viewMode, isDirty, wordCount, onSave, onToggleViewMode, onSearchOpen }: EditorToolbarProps) {
  const viewModeLabel: Record<ViewMode, string> = {
    edit: '编辑',
    preview: '预览',
    split: '双栏',
  };

  const viewModeIcon: Record<ViewMode, React.ReactNode> = {
    edit: <FileText size={14} />,
    preview: <Eye size={14} />,
    split: <Columns2 size={14} />,
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-700 bg-gray-850 shrink-0">
      <button
        className="flex items-center gap-1 px-2 py-1 text-sm text-gray-300 hover:bg-gray-700 rounded disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={onSave}
        disabled={!isDirty}
        title="保存 (Ctrl+S)"
      >
        <Save size={14} />
        {isDirty && <span className="text-yellow-500">●</span>}
      </button>
      <button
        className="flex items-center gap-1 px-2 py-1 text-sm text-gray-300 hover:bg-gray-700 rounded"
        onClick={onToggleViewMode}
        title="切换视图"
      >
        {viewModeIcon[viewMode]}
        <span className="text-xs">{viewModeLabel[viewMode]}</span>
      </button>
      <div className="flex-1" />
      <button
        className="flex items-center gap-1 px-2 py-1 text-sm text-gray-300 hover:bg-gray-700 rounded"
        onClick={onSearchOpen}
        title="搜索 (Ctrl+Shift+F)"
      >
        <Search size={14} />
      </button>
      <span className="text-xs text-gray-500">{wordCount} 字</span>
    </div>
  );
}
