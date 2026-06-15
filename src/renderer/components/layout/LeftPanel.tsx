import { FileExplorer } from '../explorer/FileExplorer';

export function LeftPanel() {
  return (
    <div className="h-full border-r border-gray-700 bg-gray-850 flex flex-col" data-testid="left-panel">
      <FileExplorer />
    </div>
  );
}
