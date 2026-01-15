# Jmix ↔ React WebComponent với Lit Element

React app được tích hợp vào Jmix thông qua **Lit Element custom component** `<react-widget>` sử dụng unified bridge pattern với một event duy nhất `bridge:msg`.

## Kiến trúc

### Unified Bridge Pattern

Ứng dụng sử dụng **một event duy nhất** `bridge:msg` với envelope chuẩn để giao tiếp:

- **Jmix → React**: Jmix dispatch event `bridge:msg` → LitElement bắt và forward tới React
- **React → Jmix**: React gửi message qua `post()` function → LitElement dispatch event `bridge:msg` → Jmix server nhận qua `window.ReactBridge.notify()`

### Bridge Message Format

```typescript
type BridgeMsg =
  | { v: 1; kind: "event"; type: string; payload?: any; meta?: any }
  | { v: 1; kind: "request"; id: string; type: string; payload?: any; meta?: any }
  | { v: 1; kind: "response"; id: string; ok: boolean; payload?: any; error?: any; meta?: any };
```

### Request/Response Pattern

React có thể gửi request và nhận response thông qua id correlation:

```typescript
// Request
post({ v: 1, kind: "request", id: "...", type: "loadData", payload: {...} })

// Response từ Jmix
{ v: 1, kind: "response", id: "...", ok: true, payload: {...} }
```

## Cấu trúc thư mục

```
src/
  bridge/
    bridge-core.ts        # Core bridge logic với request/response pattern
    jmixBus.ts            # Unified bridge API (emitBridgeMsg, requestBridgeMsg)
    jmixSlice.ts          # Redux slice cho raw events
    types.ts              # Type definitions (BridgeMsg, EnvelopeV1)
    middleware/           # Event routing middleware
      index.ts
      dashboard.ts
      list.ts
  webcomponent/
    react-bridge.ts       # LitElement component (react-widget)
  react-embed.ts          # React mounting logic với bridge integration
  store/                  # Redux store
    index.ts
    dashboardSlice.ts
    listSlice.ts
  components/             # React components
    Dashboard.tsx
    ListTable.tsx
  App.tsx                 # Main React app với inbox message pattern
  main-lib.ts             # Entry point cho lib build
  main-demo.tsx           # Entry point cho demo page
```

## Chạy demo

```bash
pnpm install
pnpm dev
```

Demo page sẽ hiển thị:
- Mock Jmix panel để simulate events
- React widget được mount trong `<react-widget>`

## Build WebComponent cho Jmix

```bash
pnpm run build:lib
```

Output: `dist/react-widget.js`

### Embed vào Jmix FlowUI

```html
<script type="module" src="/static/react-widget.js"></script>
<react-widget></react-widget>
```

**Yêu cầu**: Jmix app cần cung cấp Flow bridge:
- `window.ReactBridge.notify(msg)` để forward messages lên server

## Sử dụng trong React Components

### Gửi Event (Fire-and-forget)

```typescript
function MyComponent({ post }: { post: (msg: BridgeMsg) => void }) {
  const handleClick = () => {
    post({ 
      v: 1, 
      kind: "event", 
      type: "OPEN_VIEW", 
      payload: { view: "Dashboard" } 
    });
  };
  
  return <button onClick={handleClick}>Open View</button>;
}
```

### Gửi Request và nhận Response

```typescript
import { requestBridgeMsg } from "./bridge/jmixBus";

async function loadData() {
  try {
    const result = await requestBridgeMsg("loadData", { id: 123 });
    console.log("Data:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}
```

### Nhận Messages từ Jmix

App.tsx tự động xử lý messages từ Jmix thông qua inbox pattern:

```typescript
// Message được đưa vào bridgeState.__inbox
// App.tsx sẽ convert và dispatch vào Redux store
// Middleware sẽ route đến các reducers phù hợp
```

## Middleware Pattern

Middleware xử lý routing events từ Jmix đến các Redux reducers:

```typescript
// src/bridge/middleware/dashboard.ts
export const dashboardMiddleware: Middleware = (store) => (next) => (action) => {
  if (action.type !== eventReceived.type) return next(action);
  
  const msg = action.payload;
  
  switch (msg.type) {
    case "DASHBOARD_LOAD":
      store.dispatch(dashboardRequested());
      // Request sẽ được gửi từ React component qua post() function
      break;
    case "DASHBOARD_DATA":
      store.dispatch(dashboardReceived(msg.payload));
      break;
  }
  
  return next(action);
};
```

## LitElement Component

Custom element `react-widget`:

- Lắng nghe event `bridge:msg` từ Jmix
- Mount React app vào shadow DOM
- Queue messages nếu React chưa mount
- Forward messages từ React lên Jmix qua `window.ReactBridge.notify()`

## Ưu điểm của pattern này

✅ **Chỉ 1 event**: `bridge:msg` - dễ maintain và debug  
✅ **Request/Response**: Hỗ trợ async communication với timeout  
✅ **Queue messages**: Messages được queue nếu React chưa sẵn sàng  
✅ **Type-safe**: Full TypeScript support với BridgeMsg type  
✅ **Tách biệt concerns**: LitElement làm bridge, React làm UI logic  
✅ **Scalable**: Middleware pattern dễ mở rộng với nhiều events
