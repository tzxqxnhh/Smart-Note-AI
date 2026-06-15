import type { SearchResult } from '@shared/types';
import { HighlightText } from './HighlightText';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  onNavigate: (result: SearchResult) => void;
}

export function SearchResults({ results, query, onNavigate }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="py-3 text-sm text-gray-500 text-center">
        未找到匹配结果
      </div>
    );
  }

  return (
    <div className="max-h-80 overflow-auto">
      {results.map((result) => (
        <div
          key={result.filePath}
          className="p-2 border-b border-gray-700 last:border-none cursor-pointer hover:bg-gray-700"
          onClick={() => onNavigate(result)}
        >
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-200 mb-1">
            <HighlightText text={result.fileName} highlight={query} />
          </div>
          {result.matches
            .filter((m) => m.line > 0) // 跳过仅文件名匹配
            .slice(0, 5) // 最多显示5个内容匹配
            .map((match, i) => (
              <div key={i} className="text-xs text-gray-400 ml-2 flex gap-1">
                <span className="text-gray-600 shrink-0">L{match.line}:</span>
                <span className="truncate">
                  <HighlightText text={match.text} highlight={query} />
                </span>
              </div>
            ))}
          {result.matches.filter((m) => m.line > 0).length > 5 && (
            <div className="text-xs text-gray-600 ml-2">
              ...还有 {result.matches.filter((m) => m.line > 0).length - 5} 处匹配
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
