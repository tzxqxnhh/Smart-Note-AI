import { useState } from 'react';
import type { ChatMessage as ChatMessageType } from '@shared/types';
import type { ToolStep } from '@shared/types';
import { User, Bot, Search, FileText, Edit3, ChevronDown, ChevronRight } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  onCitationClick?: (sourceFile: string) => void;
  isStreaming?: boolean;
}

/** 单个工具步骤的展示 */
function ToolStepItem({ step }: { step: ToolStep }) {
  const [expanded, setExpanded] = useState(false);

  const iconMap: Record<ToolStep['type'], React.ReactNode> = {
    read: <FileText size={12} className="text-blue-400 shrink-0" />,
    search: <Search size={12} className="text-green-400 shrink-0" />,
    write: <Edit3 size={12} className="text-yellow-400 shrink-0" />,
  };

  const labelMap: Record<ToolStep['type'], string> = {
    read: '读取文件',
    search: '检索笔记',
    write: '写入文件',
  };

  const hasDetails =
    (step.type === 'search' && step.chunkSources && step.chunkSources.length > 0) ||
    (step.type === 'read' && step.filePath) ||
    (step.type === 'write' && step.writtenPath);

  return (
    <div className="text-xs">
      <div
        className={`flex items-center gap-1.5 py-0.5 ${
          hasDetails ? 'cursor-pointer hover:text-gray-300' : ''
        }`}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        {hasDetails && (
          <span className="text-gray-500">
            {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </span>
        )}
        {iconMap[step.type]}
        <span className="text-gray-400">
          {labelMap[step.type]}
          {step.type === 'search' && step.chunkCount !== undefined && (
            <span className="text-gray-500">
              {' '}
              {step.chunkCount} 个相关片段
            </span>
          )}
          {step.type === 'read' && step.filePath && (
            <span className="text-gray-500 truncate ml-1">
              {step.filePath.replace(/^.*[\\/]/, '')}
            </span>
          )}
          {step.type === 'write' && step.writtenPath && (
            <span className="text-gray-500 truncate ml-1">
              {step.writtenPath.replace(/^.*[\\/]/, '')}
            </span>
          )}
        </span>
      </div>

      {/* 展开详情 */}
      {expanded && hasDetails && (
        <div className="ml-5 mt-1 mb-1 space-y-0.5">
          {step.type === 'search' &&
            step.chunkSources?.map((src) => (
              <div
                key={src.chunkId}
                className="text-gray-500 bg-gray-800 rounded px-2 py-1"
              >
                <div className="truncate text-gray-400">
                  {src.sourceFile.replace(/^.*[\\/]/, '')} &gt; {src.headingText}
                </div>
                <div className="text-gray-600 text-xs mt-0.5 truncate">
                  {src.contentPreview}
                </div>
              </div>
            ))}
          {step.type === 'read' && step.filePath && (
            <div className="text-gray-500 bg-gray-800 rounded px-2 py-1 truncate">
              {step.filePath}
            </div>
          )}
          {step.type === 'write' && step.writtenPath && (
            <div className="text-gray-500 bg-gray-800 rounded px-2 py-1 truncate">
              {step.writtenPath}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ChatMessage({
  message,
  onCitationClick,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const hasToolSteps = message.toolSteps && message.toolSteps.length > 0;

  return (
    <div
      className={`flex gap-2 p-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
          <Bot size={14} className="text-white" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-700 text-gray-200 rounded-bl-sm'
        }`}
      >
        {/* 工具调用步骤 */}
        {!isUser && hasToolSteps && (
          <div className="mb-2 pb-2 border-b border-gray-600 space-y-1">
            {message.toolSteps!.map((step) => (
              <ToolStepItem key={step.id} step={step} />
            ))}
          </div>
        )}

        {/* 消息正文 */}
        <div className="whitespace-pre-wrap break-words">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-[1px] h-[1em] bg-blue-400 ml-0.5 animate-pulse align-text-bottom">
              &nbsp;
            </span>
          )}
        </div>

        {/* 引用标签 */}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-600">
            {message.citations.map((c, i) => (
              <button
                key={i}
                className="block text-xs text-blue-400 hover:text-blue-300 mt-1 text-left w-full truncate"
                onClick={() => onCitationClick?.(c.sourceFile)}
                title={c.sourceFile}
              >
                来源: {c.sourceFile.replace(/^.*[\\/]/, '')} &gt; {c.headingText}
              </button>
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="shrink-0 w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
          <User size={14} className="text-white" />
        </div>
      )}
    </div>
  );
}
