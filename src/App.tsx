import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { FlowCanvas } from '@/components/designer/canvas/FlowCanvas';
import { SchemaDialogs } from '@/components/SchemaDialogs';
import { JmixDataController } from '@/components/JmixDataController';
import { onJmixEvent } from "./bridge/jmixBus";
import { eventReceived } from "./bridge/jmixSlice";
import type { AppDispatch } from "./store";

function App() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    return onJmixEvent((msg) => dispatch(eventReceived(msg)));
  }, [dispatch]);

  return (
    <div className="flex h-screen w-screen bg-gray-50 text-gray-900 overflow-hidden">
      <JmixDataController />

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
