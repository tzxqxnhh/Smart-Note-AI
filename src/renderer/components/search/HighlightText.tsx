interface HighlightTextProps {
  text: string;
  highlight: string;
}

export function HighlightText({ text, highlight }: HighlightTextProps) {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }

  const lowerText = text.toLowerCase();
  const lowerHighlight = highlight.toLowerCase();
  const idx = lowerText.indexOf(lowerHighlight);

  if (idx === -1) {
    return <span>{text}</span>;
  }

  return (
    <span>
      {text.substring(0, idx)}
      <mark className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">
        {text.substring(idx, idx + highlight.length)}
      </mark>
      {text.substring(idx + highlight.length)}
    </span>
  );
}
