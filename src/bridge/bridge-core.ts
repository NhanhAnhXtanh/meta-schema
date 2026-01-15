export type BridgeMsg =
  | { v: 1; kind: "event"; type: string; payload?: any; meta?: any }
  | { v: 1; kind: "request"; id: string; type: string; payload?: any; meta?: any }
  | { v: 1; kind: "response"; id: string; ok: boolean; payload?: any; error?: any; meta?: any };

export type BridgeTransport = {
  // gửi lên Jmix (DOM event)
  postToHost: (msg: BridgeMsg) => void;

  // gửi xuống React (callback)
  postToReact: (msg: BridgeMsg) => void;
};

export function createBridge(transport: BridgeTransport) {
  const pending = new Map<
    string,
    { resolve: (v: any) => void; reject: (e: any) => void; timer: any }
  >();

  function uid() {
    return (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();
  }

  function request(type: string, payload?: any, timeoutMs = 15000): Promise<any> {
    const id = uid();
    const msg: BridgeMsg = { v: 1, kind: "request", id, type, payload };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Bridge request timeout: ${type}`));
      }, timeoutMs);

      pending.set(id, { resolve, reject, timer });
      transport.postToHost(msg);
    });
  }

  function emit(type: string, payload?: any) {
    transport.postToHost({ v: 1, kind: "event", type, payload });
  }

  function handleFromHost(msg: BridgeMsg) {
    // Jmix -> React
    if (msg.kind === "response" && msg.id) {
      const p = pending.get(msg.id);
      if (!p) return;
      clearTimeout(p.timer);
      pending.delete(msg.id);
      msg.ok ? p.resolve(msg.payload) : p.reject(msg.error ?? new Error("Bridge error"));
      return;
    }
    transport.postToReact(msg);
  }

  return { request, emit, handleFromHost };
}

