import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../../styles/markdown.css';

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  if (!content) {
    return <div className="p-4 text-gray-500 text-sm" />;
  }

  return (
    <div className="markdown-preview h-full overflow-auto p-4 text-gray-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 自定义表格样式
          table: ({ children }) => (
            <div className="overflow-auto my-3">
              <table className="min-w-full border-collapse border border-gray-600 text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-600 px-3 py-1.5 bg-gray-800 font-medium text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-600 px-3 py-1.5">{children}</td>
          ),
          // 代码块
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-gray-800 text-pink-300 px-1 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={`block bg-gray-900 p-3 rounded my-2 text-sm overflow-auto ${className || ''}`} {...props}>
                {children}
              </code>
            );
          },
          // 链接
          a: ({ href, children }) => (
            <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          // 任务列表
          input: ({ type, checked, disabled, ...props }) => {
            if (type === 'checkbox') {
              return <input type="checkbox" checked={checked} readOnly className="mr-2" {...props} />;
            }
            return <input type={type} {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
