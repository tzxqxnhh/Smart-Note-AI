import { X } from 'lucide-react';
import type { Tab } from '@shared/types';

interface EditorTabsProps {
  tabs: Tab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
}

export function EditorTabs({ tabs, activeTabId, onSelectTab, onCloseTab }: EditorTabsProps) {
  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center border-b border-gray-700 bg-gray-850 overflow-x-auto shrink-0">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`group flex items-center gap-1 px-3 py-2 text-sm cursor-pointer border-r border-gray-700 min-w-0
            ${tab.id === activeTabId
              ? 'bg-gray-900 text-blue-400 border-t-2 border-t-blue-500'
              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          onClick={() => onSelectTab(tab.id)}
          title={tab.filePath}
        >
          <span className="truncate max-w-[150px]">
            {tab.isDirty && <span className="text-yellow-500 mr-1">●</span>}
            {tab.title}
          </span>
          <button
            className="shrink-0 p-0.5 rounded hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onCloseTab(tab.id);
            }}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
