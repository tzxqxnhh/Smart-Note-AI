import { useState, useEffect } from 'react';
import { X, FileText, Clock, Tag, Trash2 } from 'lucide-react';
import { useVectorDbStore } from '../../stores/useVectorDbStore';
import { ragGetChunkDetail } from '../../lib/ipc-client';
import type { ChunkDetail } from '@shared/types';
import { ConfirmDialog } from '../common/ConfirmDialog';

/**
 * 切片详情弹窗
 * 从 store 读取 detailChunkId，通过 useEffect 获取详情数据
 */
export function ChunkDetailModal() {
  const { detailChunkId, closeDetail, deleteSingleChunk } = useVectorDbStore();
  const [detail, setDetail] = useState<ChunkDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!detailChunkId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    ragGetChunkDetail(detailChunkId)
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetail(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [detailChunkId]);

  if (!detailChunkId) return null;

  const handleDelete = async () => {
    await deleteSingleChunk(detailChunkId);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeDetail}>
        <div
          className="w-[560px] max-h-[70vh] bg-gray-800 border border-gray-600 rounded-lg shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <span className="text-sm font-medium text-gray-200">切片详情</span>
            <button
              className="p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-gray-300"
              onClick={closeDetail}
            >
              <X size={16} />
            </button>
          </div>

          {/* 内容区 */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {loading && (
              <div className="text-sm text-gray-500 py-4 text-center">加载中...</div>
            )}

            {!loading && !detail && (
              <div className="text-sm text-gray-500 py-4 text-center">无法加载切片详情</div>
            )}

            {!loading && detail && (
              <>
                {/* 元数据 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <FileText size={12} />
                    <span className="text-gray-500">来源文件:</span>
                    <span className="text-gray-300 truncate">{detail.sourceFile}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Tag size={12} />
                    <span className="text-gray-500">所属标题:</span>
                    <span className="text-gray-300">{detail.headingText}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock size={12} />
                    <span className="text-gray-500">存储时间:</span>
                    <span className="text-gray-300">{detail.storedAt ?? '未知'}</span>
                  </div>
                </div>

                {/* 分割线 */}
                <div className="border-t border-gray-700" />

                {/* 切片内容 */}
                <div>
                  <span className="text-xs text-gray-500 mb-2 block">切片内容</span>
                  <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-words bg-gray-900 rounded p-3 max-h-96 overflow-y-auto border border-gray-700">
                    {detail.content}
                  </pre>
                </div>
              </>
            )}
          </div>

          {/* 底部操作 */}
          <div className="flex justify-end px-4 py-3 border-t border-gray-700">
            <button
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={12} />
              删除此切片
            </button>
          </div>
        </div>
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="确认删除"
          message="确定要删除这个切片吗？此操作不可撤销。"
          confirmLabel="确定"
          cancelLabel="取消"
          isDestructive
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}
