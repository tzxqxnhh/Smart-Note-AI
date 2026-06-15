/**
 * Mermaid 图表渲染组件
 * 将思维导图代码渲染为 SVG 图表
 */
interface MermaidDiagramProps {
  code: string;
}

export function MermaidDiagram({ code }: MermaidDiagramProps) {
  // TODO: Phase 8 实现
  // 使用 mermaid.run() 渲染代码为 SVG
  return (
    <div className="my-3 p-3 bg-gray-800 rounded border border-gray-700">
      <pre className="text-xs text-gray-400 whitespace-pre-wrap select-text">{code}</pre>
      <div className="text-xs text-gray-500 mt-2">Mermaid 渲染功能开发中</div>
    </div>
  );
}
