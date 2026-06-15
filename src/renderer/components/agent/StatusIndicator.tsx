import type { AgentStatus } from '@shared/types';

const statusConfig: Record<AgentStatus, { color: string; label: string }> = {
  idle: { color: 'bg-green-500', label: '就绪' },
  indexing: { color: 'bg-yellow-500 animate-pulse', label: '索引中...' },
  thinking: { color: 'bg-yellow-500 animate-pulse', label: '思考中...' },
  generating: { color: 'bg-blue-500 animate-pulse', label: '生成中...' },
  done: { color: 'bg-green-500', label: '完成' },
  error: { color: 'bg-red-500', label: '错误' },
};

export function StatusIndicator({ status }: { status: AgentStatus }) {
  const config = statusConfig[status];
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-700 text-xs text-gray-400">
      <span className={`w-2 h-2 rounded-full ${config.color}`} />
      <span>{config.label}</span>
    </div>
  );
}
