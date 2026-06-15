import { useEffect } from 'react';
import { useSearchStore } from '../stores/useSearchStore';
import { useLayoutStore } from '../stores/useLayoutStore';
import { useEditorStore } from '../stores/useEditorStore';

/**
 * 全局键盘快捷键
 */
export function useKeyboardShortcuts() {
  const openSearch = useSearchStore((s) => s.openSearch);
  const closeSearch = useSearchStore((s) => s.closeSearch);
  const isSearchOpen = useSearchStore((s) => s.isOpen);
  const toggleLeftPanel = useLayoutStore((s) => s.toggleLeftPanel);
  const toggleRightPanel = useLayoutStore((s) => s.toggleRightPanel);
  const saveCurrentFile = useEditorStore((s) => s.saveCurrentFile);
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const closeTab = useEditorStore((s) => s.closeTab);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+Shift+F: 搜索
      if (ctrl && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        openSearch();
        return;
      }

      // Escape: 关闭搜索
      if (e.key === 'Escape' && isSearchOpen) {
        closeSearch();
        return;
      }

      // Ctrl+S: 保存
      if (ctrl && e.key === 's') {
        e.preventDefault();
        saveCurrentFile();
        return;
      }

      // Ctrl+W: 关闭当前 Tab
      if (ctrl && e.key === 'w' && activeTabId) {
        e.preventDefault();
        closeTab(activeTabId);
        return;
      }

      // Ctrl+\: 切换左面板
      if (ctrl && e.key === '\\') {
        e.preventDefault();
        toggleLeftPanel();
        return;
      }

      // Ctrl+Shift+\: 切换右面板
      if (ctrl && e.shiftKey && e.key === '\\') {
        e.preventDefault();
        toggleRightPanel();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    openSearch,
    closeSearch,
    isSearchOpen,
    toggleLeftPanel,
    toggleRightPanel,
    saveCurrentFile,
    activeTabId,
    closeTab,
  ]);
}
