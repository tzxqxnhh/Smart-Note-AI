import { FileText, Maximize2, AlignLeft, GitBranch, MessageSquare } from 'lucide-react';
import type { AgentAction } from '@shared/types';

interface PresetButtonsProps {
  onAction: (action: AgentAction) => void;
  disabled?: boolean;
}

const presets: Array<{ action: AgentAction; label: string; icon: React.ReactNode }> = [
  { action: 'summarize', label: '总结', icon: <FileText size={14} /> },
  { action: 'expand', label: '扩写', icon: <Maximize2 size={14} /> },
  { action: 'format', label: '格式化', icon: <AlignLeft size={14} /> },
  { action: 'visualize', label: '结构图', icon: <GitBranch size={14} /> },
  { action: 'ask', label: '问答', icon: <MessageSquare size={14} /> },
];

export function PresetButtons({ onAction, disabled = false }: PresetButtonsProps) {
  return (
    <div className="flex gap-1 px-2 py-1.5 border-t border-gray-700 overflow-x-auto">
      {presets.map((p) => (
        <button
          key={p.action}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded whitespace-nowrap disabled:opacity-30 transition-colors"
          onClick={() => onAction(p.action)}
          disabled={disabled}
          title={p.label}
        >
          {p.icon}
          <span>{p.label}</span>
        </button>
      ))}
    </div>
  );
}
