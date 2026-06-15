import { AgentPanel } from '../agent/AgentPanel';

export function RightPanel() {
  return (
    <div className="h-full border-l border-gray-700 bg-gray-850 flex flex-col" data-testid="right-panel">
      <AgentPanel />
    </div>
  );
}
