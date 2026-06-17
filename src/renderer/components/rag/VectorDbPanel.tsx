import { Database, X, FileText, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import { useVectorDbStore } from '../../stores/useVectorDbStore';

/**
 * 向量库管理面板
 * 内嵌在 AgentPanel 中，通过 isOpen 切换
 */
export function VectorDbPanel() {
  const {
    isOpen,
    batchMode,
    fileGroups,
    expandedFiles,
    selectedChunkIds,
    loading,
    error,
    toggleFileExpand,
    enterBatchMode,
    exitBatchMode,
    toggleChunkSelection,
    toggleFileSelection,
    confirmBatchDelete,
    openDetail,
    loadChunks,
    closePanel,
  } = useVectorDbStore();

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-200">向量库管理</span>
        </div>
        <button
          className="p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-gray-300"
          onClick={closePanel}
        >
          <X size={16} />
        </button>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {/* 加载态 */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <span className="text-sm text-gray-500">加载中...</span>
          </div>
        )}

        {/* 错误态 */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-3 py-8 px-4">
            <span className="text-sm text-red-400">{error}</span>
            <button
              className="px-3 py-1 text-xs text-gray-300 hover:text-gray-100 bg-gray-700 hover:bg-gray-600 rounded"
              onClick={loadChunks}
            >
              重试
            </button>
          </div>
        )}

        {/* 空状态 */}
        {!loading && !error && fileGroups.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
            <Database size={32} className="text-gray-600" />
            <span className="text-sm text-gray-400">向量库中暂无切片数据</span>
            <span className="text-xs text-gray-500">先通过 RAG 设置面板索引 Markdown 文件</span>
          </div>
        )}

        {/* 文件列表 */}
        {!loading && !error && fileGroups.length > 0 && (
          <div>
            {fileGroups.map((group) => {
              const isExpanded = expandedFiles.has(group.filePath);
              return (
                <div key={group.filePath}>
                  {/* 文件行 */}
                  <div
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-750 cursor-pointer border-b border-gray-800"
                    onClick={() => toggleFileExpand(group.filePath)}
                  >
                    {/* 批量模式勾选框 */}
                    {batchMode && (
                      <input
                        type="checkbox"
                        className="w-3 h-3 accent-blue-500"
                        checked={group.chunks.every((c) => selectedChunkIds.has(c.id))}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleFileSelection(group.filePath);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    {/* 展开箭头 */}
                    {isExpanded ? (
                      <ChevronDown size={14} className="text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />
                    )}
                    <FileText size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300 truncate flex-1">{group.fileName}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">{group.chunkCount}条</span>
                  </div>

                  {/* 切片列表（展开时） */}
                  {isExpanded &&
                    group.chunks.map((chunk) => (
                      <div
                        key={chunk.id}
                        className="flex items-center gap-2 pl-12 pr-4 py-1.5 hover:bg-gray-750 cursor-pointer border-b border-gray-800/50"
                        onClick={() => {
                          if (!batchMode) {
                            openDetail(chunk.id);
                          } else {
                            toggleChunkSelection(chunk.id);
                          }
                        }}
                      >
                        {/* 批量模式勾选框 */}
                        {batchMode && (
                          <input
                            type="checkbox"
                            className="w-3 h-3 accent-blue-500"
                            checked={selectedChunkIds.has(chunk.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleChunkSelection(chunk.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <span className="text-xs text-gray-400 truncate flex-1">
                          {chunk.contentPreview}
                        </span>
                        <span className="text-xs text-gray-600 flex-shrink-0">
                          {chunk.storedAt ?? '未知'}
                        </span>
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 页脚 */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-700">
        {batchMode ? (
          <>
            <button
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-gray-700 rounded"
              onClick={confirmBatchDelete}
            >
              <Trash2 size={12} />
              删除选中 ({selectedChunkIds.size})
            </button>
            <button
              className="px-2 py-1 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded"
              onClick={exitBatchMode}
            >
              退出批量模式
            </button>
          </>
        ) : (
          <>
            <div />
            <button
              className="px-2 py-1 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded"
              onClick={enterBatchMode}
              disabled={fileGroups.length === 0}
            >
              批量删除
            </button>
          </>
        )}
      </div>
    </div>
  );
}
