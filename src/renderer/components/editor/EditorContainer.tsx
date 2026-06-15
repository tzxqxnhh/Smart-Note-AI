import { useEditorStore } from '../../stores/useEditorStore';
import { EditorTabs } from './EditorTabs';
import { EditorToolbar } from './EditorToolbar';
import { CodeEditor } from './CodeEditor';
import { MarkdownPreview } from './MarkdownPreview';

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
