import { EditorContainer } from '../editor/EditorContainer';

export function CenterPanel() {
  return (
    <div className="h-full flex flex-col" data-testid="center-panel">
      <EditorContainer />
    </div>
  );
}
