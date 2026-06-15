import { useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useSearchStore } from '../../stores/useSearchStore';
import { useExplorerStore } from '../../stores/useExplorerStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { SearchResults } from './SearchResults';

export function SearchBar() {
  const { query, results, isSearching, isOpen, setQuery, performSearch, closeSearch } =
    useSearchStore();
  const rootPath = useExplorerStore((s) => s.rootPath);
  const openFile = useEditorStore((s) => s.openFile);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 防抖搜索
  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (value.trim() && rootPath) {
          performSearch(value, rootPath);
        } else {
          useSearchStore.setState({ results: [] });
        }
      }, 300);
    },
    [rootPath, performSearch, setQuery],
  );

  // 聚焦
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 点击结果跳转
  const handleNavigate = async (result: import('@shared/types').SearchResult) => {
    try {
      await openFile(result.filePath);
      closeSearch();
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-center pt-16 bg-black/40" onClick={closeSearch}>
      <div
        className="w-[600px] max-h-[500px] bg-gray-850 border border-gray-600 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700">
          <Search size={16} className="text-gray-500" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none"
            placeholder="搜索笔记（文件名、内容）..."
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') closeSearch();
            }}
          />
          {isSearching && (
            <span className="text-xs text-gray-500">搜索中...</span>
          )}
        </div>
        {query.trim() && (
          <SearchResults results={results} query={query} onNavigate={handleNavigate} />
        )}
      </div>
    </div>
  );
}
