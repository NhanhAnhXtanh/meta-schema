import { Sidebar } from '@/components/designer/sidebar/Sidebar';
import { FlowCanvas } from '@/components/designer/canvas/FlowCanvas';
import { SchemaDialogs } from '@/components/SchemaDialogs';

import { JmixDataController } from '@/components/JmixDataController';

function App() {
  return (
    <div className="flex h-screen w-screen bg-gray-50 text-gray-900 overflow-hidden">
      <JmixDataController />
      <Sidebar />

      <div className="flex-1 flex flex-col relative h-full">
        <div className="flex-1 h-full">
          <FlowCanvas />
        </div>
      </div>

      <SchemaDialogs />
    </div>
  );
}

export default App;
