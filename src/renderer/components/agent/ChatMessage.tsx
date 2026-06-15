import type { ChatMessage as ChatMessageType } from '@shared/types';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  onCitationClick?: (sourceFile: string) => void;
}

export function ChatMessage({ message, onCitationClick }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 p-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
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
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
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
