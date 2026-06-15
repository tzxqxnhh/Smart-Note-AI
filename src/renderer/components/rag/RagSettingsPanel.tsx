import { useEffect, useRef } from 'react';
import { Settings, X } from 'lucide-react';
import { useRagSettingsStore } from '../../stores/useRagSettingsStore';

/**
 * RAG 文本切分设置面板
 * 覆盖层风格与 SearchBar 一致
 */
export function RagSettingsPanel() {
  const {
    isOpen,
    targetFilePath,
    settings,
    isIndexing,
    setMaxChunkSize,
    setMaxOverlap,
    setSeparator,
    confirmIndex,
    closeSettings,
  } = useRagSettingsStore();

  const inputRef = useRef<HTMLInputElement>(null);

  // 打开时自动聚焦到分隔符输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-center pt-16 bg-black/40" onClick={closeSettings}>
      <div
        className="w-[480px] bg-gray-850 border border-gray-600 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-200">RAG 文本切分设置</span>
          </div>
          <button
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
            onClick={closeSettings}
          >
            <X size={16} />
          </button>
        </div>

        {/* 文件路径显示 */}
        <div className="px-4 py-2 text-xs text-gray-500 truncate border-b border-gray-700">
          目标文件: {targetFilePath ?? '(未选择)'}
        </div>

        {/* 设置表单 */}
        <div className="px-4 py-4 space-y-4">
          {/* 最大切分字符数 */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">最大切分字符数</label>
            <input
              className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
              type="number"
              min={100}
              max={10000}
              value={settings.maxChunkSize}
              onChange={(e) => setMaxChunkSize(Number(e.target.value))}
            />
          </div>

          {/* 最大重叠字符数 */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">最大重叠字符数</label>
            <input
              className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
              type="number"
              min={0}
              max={1000}
              value={settings.maxOverlap}
              onChange={(e) => setMaxOverlap(Number(e.target.value))}
            />
          </div>

          {/* 分隔符 */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">分隔符</label>
            <input
              ref={inputRef}
              className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
              placeholder="例如: ##"
              value={settings.separator}
              onChange={(e) => setSeparator(e.target.value)}
            />
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-700">
          <button
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200"
            onClick={closeSettings}
            disabled={isIndexing}
          >
            取消
          </button>
          <button
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
            onClick={confirmIndex}
            disabled={isIndexing || !targetFilePath}
          >
            {isIndexing ? '索引中...' : '确定'}
          </button>
        </div>
      </div>
    </div>
  );
}
