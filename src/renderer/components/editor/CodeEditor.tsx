import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { lineNumbers, highlightActiveLineGutter, highlightSpecialChars, EditorView } from '@codemirror/view';
import { foldGutter } from '@codemirror/language';
import { useAgentStore } from '../../stores/useAgentStore';

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
          // 监听文本选中变化，同步到 useAgentStore
          EditorView.updateListener.of((update) => {
            if (update.selectionSet || update.docChanged) {
              const selection = update.state.sliceDoc(
                update.state.selection.main.from,
                update.state.selection.main.to,
              );
              useAgentStore.getState().setSelectedText(selection || null);
            }
          }),
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
