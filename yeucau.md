mình giữ LitElement nhưng “tối ưu truyền event 2 chiều” theo đúng ý anh: không gọi nhiều function trực tiếp, mà dùng một kênh giao tiếp chung + router + generator/reuse.

Mấu chốt để tối ưu: đừng tạo nhiều event name / nhiều setter / nhiều handler rời rạc. Thay vào đó:

Chỉ dùng 1 event duy nhất theo chuẩn: bridge:msg

Trong detail có envelope (gói tin) gồm kind/type/payload/id/correlation…

LitElement làm message bus:

Jmix → Lit: dispatch bridge:msg (executeJs)

Lit → React: mounted.update(state) hoặc emitToReact(msg) (1 function)

React → Lit: gọi emit("bridge:msg", envelope)

Lit → Jmix: dispatch bridge:msg bubble+composed

Có request/response qua id để tránh “call function trực tiếp” (React không gọi Java method; chỉ gửi msg, Java trả msg)

Dưới đây là mẫu “common reused” để anh copy dùng cho mọi React app.

1) Envelope chuẩn (hợp đồng giao tiếp chung)

Chỉ 1 event: bridge:msg

export type BridgeMsg =
  | { v: 1; kind: "event"; type: string; payload?: any; meta?: any }
  | { v: 1; kind: "request"; id: string; type: string; payload?: any; meta?: any }
  | { v: 1; kind: "response"; id: string; ok: boolean; payload?: any; error?: any; meta?: any };


Ví dụ:

React gửi request: {kind:"request", id:"...", type:"loadMetaPack", payload:{...}}

Jmix trả: {kind:"response", id:"...", ok:true, payload:{...}}

React gửi event fire-and-forget: {kind:"event", type:"OPEN_VIEW", payload:{...}}

2) LitElement Bridge “common reusable” (core)
2.1. bridge-core.ts (tái sử dụng cho mọi component)
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

2.2. LitElement component: react-bridge.ts

Chỉ có 1 listener: bridge:msg

Có queue nếu Jmix gửi trước khi React mount

React chỉ biết emit/request (không gọi function trực tiếp)

import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { createBridge, type BridgeMsg } from "./bridge-core";
import { mountReactApp } from "./reactapp/react-embed.js";

@customElement("react-bridge")
export class ReactBridgeElement extends LitElement {
  private mounted?: { update: (s: any) => void; unmount: () => void };
  private reactInboxQueue: BridgeMsg[] = [];
  private bridge = createBridge({
    postToHost: (msg) => this.postToHost(msg),
    postToReact: (msg) => this.postToReact(msg),
  });

  // React state (nếu anh muốn “state sync” thì dùng; còn không thì thuần msg)
  private reactState: any = {};

  render() {
    return html`<div id="react-root"></div>`;
  }

  connectedCallback() {
    super.connectedCallback();
    // ✅ Chỉ 1 kênh nhận từ Jmix xuống
    this.addEventListener("bridge:msg", this.onBridgeMsg as EventListener);
  }

  firstUpdated() {
    const host = this.renderRoot.querySelector<HTMLDivElement>("#react-root");
    if (!host) return;

    this.mounted = mountReactApp(host, this.reactState, (msg: BridgeMsg) => {
      // React -> Jmix: luôn qua 1 event bridge:msg
      this.postToHost(msg);
    });

    // flush inbox
    for (const m of this.reactInboxQueue) this.postToReact(m);
    this.reactInboxQueue = [];

    // handshake
    this.postToHost({ v: 1, kind: "event", type: "READY", payload: { at: Date.now() } });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.mounted?.unmount();
    this.mounted = undefined;
    this.removeEventListener("bridge:msg", this.onBridgeMsg as EventListener);
  }

  // ===== transport impl =====

  private postToHost(msg: BridgeMsg) {
    // ✅ 1 event duy nhất, bubble+composed để Vaadin/Jmix bắt được
    this.dispatchEvent(
      new CustomEvent("bridge:msg", { detail: msg, bubbles: true, composed: true })
    );
  }

  private postToReact(msg: BridgeMsg) {
    // Option 1: msg-driven thuần → React tự xử lý
    // Option 2: state-driven: nếu msg.type === "STATE_PATCH" thì update state

    if (!this.mounted) {
      this.reactInboxQueue.push(msg);
      return;
    }

    // Nếu anh muốn state patch:
    if (msg.kind !== "response" && msg.type === "STATE_PATCH") {
      this.reactState = { ...this.reactState, ...(msg.payload ?? {}) };
      this.mounted.update(this.reactState);
      return;
    }

    // msg to React: cách phổ biến là React mount nhận "emit" callback
    // Ở đây đơn giản: chuyển msg vào state kiểu inbox hoặc gọi custom hook phía React
    // (Phần React em hướng dẫn dưới)
    this.mounted.update({ ...this.reactState, __inbox: msg });
  }

  private onBridgeMsg = (e: CustomEvent) => {
    // Jmix -> Lit
    const msg = e.detail as BridgeMsg;
    this.bridge.handleFromHost(msg);
  };
}


Điểm tối ưu: anh chỉ phải maintain 1 event + 1 router. Không còn “setProperty/locale/theme/context” hay nhiều listeners.

3) React side: chỉ cần hook dùng “inbox msg” + emit/request
3.1 mount API (như anh đang có) nhưng emit/request theo envelope
import React, { useEffect, useRef } from "react";

export type BridgeMsg =
  | { v: 1; kind: "event"; type: string; payload?: any }
  | { v: 1; kind: "request"; id: string; type: string; payload?: any }
  | { v: 1; kind: "response"; id: string; ok: boolean; payload?: any; error?: any };

export function App(props: { bridgeState: any; post: (msg: BridgeMsg) => void }) {
  const lastMsg = props.bridgeState?.__inbox as BridgeMsg | undefined;

  useEffect(() => {
    if (!lastMsg) return;

    // router ở React
    if (lastMsg.kind !== "response" && lastMsg.type === "STATE_PATCH") {
      // state already handled by Lit
      return;
    }

    if (lastMsg.kind !== "response" && lastMsg.type === "NAVIGATE") {
      // do something
    }
  }, [lastMsg]);

  return (
    <button
      onClick={() =>
        props.post({ v: 1, kind: "event", type: "OPEN_VIEW", payload: { view: "MetaPack" } })
      }
    >
      Open view
    </button>
  );
}


Nếu anh muốn “request/response” ở React, làm luôn qua post(kind=request) và Lit/Jmix sẽ trả response cùng id.