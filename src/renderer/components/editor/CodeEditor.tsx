import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { lineNumbers, highlightActiveLineGutter, highlightSpecialChars } from '@codemirror/view';
import { foldGutter } from '@codemirror/language';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function CodeEditor({ value, onChange, readOnly = false }: CodeEditorProps) {
  return (
    <div className="h-full overflow-auto">
      <CodeMirror
        value={value}
        onChange={onChange}
        theme={oneDark}
        extensions={[
          markdown({ base: markdownLanguage }),
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightSpecialChars(),
          foldGutter(),
        ]}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          autocompletion: false,
          bracketMatching: true,
          closeBrackets: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
        }}
        style={{ minHeight: '100%' }}
      />
    </div>
  );
}
