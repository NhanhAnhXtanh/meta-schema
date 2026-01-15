import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { createBridge, type BridgeMsg } from "../bridge/bridge-core";
import { mountReactApp, type MountedReactApp } from "../react-embed.js";

@customElement("react-widget")
export class ReactBridgeElement extends LitElement {
  private mounted?: MountedReactApp;
  private reactInboxQueue: BridgeMsg[] = [];
  private isDispatching = false; // Flag to prevent event loop
  private bridge = createBridge({
    postToHost: (msg) => this.postToHost(msg),
    postToReact: (msg) => this.postToReact(msg),
  });

  // React state (nếu anh muốn "state sync" thì dùng; còn không thì thuần msg)
  private reactState: any = {};

  render() {
    return html`<div id="react-root"></div>`;
  }

  connectedCallback() {
    super.connectedCallback();
    // ✅ Chỉ 1 kênh nhận từ Jmix xuống
    // Listener trên element (cho event từ parent/ancestor)
    this.addEventListener("bridge:msg", this.onBridgeMsg as EventListener);
    // Listener trên window (cho event từ Jmix executeJs)
    window.addEventListener("bridge:msg", this.onBridgeMsg as EventListener);
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
    window.removeEventListener("bridge:msg", this.onBridgeMsg as EventListener);
  }

  // ===== transport impl =====

  private postToHost(msg: BridgeMsg) {
    // ✅ 1 event duy nhất, bubble+composed để Vaadin/Jmix bắt được
    // Gửi lên Jmix server qua window.ReactBridge.notify
    if (window.ReactBridge?.notify) {
      window.ReactBridge.notify(msg);
    }

    // Cũng dispatch event để các listener khác có thể bắt được (ví dụ trong demo)
    // Event này sẽ bubble lên parent elements
    // Set flag để tránh loop
    this.isDispatching = true;
    this.dispatchEvent(
      new CustomEvent("bridge:msg", { detail: msg, bubbles: true, composed: true })
    );
    this.isDispatching = false;
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
    // Bỏ qua event nếu đang dispatch từ chính element này (tránh loop)
    if (this.isDispatching) {
      return;
    }

    const msg = e.detail as BridgeMsg;
    if (!msg || msg.v !== 1) return;

    this.bridge.handleFromHost(msg);
  };
}

