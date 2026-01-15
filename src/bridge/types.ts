// Legacy type for backward compatibility (will be phased out)
export type EnvelopeV1<TPayload = any> = {
  v: 1;
  type: string;
  ts: number;
  source?: string;
  payload?: TPayload;
  correlationId?: string;
};

// New unified BridgeMsg type (re-export from bridge-core)
export type { BridgeMsg } from "./bridge-core";

