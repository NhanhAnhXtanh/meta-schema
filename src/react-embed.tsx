import React from "react";
import { createRoot, Root } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import { App } from "./App";
import type { BridgeMsg } from "./bridge/bridge-core";

export type MountedReactApp = {
  update: (state: any) => void;
  unmount: () => void;
  post: (msg: BridgeMsg) => void;
};

export function mountReactApp(
  host: HTMLElement,
  initialState: any,
  postCallback: (msg: BridgeMsg) => void
): MountedReactApp {
  let root: Root | null = null;
  let currentState = initialState;

  const post = (msg: BridgeMsg) => {
    postCallback(msg);
  };

  const update = (state: any) => {
    currentState = state;
    if (!root) {
      root = createRoot(host);
    }
    root.render(
      <Provider store={store}>
        <App bridgeState={currentState} post={post} />
      </Provider>
    );
  };

  const unmount = () => {
    if (root) {
      root.unmount();
      root = null;
    }
  };

  // Initial render
  update(initialState);

  return { update, unmount, post };
}

