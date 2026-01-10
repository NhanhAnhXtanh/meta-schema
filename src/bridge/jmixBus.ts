/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EnvelopeV1 } from "./types";

declare global {
  interface Window {
    ReactBridge?: { notify: (msg: any) => void };
  }
}

export const JMIX_EVENT = "jmix:ui";

/** Subscribe to events from Jmix */
export function onJmixEvent(handler: (msg: EnvelopeV1) => void) {
  
  const listener = (ev: Event) => {
    
    const ce = ev as CustomEvent<EnvelopeV1>;

    if (!ce.detail || ce.detail.v !== 1) return;
    console.log(ce.detail);
    handler(ce.detail);
  };
  
  window.addEventListener(JMIX_EVENT, listener as EventListener);

  return () => window.removeEventListener(JMIX_EVENT, listener as EventListener);
}

/** Send message back to Jmix server via Flow bridge (window.ReactBridge.notify) */
export function sendToJmix(type: string, payload?: any, correlationId?: string) {
  const msg: EnvelopeV1 = {
    v: 1,
    type,
    ts: Date.now(),
    payload: payload ?? {},
    correlationId,
  };

  if (window.ReactBridge?.notify) {
    window.ReactBridge.notify(msg);
    return;
  }

  // fallback: client-side only (optional)
  window.dispatchEvent(new CustomEvent("react:ui", { detail: msg }));
}

