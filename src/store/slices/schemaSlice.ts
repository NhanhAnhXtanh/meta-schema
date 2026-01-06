import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Node, Edge, Connection, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react';
import { TableNodeData, TableColumn } from '@/types/schema';
import { TABLE_COLORS } from '@/constants';

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
    relationshipType?: '1-n' | '1-1' | 'n-1';
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
    nodes: [],
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
        addEdge: (state, action: PayloadAction<Edge>) => {
            state.edges.push(action.payload);
        },
        onNodesChange: (state, action: PayloadAction<NodeChange[]>) => {
            state.nodes = applyNodeChanges(action.payload, state.nodes);
        },
        onEdgesChange: (state, action: PayloadAction<EdgeChange[]>) => {
            state.edges = applyEdgeChanges(action.payload, state.edges);
        },
        resetSchema: (state) => {
            state.nodes = [];
            state.edges = [];
        },
        onConnect: (state, action: PayloadAction<Connection>) => {
            const { source, target, sourceHandle, targetHandle } = action.payload;

            // Prevent self-connections
            if (source === target) return;

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
        addTable: (state, action: PayloadAction<{ id?: string; name: string; tableName?: string; columns: TableColumn[]; position?: { x: number; y: number } }>) => {
            const { id, name, tableName, columns, position } = action.payload;
            // Use provided ID or generate a unique one
            const newId = id || `table-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const defaultColor = TABLE_COLORS[state.nodes.length % TABLE_COLORS.length];

            const newTable: Node<TableNodeData> = {
                id: newId,
                type: 'table',
                position: position || {
                    x: Math.random() * 500 + 100,
                    y: Math.random() * 400 + 100,
                },
                data: {
                    tableName: tableName || name.toLowerCase().replace(/\s+/g, '_'),
                    label: name,
                    columns: columns.map(c => ({ ...c, visible: true })),
                    color: defaultColor,
                    _version: Date.now()
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
        deleteElements: (state, action: PayloadAction<{ nodeIds: string[], edgeIds: string[] }>) => {
            const { nodeIds, edgeIds } = action.payload;
            const nodeSet = new Set(nodeIds);
            const edgeSet = new Set(edgeIds);

            state.nodes = state.nodes.filter(n => !nodeSet.has(n.id));
            state.edges = state.edges.filter(e => !edgeSet.has(e.id));
        },
        deleteTable: (state, action: PayloadAction<string>) => {
            const rootId = action.payload;
            const idsToDelete = new Set<string>();
            const queue = [rootId];

            // 1. BFS to find all descendants
            while (queue.length > 0) {
                const currentId = queue.shift()!;
                if (!idsToDelete.has(currentId)) {
                    idsToDelete.add(currentId);

                    // Find all OUTGOING edges from this node (Source -> Target)
                    // This implies "Children" or "Dependents"
                    const outgoingEdges = state.edges.filter(e => e.source === currentId);

                    outgoingEdges.forEach(edge => {
                        queue.push(edge.target);
                    });
                }
            }

            // 2. Remove all identified nodes
            state.nodes = state.nodes.filter(n => !idsToDelete.has(n.id));

            // 3. Remove all edges connected to deleted nodes (either source or target)
            state.edges = state.edges.filter(e => !idsToDelete.has(e.source) && !idsToDelete.has(e.target));
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
                node.data._version = Date.now();

                // If name changed, update edges that reference this field
                if (updates.name && updates.name !== oldName) {
                    const newName = updates.name;

                    // Update edges where this field is the source handle (1-n array fields)
                    state.edges.forEach(edge => {
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
                            // Also update sourceHandle if it matches (it usually does for n-1)
                            if (edge.sourceHandle === oldName) {
                                edge.sourceHandle = newName;
                            }
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
                const edgesToDelete = state.edges.filter(e =>
                    (e.source === nodeId && e.sourceHandle === field.name) || // 1-n array/link
                    (e.source === nodeId && e.data?.objectFieldName === field.name) // n-1 object link
                );

                const childNodeIds = edgesToDelete.map(e => e.target);

                // Collect potential FKs to cleanup
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
                            potentialFKsToCleanup.push({ nodeId: e.source, fieldName: e.data.sourceFK });
                        }
                    }
                });

                // Remove edges
                const edgeIdsToDelete = new Set(edgesToDelete.map(e => e.id));
                state.edges = state.edges.filter(e => !edgeIdsToDelete.has(e.id));

                // Cleanup FK status if no longer used
                potentialFKsToCleanup.forEach(({ nodeId, fieldName }) => {
                    const isUsed = state.edges.some(e => {
                        if (e.data?.relationshipType === '1-n') {
                            return e.target === nodeId && e.targetHandle === fieldName;
                        } else {
                            return e.source === nodeId && e.data?.sourceFK === fieldName;
                        }
                    });

                    if (!isUsed) {
                        const targetNode = state.nodes.find(n => n.id === nodeId);
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
            const { sourceNodeId, targetNodeId, sourcePK, targetFK, newFieldName, relationshipType } = action.payload;

            const sourceNode = state.nodes.find(n => n.id === sourceNodeId);
            const targetNode = state.nodes.find(n => n.id === targetNodeId);

            if (!sourceNode || !targetNode) return;

            // Add new field to source node
            const newField: TableColumn = {
                name: newFieldName,
                type: 'varchar',
                visible: true,
                isVirtual: true,
                isPrimaryKey: false, // Fix: Virtual field is not PK
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
                data: { relationshipType: relationshipType || '1-n' }
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

        updateLinkConnection: (state, action: PayloadAction<{
            sourceNodeId: string;
            oldFieldName: string;
            newFieldName: string;
            targetNodeId: string;
            sourceKey: string;     // PK or FK in source
            targetKey: string;     // PK or FK in target
            relationshipType: '1-n' | 'n-1' | '1-1';
        }>) => {
            const { sourceNodeId, oldFieldName, newFieldName, targetNodeId, sourceKey, targetKey, relationshipType } = action.payload;
            const sourceNode = state.nodes.find(n => n.id === sourceNodeId);
            if (!sourceNode) return;

            // 1. Find and Update the Field in Source
            const fieldIndex = sourceNode.data.columns.findIndex(c => c.name === oldFieldName);
            if (fieldIndex !== -1) {
                // Update Name and Type logic
                const field = sourceNode.data.columns[fieldIndex];
                field.name = newFieldName;

                if (relationshipType === '1-n') {
                    // Array (Virtual)
                    field.isVirtual = true;
                    field.type = 'varchar'; // or 'array'
                    field.linkedPrimaryKeyField = sourceKey;
                    delete field.primaryKeyField; // Clean up N:1 props
                } else {
                    // Object (N:1)
                    field.isVirtual = false;
                    field.type = 'object';
                    field.primaryKeyField = targetKey;
                    field.relationshipType = relationshipType;
                    delete field.linkedPrimaryKeyField; // Clean up 1:N props
                }
            }

            // 2. Remove Old Edge
            state.edges = state.edges.filter(e =>
                !(e.source === sourceNodeId && e.sourceHandle === oldFieldName)
            );

            // 3. Create New Edge
            // For 1:N (Virtual): Source(Field) -> Target(FK)
            // For N:1 (Object): Source(FK) -> Target(PK). Wait, if N:1, the field IS the foreign key? 
            // In my 'confirmLinkObject', I added a field 'type: object' (newFieldName). 
            // And I marked 'sourceFK' as foreign key.
            // Wait, if I change from 'object' to 'array', logic changes significantly.

            // Simplified Edge Creation based on previous pattern:
            const edgeId = `edge-${Date.now()}`;
            // Correct handles depend on type
            let sourceHandle = newFieldName;
            let targetHandle = targetKey;

            if (relationshipType === 'n-1' || relationshipType === '1-1') {
                // For Object type, we typically link [FK Column] -> [Target PK]
                // But here 'newFieldName' is the Object Field (virtual-ish wrapper?).
                // In confirmLinkObject, edge was Source -> Target.
                // Let's stick to Source(Field) -> Target(Key) for visual consistency?
                // Note: In `confirmLinkObject`, handles were `sourceFK` -> `targetPK`. 
                // `newFieldName` was just a helper field. 
                // If I am editing `newFieldName` (the object field), I should probably ensure the Edge is linked to the underline FK?
                // This is getting complex.
                // Let's assume for now we link the Virtual/Object field to the Target Key for visual.
                sourceHandle = newFieldName;
                targetHandle = targetKey;
            } else {
                // 1-N (Array)
                // Source(Virtual Field) -> Target(FK)
                sourceHandle = newFieldName;
                targetHandle = targetKey;
            }

            state.edges.push({
                id: edgeId,
                source: sourceNodeId,
                target: targetNodeId,
                sourceHandle: sourceHandle,
                targetHandle: targetHandle,
                type: 'relationship',
                data: { relationshipType }
            });

            // Force update
            state.nodes = [...state.nodes];
        },

        confirmLinkObject: (state, action: PayloadAction<{
            sourceNodeId: string;
            targetNodeId: string;
            sourceFK: string;
            targetPK: string;
            newFieldName: string;
            relationshipType?: 'n-1' | '1-1';
        }>) => {
            const { sourceNodeId, targetNodeId, sourceFK, targetPK, newFieldName, relationshipType } = action.payload;
            const sourceNode = state.nodes.find(n => n.id === sourceNodeId);
            const targetNode = state.nodes.find(n => n.id === targetNodeId);

            if (sourceNode && targetNode) {
                sourceNode.data.columns.push({
                    name: newFieldName,
                    type: 'object',
                    visible: true,
                    isPrimaryKey: false,
                    isForeignKey: false,
                    isNotNull: false,
                    primaryKeyField: targetPK, // Store generic PK ref
                    relationshipType: relationshipType || 'n-1'
                });

                // 2. Mark Source FK field as ForeignKey
                const fkColumn = sourceNode.data.columns.find(c => c.name === sourceFK);
                if (fkColumn) {
                    fkColumn.isForeignKey = true;
                }

                // 3. Add Edge: Source -> Target
                // Source Handle: sourceFK (The column holding the ID)
                // Target Handle: targetPK (The ID column in Target)
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
                        data: { relationshipType: relationshipType || 'n-1' }
                    });
                }

                // Force update
                state.nodes = [...state.nodes];
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
    setNodes, setEdges, addEdge, onNodesChange, onEdgesChange, onConnect, updateEdge,
    addTable, updateTable, deleteTable, deleteElements,
    addField, updateField, deleteField, reorderFields, toggleFieldVisibility,
    resetSchema,
    confirmLinkField, confirmLinkObject, updateLinkConnection, confirmObjectConnection
} = schemaSlice.actions;

export default schemaSlice.reducer;
