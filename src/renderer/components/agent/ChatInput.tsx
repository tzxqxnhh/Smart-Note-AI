import { useState, useRef } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-1 p-2 border-t border-gray-700">
      <textarea
        ref={textareaRef}
        className="flex-1 bg-gray-800 text-sm text-gray-200 placeholder-gray-500 rounded px-2 py-1.5 resize-none outline-none focus:ring-1 focus:ring-blue-500 min-h-[32px] max-h-[120px]"
        rows={1}
        placeholder="向 Agent 提问..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <button
        className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
      >
        <Send size={16} />
      </button>
    </div>
  );
}
