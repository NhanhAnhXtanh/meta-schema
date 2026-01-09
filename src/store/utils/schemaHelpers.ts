import { Node, Edge } from '@xyflow/react';
import { TableNodeData, TableColumn } from '@/types/schema';
import { WritableDraft } from 'immer/dist/internal';

// Helper to remove a table and its descendants (BFS)
export const removeTableAndDescendants = (
    nodes: WritableDraft<Node<TableNodeData>[]>,
    edges: WritableDraft<Edge[]>,
    rootId: string
) => {
    const idsToDelete = new Set<string>();
    const queue = [rootId];

    // 1. BFS to find all descendants
    while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (!idsToDelete.has(currentId)) {
            idsToDelete.add(currentId);

            // Find all OUTGOING edges from this node (Source -> Target)
            const outgoingEdges = edges.filter(e => e.source === currentId);
            outgoingEdges.forEach(edge => {
                queue.push(edge.target);
            });
        }
    }

    // 2. Filter nodes
    // Note: manipulating the array in place or filtering and re-assigning
    // Since we need to assign back to the draft, we return the filtered capabilities or modifying passed draft
    // But mutating the draft array requires splice or re-assignment.
    // Easier to return the new arrays or use indices

    // We will return the set of IDs to delete, let the slice handle the filtering? 
    // Or simpler: modify the draft directly using filter (re-assign)

    // Return IDs to be removed for other cleanup if needed, but mutating here is fine if we reassign
    return idsToDelete;
};

export const deleteFieldAndCleanEdges = (
    nodes: WritableDraft<Node<TableNodeData>[]>,
    edges: WritableDraft<Edge[]>,
    nodeId: string,
    fieldIndex: number,
    skipRecursive: boolean = false
) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const field = node.data.columns[fieldIndex];

    // Identify edges connecting to this field (outgoing/downstream to children)
    const edgesToDelete = edges.filter(e =>
        (e.source === nodeId && e.sourceHandle === field.name) || // 1-n array/link
        (e.source === nodeId && e.data?.objectFieldName === field.name) // n-1 object link
    );

    const childNodeIds = edgesToDelete.map(e => e.target);

    // Collect potential FKs to cleanup on other nodes
    const potentialFKsToCleanup: { nodeId: string, fieldName: string }[] = [];
    edgesToDelete.forEach(e => {
        if (e.data?.relationshipType === '1-n') {
            // FK is on target
            if (e.target && e.targetHandle) {
                potentialFKsToCleanup.push({ nodeId: e.target, fieldName: e.targetHandle });
            }
        } else {
            // n-1 or 1-1, FK is on source
            if (e.source && e.data?.sourceFK) {
                potentialFKsToCleanup.push({ nodeId: e.source, fieldName: e.data.sourceFK as string });
            }
        }
    });

    // Remove edges directly from draft
    // edges = edges.filter(...) -> This doesn't work with draft re-assignment in helper unless we return 
    // We can splice.
    const edgeIdsToDelete = new Set(edgesToDelete.map(e => e.id));
    for (let i = edges.length - 1; i >= 0; i--) {
        if (edgeIdsToDelete.has(edges[i].id)) {
            edges.splice(i, 1);
        }
    }

    // Cleanup FK status
    potentialFKsToCleanup.forEach(({ nodeId, fieldName }) => {
        const isUsed = edges.some(e => {
            if (e.data?.relationshipType === '1-n') {
                return e.target === nodeId && e.targetHandle === fieldName;
            } else {
                return e.source === nodeId && e.data?.sourceFK === fieldName;
            }
        });

        if (!isUsed) {
            const targetNode = nodes.find(n => n.id === nodeId);
            if (targetNode) {
                const col = targetNode.data.columns.find(c => c.name === fieldName);
                if (col) {
                    col.isForeignKey = false;
                }
            }
        }
    });

    // Remove the field
    node.data.columns.splice(fieldIndex, 1);

    // Helper for recursive delete
    if (!skipRecursive) {
        childNodeIds.forEach(childId => {
            // We can reuse the removeTable logic but need to be careful about state syncing
            const idsToDelete = removeTableAndDescendants(nodes, edges, childId);

            // Apply deletion
            // Filter nodes
            for (let i = nodes.length - 1; i >= 0; i--) {
                if (idsToDelete.has(nodes[i].id)) {
                    nodes.splice(i, 1);
                }
            }
            // Filter edges
            for (let i = edges.length - 1; i >= 0; i--) {
                const e = edges[i];
                if (idsToDelete.has(e.source) || idsToDelete.has(e.target)) {
                    edges.splice(i, 1);
                }
            }
        });
    }
};

export const updateFieldCascading = (
    nodes: WritableDraft<Node<TableNodeData>[]>,
    edges: WritableDraft<Edge[]>,
    nodeId: string,
    fieldIndex: number,
    updates: Partial<TableColumn>
) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.data.columns[fieldIndex]) return;

    const oldField = node.data.columns[fieldIndex];
    const oldName = oldField.name;

    // Apply Update
    node.data.columns[fieldIndex] = { ...oldField, ...updates };
    node.data._version = Date.now();

    // Cascade name to edges
    if (updates.name && updates.name !== oldName) {
        const newName = updates.name;
        edges.forEach(edge => {
            // 1. Array/Link (1-n): Source Handle matches field name
            if (edge.source === nodeId && edge.sourceHandle === oldName) {
                edge.sourceHandle = newName;
            }
            // 2. Target Handle matches field name
            if (edge.target === nodeId && edge.targetHandle === oldName) {
                edge.targetHandle = newName;
            }
            // 3. Object (n-1): stored in data.objectFieldName
            if (edge.source === nodeId && edge.data?.objectFieldName === oldName) {
                edge.data.objectFieldName = newName;
                if (edge.sourceHandle === oldName) {
                    edge.sourceHandle = newName;
                }
            }
        });
    }
};

export const toggleFieldVisibilityCascading = (
    nodes: WritableDraft<Node<TableNodeData>[]>,
    edges: WritableDraft<Edge[]>,
    nodeId: string,
    fieldIndex: number
) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const field = node.data.columns[fieldIndex];
    const newVisibility = field.visible === false; // Toggle
    field.visible = newVisibility;

    // Cascade for FK
    if (field.isForeignKey) {
        const connectedEdges = edges.filter(
            edge =>
                edge.source === nodeId &&
                edge.sourceHandle === field.name &&
                edge.data?.objectFieldName
        );

        connectedEdges.forEach(edge => {
            const targetNode = nodes.find(n => n.id === edge.target);
            if (targetNode) {
                const objectColumn = targetNode.data.columns.find(
                    c => c.name === edge.data?.objectFieldName && c.type === 'object'
                );
                if (objectColumn) {
                    objectColumn.visible = newVisibility;
                }
            }
        });
    }
};
