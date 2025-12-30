import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Node, Edge, Connection, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react';
import { TableNodeData, TableColumn } from '@/types/schema';

// Initial state data (moved from App.tsx)
const COLOR_OPTIONS = [
    '#22c55e', '#a855f7', '#eab308', '#3b82f6', '#ef4444', '#14b8a6',
];

const initialNodes: Node<TableNodeData>[] = [
    {
        id: '1',
        type: 'table',
        position: { x: 0, y: 0 },
        data: {
            label: 'Products',
            columns: [
                { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true },
                { name: 'name', type: 'varchar', visible: true },
                { name: 'description', type: 'varchar', visible: true },
                { name: 'price', type: 'money', visible: true },
                { name: 'quantity', type: 'int4', visible: true },
            ],
            color: COLOR_OPTIONS[0],
        },
    },
    {
        id: '2',
        type: 'table',
        position: { x: 400, y: -150 },
        data: {
            label: 'Warehouses',
            columns: [
                { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true },
                { name: 'name', type: 'varchar', visible: true },
                { name: 'address', type: 'varchar', visible: true },
                { name: 'capacity', type: 'int4', visible: true },
            ],
            color: COLOR_OPTIONS[1],
        },
    },
    {
        id: '3',
        type: 'table',
        position: { x: 400, y: 100 },
        data: {
            label: 'Suppliers',
            columns: [
                { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true },
                { name: 'name', type: 'varchar', visible: true },
                { name: 'contact', type: 'varchar', visible: true },
                { name: 'country', type: 'varchar', visible: true },
            ],
            color: COLOR_OPTIONS[2],
        },
    },
    {
        id: '4',
        type: 'table',
        position: { x: 800, y: -200 },
        data: {
            label: 'Categories',
            columns: [
                { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true },
                { name: 'name', type: 'varchar', visible: true },
                { name: 'description', type: 'text', visible: true },
            ],
            color: COLOR_OPTIONS[3],
        },
    },
    {
        id: '5',
        type: 'table',
        position: { x: 800, y: -50 },
        data: {
            label: 'Orders',
            columns: [
                { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true },
                { name: 'order_date', type: 'timestamp', visible: true },
                { name: 'total_amount', type: 'money', visible: true },
                { name: 'status', type: 'varchar', visible: true },
            ],
            color: COLOR_OPTIONS[4],
        },
    },
    {
        id: '6',
        type: 'table',
        position: { x: 800, y: 150 },
        data: {
            label: 'Customers',
            columns: [
                { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true },
                { name: 'name', type: 'varchar', visible: true },
                { name: 'email', type: 'varchar', visible: true },
                { name: 'phone', type: 'varchar', visible: true },
            ],
            color: COLOR_OPTIONS[5],
        },
    },
    {
        id: '7',
        type: 'table',
        position: { x: 400, y: 350 },
        data: {
            label: 'Reviews',
            columns: [
                { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true },
                { name: 'rating', type: 'int', visible: true },
                { name: 'comment', type: 'text', visible: true },
                { name: 'created_at', type: 'timestamp', visible: true },
            ],
            color: COLOR_OPTIONS[0],
        },
    },
    {
        id: '8',
        type: 'table',
        position: { x: 800, y: 350 },
        data: {
            label: 'Inventory',
            columns: [
                { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true },
                { name: 'stock_quantity', type: 'int', visible: true },
                { name: 'last_updated', type: 'timestamp', visible: true },
            ],
            color: COLOR_OPTIONS[1],
        },
    },
];

interface SchemaState {
    nodes: Node<TableNodeData>[];
    edges: Edge[];
}

// ... types
interface LinkFieldPayload {
    sourceNodeId: string;
    targetNodeId: string;
    sourcePK: string;
    targetFK: string;
    newFieldName: string;
}

interface ObjectConnectionPayload {
    sourceNodeId: string;
    sourceFieldName: string;
    targetNodeId: string;
    targetFieldName?: string; // Field PK được chọn khi kéo ngược lại
    newFieldName: string; // Tên field object mới
    primaryKeyFieldName: string; // PK được chọn
}


const initialState: SchemaState = {
    nodes: initialNodes,
    edges: [],
};

const schemaSlice = createSlice({
    name: 'schema',
    initialState,
    reducers: {
        // React Flow specific actions
        setNodes: (state, action: PayloadAction<Node<TableNodeData>[]>) => {
            state.nodes = action.payload;
        },
        setEdges: (state, action: PayloadAction<Edge[]>) => {
            state.edges = action.payload;
        },
        onNodesChange: (state, action: PayloadAction<NodeChange[]>) => {
            state.nodes = applyNodeChanges(action.payload, state.nodes);
        },
        onEdgesChange: (state, action: PayloadAction<EdgeChange[]>) => {
            state.edges = applyEdgeChanges(action.payload, state.edges);
        },
        onConnect: (state, action: PayloadAction<Connection>) => {
            const { source, target, sourceHandle, targetHandle } = action.payload;
            if (source && target && sourceHandle && targetHandle) {
                const edgeId = `${source}-${sourceHandle}-to-${target}-${targetHandle}`;

                // Check existence
                const exists = state.edges.some(e =>
                    e.source === source && e.target === target &&
                    e.sourceHandle === sourceHandle && e.targetHandle === targetHandle
                );

                if (!exists) {
                    const newEdge: Edge = {
                        id: edgeId,
                        source,
                        target,
                        sourceHandle,
                        targetHandle,
                        type: 'relationship',
                        data: { relationshipType: '1-n' }
                    };
                    state.edges.push(newEdge);
                }
            }
        },
        updateEdge: (state, action: PayloadAction<{ id: string; data: any }>) => {
            const { id, data } = action.payload;
            const edge = state.edges.find(e => e.id === id);
            if (edge) {
                edge.data = { ...edge.data, ...data };
            }
        },

        // Table operations
        addTable: (state, action: PayloadAction<{ name: string; columns: TableColumn[] }>) => {
            const { name, columns } = action.payload;
            const newId = String(state.nodes.length + 1); // Simple ID generation
            const defaultColor = COLOR_OPTIONS[state.nodes.length % COLOR_OPTIONS.length];

            const newTable: Node<TableNodeData> = {
                id: newId,
                type: 'table',
                position: {
                    x: Math.random() * 500 + 100,
                    y: Math.random() * 400 + 100,
                },
                data: {
                    label: name,
                    columns: columns.map(c => ({ ...c, visible: true })),
                    color: defaultColor
                }
            };
            state.nodes.push(newTable);
        },
        updateTable: (state, action: PayloadAction<{ id: string; updates: Partial<TableNodeData> }>) => {
            const { id, updates } = action.payload;
            const node = state.nodes.find(n => n.id === id);
            if (node) {
                node.data = { ...node.data, ...updates };
            }
        },
        deleteTable: (state, action: PayloadAction<string>) => {
            const id = action.payload;
            state.nodes = state.nodes.filter(n => n.id !== id);
            state.edges = state.edges.filter(e => e.source !== id && e.target !== id);
        },

        // Column operations
        addField: (state, action: PayloadAction<{ nodeId: string; field: TableColumn }>) => {
            const { nodeId, field } = action.payload;
            const node = state.nodes.find(n => n.id === nodeId);
            if (node) {
                node.data.columns.push(field);
            }
        },
        updateField: (state, action: PayloadAction<{ nodeId: string; fieldIndex: number; updates: Partial<TableColumn> }>) => {
            const { nodeId, fieldIndex, updates } = action.payload;
            const node = state.nodes.find(n => n.id === nodeId);
            if (node && node.data.columns[fieldIndex]) {
                const oldField = node.data.columns[fieldIndex];
                const oldName = oldField.name;

                // Update the field
                node.data.columns[fieldIndex] = { ...oldField, ...updates };

                // If name changed, update edges that reference this field
                if (updates.name && updates.name !== oldName) {
                    const newName = updates.name;

                    // Update edges where this field is the source handle (1-n array fields)
                    state.edges.forEach(edge => {
                        if (edge.source === nodeId && edge.sourceHandle === oldName) {
                            edge.sourceHandle = newName;
                        }
                        // Update edges where this field is the target handle
                        if (edge.target === nodeId && edge.targetHandle === oldName) {
                            edge.targetHandle = newName;
                        }
                    });
                }
            }
        },
        toggleFieldVisibility: (state, action: PayloadAction<{ nodeId: string; fieldIndex: number }>) => {
            const { nodeId, fieldIndex } = action.payload;
            const node = state.nodes.find(n => n.id === nodeId);
            if (!node) return;

            const field = node.data.columns[fieldIndex];
            const newVisibility = field.visible === false;

            // Update current field
            field.visible = newVisibility;

            // Cascading visibility for FK
            if (field.isForeignKey) {
                // Find connected edges (FK -> Object Field)
                const connectedEdges = state.edges.filter(
                    edge =>
                        edge.source === nodeId &&
                        edge.sourceHandle === field.name &&
                        edge.data?.objectFieldName
                );

                connectedEdges.forEach(edge => {
                    const targetNode = state.nodes.find(n => n.id === edge.target);
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
        },
        deleteField: (state, action: PayloadAction<{ nodeId: string; fieldIndex: number; skipRecursive?: boolean }>) => {
            const { nodeId, fieldIndex, skipRecursive } = action.payload;
            const node = state.nodes.find(n => n.id === nodeId);
            if (node) {
                const field = node.data.columns[fieldIndex];

                // Identify edges connecting to this field (outgoing/downstream to children)
                const childEdges = state.edges.filter(e =>
                    (e.source === nodeId && e.sourceHandle === field.name) || // 1-n array/link
                    (e.source === nodeId && e.data?.objectFieldName === field.name) // n-1 object link
                );

                const childNodeIds = childEdges.map(e => e.target);

                // Remove ALL edges connected to this field (both incoming and outgoing)
                state.edges = state.edges.filter(e =>
                    !((e.source === nodeId && e.sourceHandle === field.name) ||
                        (e.target === nodeId && e.targetHandle === field.name) ||
                        (e.source === nodeId && e.data?.objectFieldName === field.name)
                    )
                );

                // Remove the field
                node.data.columns.splice(fieldIndex, 1);

                // Only recursive delete if not skipped (e.g. during Edit)
                if (!skipRecursive) {
                    // Recursive delete helper
                    const recursiveDelete = (id: string) => {
                        // If node already deleted, skip
                        if (!state.nodes.find(n => n.id === id)) return;

                        // Find children of this node
                        const outgoingEdges = state.edges.filter(e => e.source === id);
                        const children = outgoingEdges.map(e => e.target);

                        // Delete node and its edges
                        state.nodes = state.nodes.filter(n => n.id !== id);
                        state.edges = state.edges.filter(e => e.source !== id && e.target !== id);

                        // Recurse
                        children.forEach(childId => recursiveDelete(childId));
                    };

                    // Execute recursive delete for all children connected to this field
                    childNodeIds.forEach(id => recursiveDelete(id));
                }
            }
        },
        reorderFields: (state, action: PayloadAction<{ nodeId: string; oldIndex: number; newIndex: number }>) => {
            const { nodeId, oldIndex, newIndex } = action.payload;

            const nodeIndex = state.nodes.findIndex(n => n.id === nodeId);
            if (nodeIndex !== -1) {
                const node = state.nodes[nodeIndex];
                const newColumns = [...node.data.columns];
                const [removed] = newColumns.splice(oldIndex, 1);
                newColumns.splice(newIndex, 0, removed);

                // Create new node object with version
                const updatedNode = {
                    ...node,
                    data: {
                        ...node.data,
                        columns: newColumns,
                        _version: Date.now()
                    }
                };

                // Create new nodes array to trigger Redux selector
                state.nodes = state.nodes.map((n, idx) => idx === nodeIndex ? updatedNode : n);

                // Force edges to recreate by creating new edge objects
                state.edges = state.edges.map(edge => {
                    if (edge.source === nodeId || edge.target === nodeId) {
                        return { ...edge };
                    }
                    return edge;
                });
            }
        },

        // Complex Operations
        confirmLinkField: (state, action: PayloadAction<LinkFieldPayload>) => {
            const { sourceNodeId, targetNodeId, sourcePK, targetFK, newFieldName } = action.payload;

            const sourceNode = state.nodes.find(n => n.id === sourceNodeId);
            const targetNode = state.nodes.find(n => n.id === targetNodeId);

            if (!sourceNode || !targetNode) return;

            // Add new field to source node
            const newField: TableColumn = {
                name: newFieldName,
                type: 'varchar',
                visible: true,
                isVirtual: true,
                isPrimaryKey: true,
                linkedPrimaryKeyField: sourcePK,
            };
            sourceNode.data.columns.push(newField);

            // Mark target field as FK
            const targetColumn = targetNode.data.columns.find(c => c.name === targetFK);
            if (targetColumn) {
                targetColumn.isForeignKey = true;
            }

            // Create Edge
            const edgeId = `${sourceNodeId}-${newFieldName}-to-${targetNodeId}-${targetFK}`;
            state.edges.push({
                id: edgeId,
                source: sourceNodeId,
                target: targetNodeId,
                sourceHandle: newFieldName,
                targetHandle: targetFK,
                type: 'relationship',
                data: { relationshipType: '1-n' }
            });

            // Force nodes update to trigger React Flow handle recompute
            const sourceIndex = state.nodes.findIndex(n => n.id === sourceNodeId);
            if (sourceIndex !== -1) {
                state.nodes[sourceIndex] = { ...state.nodes[sourceIndex] };
            }
            const targetIndex = state.nodes.findIndex(n => n.id === targetNodeId);
            if (targetIndex !== -1) {
                state.nodes[targetIndex] = { ...state.nodes[targetIndex] };
            }
        },

        confirmLinkObject: (state, action: PayloadAction<{
            sourceNodeId: string;
            targetNodeId: string;
            sourceFK: string;
            targetPK: string;
            newFieldName: string;
        }>) => {
            const { sourceNodeId, targetNodeId, sourceFK, targetPK, newFieldName } = action.payload;
            const sourceNode = state.nodes.find(n => n.id === sourceNodeId);
            const targetNode = state.nodes.find(n => n.id === targetNodeId);

            if (sourceNode && targetNode) {
                // 1. Add 'object' field to Source Node
                sourceNode.data.columns.push({
                    name: newFieldName,
                    type: 'object',
                    visible: true,
                    isPrimaryKey: false,
                    isForeignKey: false,
                    isNotNull: false,
                    primaryKeyField: targetPK, // Store generic PK ref
                    relationshipType: 'n-1'
                });

                // 2. Mark Source FK field as ForeignKey
                const fkColumn = sourceNode.data.columns.find(c => c.name === sourceFK);
                if (fkColumn) {
                    fkColumn.isForeignKey = true;
                }

                // 3. Add Edge: Source -> Target
                // Source Handle: sourceFK (The column holding the ID)
                // Target Handle: targetPK (The ID column in Target)
                // Wait, ReactFlow edges usually go handle-to-handle.
                // For N-1 (Object):
                // We usually draw from FK (Source) to PK (Target).
                const edgeId = `e-${sourceNodeId}-${sourceFK}-${targetNodeId}-${targetPK}`;
                const exists = state.edges.some(e => e.id === edgeId);

                if (!exists) {
                    state.edges.push({
                        id: edgeId,
                        source: sourceNodeId,
                        target: targetNodeId,
                        sourceHandle: sourceFK,
                        targetHandle: targetPK,
                        type: 'relationship',
                        data: {
                            relationshipType: 'n-1',
                            primaryKeyField: targetPK,
                            objectFieldName: newFieldName
                        }
                    });
                }

                // Force nodes update to trigger React Flow handle recompute
                const sourceIndex = state.nodes.findIndex(n => n.id === sourceNodeId);
                if (sourceIndex !== -1) {
                    state.nodes[sourceIndex] = { ...state.nodes[sourceIndex] };
                }
                const targetIndex = state.nodes.findIndex(n => n.id === targetNodeId);
                if (targetIndex !== -1) {
                    state.nodes[targetIndex] = { ...state.nodes[targetIndex] };
                }
            }
        },

        confirmObjectConnection: (state, action: PayloadAction<ObjectConnectionPayload>) => {
            const { sourceNodeId, sourceFieldName, targetNodeId, targetFieldName, newFieldName, primaryKeyFieldName } = action.payload;
            const isReverse = sourceFieldName === 'object-target';

            let pkNodeId: string;
            let fkNodeId: string;
            let fkFieldName: string;

            if (isReverse) {
                pkNodeId = sourceNodeId;
                fkNodeId = targetNodeId;
                fkFieldName = targetFieldName || '';
            } else {
                pkNodeId = targetNodeId;
                fkNodeId = sourceNodeId;
                fkFieldName = sourceFieldName;
            }

            const pkNode = state.nodes.find(n => n.id === pkNodeId);
            const fkNode = state.nodes.find(n => n.id === fkNodeId);

            if (!pkNode || !fkNode) return;

            // Add new object field to PK node
            pkNode.data.columns.push({
                name: newFieldName,
                type: 'object',
                isPrimaryKey: false,
                visible: true,
                primaryKeyField: primaryKeyFieldName,
            });

            // Mark FK field
            const fkColumn = fkNode.data.columns.find(c => c.name === fkFieldName);
            if (fkColumn) {
                fkColumn.isForeignKey = true;
            }

            // Create Edge: FK (N) -> PK (1)
            const edgeId = `${fkNodeId}-${fkFieldName}-to-${pkNodeId}-${newFieldName}`;
            state.edges.push({
                id: edgeId,
                source: fkNodeId,
                target: pkNodeId,
                sourceHandle: fkFieldName,
                targetHandle: newFieldName,
                type: 'relationship',
                data: {
                    relationshipType: 'n-1',
                    primaryKeyField: primaryKeyFieldName,
                    objectFieldName: newFieldName,
                }
            });
        }
    },
});

export const {
    setNodes, setEdges, onNodesChange, onEdgesChange, onConnect, updateEdge,
    addTable, updateTable, deleteTable,
    addField, updateField, deleteField, reorderFields, toggleFieldVisibility,
    confirmLinkField, confirmLinkObject, confirmObjectConnection
} = schemaSlice.actions;

export default schemaSlice.reducer;
