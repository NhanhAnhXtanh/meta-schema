# Edge Reordering Feature

## Overview
This document explains how edges (relationship lines) automatically follow fields when they are reordered via drag-and-drop in the sidebar.

## Problem
When users reorder fields in a table node, React Flow edges would remain connected to the old field positions instead of following the moved fields. This happened because:

1. React Flow caches handle positions based on DOM structure
2. When fields are reordered, DOM elements move but React Flow doesn't automatically recompute handle positions
3. Edges continue pointing to the cached (old) positions

## Solution

### 1. **Unique Field Keys** (`TableNode.tsx`)
```tsx
key={column.name}  // Instead of key={index}
```
- React tracks DOM elements by field name, not array index
- When fields reorder, DOM elements move with their data
- Handles move to correct positions in the DOM

### 2. **Version Tracking** (`schemaSlice.ts`)
```typescript
data: {
    ...node.data,
    columns: newColumns,
    _version: Date.now()  // Timestamp to track changes
}
```
- Each node gets a `_version` timestamp when modified
- Used to detect which nodes need handle updates
- Triggers React Flow recomputation

### 3. **Immutable Updates** (`schemaSlice.ts`)
```typescript
// Create new nodes array to trigger Redux selector
state.nodes = state.nodes.map((n, idx) => 
    idx === nodeIndex ? updatedNode : n
);

// Recreate affected edges
state.edges = state.edges.map(edge => {
    if (edge.source === nodeId || edge.target === nodeId) {
        return { ...edge };  // New edge object
    }
    return edge;
});
```
- Creates new array references instead of mutating
- Ensures Redux selectors detect changes
- Triggers React re-renders

### 4. **NodeUpdater Component** (`FlowCanvas.tsx`)
```tsx
function NodeUpdater() {
    const updateNodeInternals = useUpdateNodeInternals();
    const nodes = useNodes();
    
    const nodesVersion = nodes.reduce((sum, node) => 
        sum + (node.data._version || 0), 0
    );
    
    useEffect(() => {
        const nodesToUpdate = nodes.filter(n => n.data._version);
        nodesToUpdate.forEach(node => {
            updateNodeInternals(node.id);
        });
    }, [nodesVersion, updateNodeInternals]);
    
    return null;
}
```
- Must be inside `<ReactFlow>` to access React Flow context
- Watches `nodesVersion` sum for changes
- Calls `updateNodeInternals()` to force handle recomputation
- Only updates nodes that have `_version` (optimization)

## Data Flow

```
User drags field
    ↓
reorderFields action
    ↓
1. Reorder columns array
2. Add _version timestamp
3. Create new nodes array
4. Recreate affected edges
    ↓
Redux state changes
    ↓
FlowCanvas re-renders
    ↓
NodeUpdater detects version change
    ↓
Calls updateNodeInternals()
    ↓
React Flow recomputes handle positions
    ↓
Edges render at new positions ✅
```

## Key Files

- **`TableNode.tsx`**: Field rendering with unique keys
- **`schemaSlice.ts`**: `reorderFields` reducer with version tracking
- **`FlowCanvas.tsx`**: `NodeUpdater` component for handle updates
- **`SidebarField.tsx`**: Drag & drop handlers
- **`NestedFieldsList.tsx`**: Drag & drop for nested fields

## Performance Optimizations

1. **Selective Updates**: Only updates nodes with `_version` timestamp
2. **Dependency Optimization**: `useEffect` only depends on `nodesVersion` sum
3. **Edge Recreation**: Only recreates edges connected to changed nodes

## TypeScript Types

```typescript
export interface TableNodeData {
  label: string;
  columns: TableColumn[];
  color?: string;
  _version?: number; // Timestamp for tracking changes
}
```

## Known Limitations

1. `_version` persists in state (could be cleared after update)
2. All connected edges are recreated (could be more selective)
3. Requires React Flow's internal API (`useUpdateNodeInternals`)

## Future Improvements

- Clear `_version` after successful update
- More granular edge updates
- Animation during reorder
- Undo/redo support
