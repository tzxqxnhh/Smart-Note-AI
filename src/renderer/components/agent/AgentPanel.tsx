import { useEffect, useRef } from 'react';
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
  const streamingMessage = useAgentStore((s) => s.streamingMessage);
  const vectorDbEnabled = useAgentStore((s) => s.vectorDbEnabled);
  const sendQuery = useAgentStore((s) => s.sendQuery);
  const clearHistory = useAgentStore((s) => s.clearHistory);
  const toggleVectorDb = useAgentStore((s) => s.toggleVectorDb);
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
          {/* 向量库管理入口按钮 */}
          <button
            className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-700"
            onClick={openVectorDbPanel}
            title="向量库管理"
          >
            <span className="text-xs">DB</span>
          </button>
        </div>
      </div>
      <StatusIndicator status={status} />

      {/* 消息列表 */}
      <div className="flex-1 overflow-auto">
        {messages.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <p className="mb-2">AI 笔记助手</p>
            <p className="text-xs text-gray-600">
              向我提问，或者选中编辑器内容后右键进行操作
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
        {/* 流式生成中的消息 */}
        {streamingMessage && (
          <ChatMessage
            message={streamingMessage}
            onCitationClick={handleCitationClick}
            isStreaming={true}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 底部操作区 */}
      <PresetButtons
        vectorDbEnabled={vectorDbEnabled}
        onToggleVectorDb={toggleVectorDb}
        onClearHistory={clearHistory}
        disabled={isProcessing}
      />
      <ChatInput onSend={sendQuery} disabled={isProcessing} />
    </div>
  );
}
