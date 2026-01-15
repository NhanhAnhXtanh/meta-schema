import type { BridgeMsg } from "./types";

declare global {
  interface Window {
    ReactBridge?: { notify: (msg: any) => void };
  }
}

export const BRIDGE_EVENT = "bridge:msg";

// ===== Unified Bridge Pattern =====

/** Subscribe to bridge:msg events from Jmix/Lit */
export function onBridgeMsg(handler: (msg: BridgeMsg) => void) {
  const listener = (ev: Event) => {
    const ce = ev as CustomEvent<BridgeMsg>;
    if (!ce.detail || ce.detail.v !== 1) return;
    handler(ce.detail);
  };
  window.addEventListener(BRIDGE_EVENT, listener as EventListener);
  return () => window.removeEventListener(BRIDGE_EVENT, listener as EventListener);
}

/** Emit bridge:msg event (fire-and-forget) */
export function emitBridgeMsg(type: string, payload?: any) {
  const msg: BridgeMsg = { v: 1, kind: "event", type, payload };
  window.dispatchEvent(new CustomEvent(BRIDGE_EVENT, { detail: msg, bubbles: true, composed: true }));
  
  // Also notify via window.ReactBridge if available (for Jmix server)
  if (window.ReactBridge?.notify) {
    window.ReactBridge.notify(msg);
  }
}

/** Request/Response pattern via bridge:msg */
export function requestBridgeMsg(type: string, payload?: any, timeoutMs = 15000): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();
    const msg: BridgeMsg = { v: 1, kind: "request", id, type, payload };

    const handler = (ev: Event) => {
      const ce = ev as CustomEvent<BridgeMsg>;
      const response = ce.detail;
      if (response.kind === "response" && response.id === id) {
        window.removeEventListener(BRIDGE_EVENT, handler as EventListener);
        clearTimeout(timer);
        response.ok ? resolve(response.payload) : reject(response.error ?? new Error("Bridge request failed"));
      }
    };

    const timer = setTimeout(() => {
      window.removeEventListener(BRIDGE_EVENT, handler as EventListener);
      reject(new Error(`Bridge request timeout: ${type}`));
    }, timeoutMs);

    window.addEventListener(BRIDGE_EVENT, handler as EventListener);
    window.dispatchEvent(new CustomEvent(BRIDGE_EVENT, { detail: msg, bubbles: true, composed: true }));
    
    // Also notify via window.ReactBridge if available (for Jmix server)
    if (window.ReactBridge?.notify) {
      window.ReactBridge.notify(msg);
    }
  });
}
