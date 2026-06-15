import { useLayoutStore } from '../../stores/useLayoutStore';
import { LeftPanel } from './LeftPanel';
import { CenterPanel } from './CenterPanel';
import { RightPanel } from './RightPanel';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';

export function MainLayout() {
  const showLeftPanel = useLayoutStore((s) => s.showLeftPanel);
  const showRightPanel = useLayoutStore((s) => s.showRightPanel);

  return (
    <div className="h-screen w-screen bg-gray-900 text-gray-100">
      <Allotment>
        {showLeftPanel && (
          <Allotment.Pane minSize={180} maxSize={500} preferredSize={250}>
            <LeftPanel />
          </Allotment.Pane>
        )}
        <Allotment.Pane>
          <CenterPanel />
        </Allotment.Pane>
        {showRightPanel && (
          <Allotment.Pane minSize={200} maxSize={600} preferredSize={300}>
            <RightPanel />
          </Allotment.Pane>
        )}
      </Allotment>
    </div>
  );
}
