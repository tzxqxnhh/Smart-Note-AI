import { useEffect, useRef } from 'react';
import { Trash2, Database } from 'lucide-react';
import { useAgentStore } from '../../stores/useAgentStore';
import { useVectorDbStore } from '../../stores/useVectorDbStore';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { PresetButtons } from './PresetButtons';
import { StatusIndicator } from './StatusIndicator';
import { VectorDbPanel } from '../rag/VectorDbPanel';

export function AgentPanel() {
  const messages = useAgentStore((s) => s.messages);
  const isProcessing = useAgentStore((s) => s.isProcessing);
  const status = useAgentStore((s) => s.status);
  const sendQuery = useAgentStore((s) => s.sendQuery);
  const runPresetAction = useAgentStore((s) => s.runPresetAction);
  const clearHistory = useAgentStore((s) => s.clearHistory);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 向量库管理面板状态
  const isVectorDbOpen = useVectorDbStore((s) => s.isOpen);
  const openVectorDbPanel = useVectorDbStore((s) => s.openPanel);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCitationClick = (sourceFile: string) => {
    // TODO: Phase 7 实现 — 打开文件并跳转到对应标题
    console.log('引用点击:', sourceFile);
  };

  // 向量库管理视图
  if (isVectorDbOpen) {
    return (
      <div className="h-full flex flex-col" data-testid="right-panel">
        <VectorDbPanel />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="right-panel">
      {/* 顶部状态栏 */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">Agent</span>
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-700"
            onClick={openVectorDbPanel}
            title="向量库管理"
          >
            <Database size={14} />
          </button>
          {messages.length > 0 && (
            <button
              className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-700"
              onClick={clearHistory}
              title="清空对话"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      <StatusIndicator status={status} />

      {/* 消息列表 */}
      <div className="flex-1 overflow-auto">
        {messages.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <p className="mb-2">AI 笔记助手</p>
            <p className="text-xs text-gray-600">
              向我提问，或者使用下方的快捷按钮对选中内容进行操作
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onCitationClick={handleCitationClick}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入区 */}
      <PresetButtons onAction={runPresetAction} disabled={isProcessing} />
      <ChatInput onSend={sendQuery} disabled={isProcessing} />
    </div>
  );
}
