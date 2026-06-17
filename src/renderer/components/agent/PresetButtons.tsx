import { Database, Trash2 } from 'lucide-react';

interface PresetButtonsProps {
  vectorDbEnabled: boolean;
  onToggleVectorDb: () => void;
  onClearHistory: () => void;
  disabled?: boolean;
}

export function PresetButtons({
  vectorDbEnabled,
  onToggleVectorDb,
  onClearHistory,
  disabled = false,
}: PresetButtonsProps) {
  return (
    <div className="flex gap-1 px-2 py-1.5 border-t border-gray-700 overflow-x-auto">
      {/* 向量库开关 */}
      <button
        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded whitespace-nowrap disabled:opacity-30 transition-colors"
        onClick={onToggleVectorDb}
        disabled={disabled}
        title={vectorDbEnabled ? '向量库已开启：点击关闭' : '向量库已关闭：点击开启'}
      >
        <Database
          size={14}
          className={vectorDbEnabled ? 'text-green-400' : 'text-gray-500'}
        />
        <span>{vectorDbEnabled ? '向量库' : '向量库(关)'}</span>
      </button>

      {/* 清空对话 */}
      <button
        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded whitespace-nowrap disabled:opacity-30 transition-colors"
        onClick={onClearHistory}
        disabled={disabled}
        title="清空对话"
      >
        <Trash2 size={14} />
        <span>清空</span>
      </button>
    </div>
  );
}
