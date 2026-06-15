import { useEditorStore } from '../../stores/useEditorStore';
import { useSearchStore } from '../../stores/useSearchStore';
import { useRagSettingsStore } from '../../stores/useRagSettingsStore';
import { EditorTabs } from './EditorTabs';
import { EditorToolbar } from './EditorToolbar';
import { CodeEditor } from './CodeEditor';
import { MarkdownPreview } from './MarkdownPreview';
import { Search, BrainCircuit } from 'lucide-react';

export function EditorContainer() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const contents = useEditorStore((s) => s.contents);
  const viewMode = useEditorStore((s) => s.viewMode);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const closeTab = useEditorStore((s) => s.closeTab);
  const updateContent = useEditorStore((s) => s.updateContent);
  const saveCurrentFile = useEditorStore((s) => s.saveCurrentFile);
  const toggleViewMode = useEditorStore((s) => s.toggleViewMode);

  const openSearch = useSearchStore((s) => s.openSearch);
  const openRagSettings = useRagSettingsStore((s) => s.openSettings);

  const handleRagOpen = () => {
    if (activeTabId) {
      const tab = tabs.find((t) => t.id === activeTabId);
      if (tab) {
        openRagSettings(tab.filePath);
      }
    }
  };

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeContent = activeTab ? (contents[activeTab.filePath] ?? '') : '';
  const wordCount = activeContent.split(/\s+/).filter(Boolean).length;

  const handleEditorChange = (value: string) => {
    if (activeTab) {
      updateContent(activeTab.filePath, value);
    }
  };

  // 没有打开的文件
  if (!activeTab) {
    return (
      <div className="h-full flex flex-col" data-testid="center-panel">
        {/* 即使没有打开文件也显示搜索和 RAG 按钮 */}
        <div className="flex items-center justify-end gap-1 px-3 py-1.5 border-b border-gray-700 bg-gray-850 shrink-0">
          <button
            className="flex items-center gap-1 px-2 py-1 text-sm text-gray-300 hover:bg-gray-700 rounded"
            onClick={handleRagOpen}
            title="RAG 文本切分"
          >
            <BrainCircuit size={14} />
          </button>
          <button
            className="flex items-center gap-1 px-2 py-1 text-sm text-gray-300 hover:bg-gray-700 rounded"
            onClick={openSearch}
            title="搜索 (Ctrl+Shift+F)"
          >
            <Search size={14} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="text-lg">打开文件开始编辑</p>
            <p className="text-sm mt-1 text-gray-600">从左侧资源管理器选择 .md 文件</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <EditorTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTab}
        onCloseTab={closeTab}
      />
      <EditorToolbar
        viewMode={viewMode}
        isDirty={activeTab.isDirty}
        wordCount={wordCount}
        onSave={saveCurrentFile}
        onToggleViewMode={toggleViewMode}
        onSearchOpen={openSearch}
        onRagOpen={handleRagOpen}
      />

      {/* 编辑/预览区域 */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'edit' && (
          <CodeEditor value={activeContent} onChange={handleEditorChange} />
        )}
        {viewMode === 'preview' && (
          <MarkdownPreview content={activeContent} />
        )}
        {viewMode === 'split' && (
          <div className="flex h-full">
            <div className="flex-1 border-r border-gray-700 overflow-hidden">
              <CodeEditor value={activeContent} onChange={handleEditorChange} />
            </div>
            <div className="flex-1 overflow-hidden">
              <MarkdownPreview content={activeContent} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
