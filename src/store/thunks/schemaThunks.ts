import { RootState, AppDispatch } from '../index';
import { deleteElements, deleteField } from '../slices/schemaSlice';

/**
 * Thunk to perform a cascade delete of a table and all its descendants.
 * This effectively implements the "Delete Table + Children" logic
 * outside of the reducer, keeping the reducer pure and simple.
 */
export const deleteTableCascade = (rootId: string) => (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    // Access 'present' because of redux-undo
    const { nodes, edges } = state.schema.present;

    const nodesToDelete = new Set<string>();
    const queue = [rootId];

    // 1. BFS to find all descendants (Cascade Logic)
    while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (!nodesToDelete.has(currentId)) {
            nodesToDelete.add(currentId);

            // Find all OUTGOING edges from this node (Source -> Target)
            const outgoingEdges = edges.filter(e => e.source === currentId);

            outgoingEdges.forEach(edge => {
                queue.push(edge.target); // Add child to queue
            });
        }
    }

    // 2. Identify all related edges to delete (connected to any deleted node)
    const edgesToDeleteIDs = edges
        .filter(e => nodesToDelete.has(e.source) || nodesToDelete.has(e.target))
        .map(e => e.id);

    // 3. Dispatch single batch action
    dispatch(deleteElements({
        nodeIds: Array.from(nodesToDelete),
        edgeIds: edgesToDeleteIDs
    }));
};

/**
 * Thunk to delete a field and cascade delete any tables connected to it.
 */
export const deleteFieldCascade = (nodeId: string, fieldIndex: number) => (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const { nodes, edges } = state.schema.present;

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const field = node.data.columns[fieldIndex];
    if (!field) return;

    // 1. Identify connected children (outgoing edges from this field)
    const outgoingEdges = edges.filter(e =>
        (e.source === nodeId && e.sourceHandle === field.name) ||
        (e.source === nodeId && e.data?.objectFieldName === field.name)
    );

    // 2. Find all descendants of these children using BFS
    const childIds = outgoingEdges.map(e => e.target);
    const nodesToDelete = new Set<string>();
    const queue = [...childIds];

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (!nodesToDelete.has(currentId)) {
            nodesToDelete.add(currentId);
            // Continue traversal
            const children = edges.filter(e => e.source === currentId).map(e => e.target);
            children.forEach(c => queue.push(c));
        }
    }

    // 3. Collect edges to delete (descendant edges + direct connection edges)
    const descendantEdgeIds = edges
        .filter(e => nodesToDelete.has(e.source) || nodesToDelete.has(e.target))
        .map(e => e.id);

    const directEdgeIds = outgoingEdges.map(e => e.id);
    const allEdgeIds = Array.from(new Set([...descendantEdgeIds, ...directEdgeIds]));

    // 4. Dispatch Actions
    // First delete the descendant tables/edges
    if (nodesToDelete.size > 0 || allEdgeIds.length > 0) {
        dispatch(deleteElements({
            nodeIds: Array.from(nodesToDelete),
            edgeIds: allEdgeIds
        }));
    }

    // Then delete the field itself (skipping internal recursive logic since we handled it)
    dispatch(deleteField({ nodeId, fieldIndex, skipRecursive: true }));
};
