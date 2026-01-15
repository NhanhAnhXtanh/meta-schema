import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "./store";
import { eventReceived } from "./bridge/jmixSlice";
import type { BridgeMsg } from "./bridge/bridge-core";
import { FlowCanvas } from "./components/designer/canvas/FlowCanvas";


export type AppProps = {
  bridgeState?: any;
  post: (msg: BridgeMsg) => void;
};

export function App(props: AppProps) {
  const dispatch = useDispatch<AppDispatch>();
  const lastMsg = props.bridgeState?.__inbox as BridgeMsg | undefined;

  useEffect(() => {
    // Handshake với Jmix khi component mount
    props.post({ v: 1, kind: "event", type: "WIDGET_READY", payload: { widget: "react-widget" } });
  }, [props]);

  useEffect(() => {
    if (!lastMsg) return;

    // router ở React
    if (lastMsg.kind !== "response" && lastMsg.type === "STATE_PATCH") {
      // state already handled by Lit
      return;
    }

    // Convert BridgeMsg to EnvelopeV1 for middleware compatibility
    if (lastMsg.kind === "event" || lastMsg.kind === "response") {
      dispatch(
        eventReceived({
          v: 1,
          type: lastMsg.type,
          ts: Date.now(),
          payload: lastMsg.payload,
          correlationId: lastMsg.kind === "response" ? lastMsg.id : undefined,
        })
      );
    }
  }, [lastMsg, dispatch]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="flex-1 flex flex-col relative h-full">
        <div className="flex-1 h-full">
          <h1>HEllo</h1>
          <FlowCanvas />
        </div>
      </div>
    </div>
  );
}
