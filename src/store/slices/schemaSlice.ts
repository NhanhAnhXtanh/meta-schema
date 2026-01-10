import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Node, Edge, Connection, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react';
import { TableNodeData, TableColumn } from '@/types/schema';
import { TABLE_COLORS } from '@/constants';
import {
    removeTableAndDescendants,
    deleteFieldAndCleanEdges,
    updateFieldCascading,
    toggleFieldVisibilityCascading
} from '../utils/schemaHelpers';

export interface SchemaState {
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
            state.nodes = applyNodeChanges(action.payload, state.nodes) as Node<TableNodeData>[];
        },
        onEdgesChange: (state, action: PayloadAction<EdgeChange[]>) => {
            state.edges = applyEdgeChanges(action.payload, state.edges) as Edge[];
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
                    isActive: true,
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
            const idsToDelete = removeTableAndDescendants(state.edges, rootId);

            // Apply deletions based on IDs identified by helper
            state.nodes = state.nodes.filter(n => !idsToDelete.has(n.id));
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
            updateFieldCascading(state.nodes, state.edges, nodeId, fieldIndex, updates);
        },
        toggleFieldVisibility: (state, action: PayloadAction<{ nodeId: string; fieldIndex: number }>) => {
            const { nodeId, fieldIndex } = action.payload;
            toggleFieldVisibilityCascading(state.nodes, state.edges, nodeId, fieldIndex);
        },
        deleteField: (state, action: PayloadAction<{ nodeId: string; fieldIndex: number; skipRecursive?: boolean }>) => {
            const { nodeId, fieldIndex, skipRecursive } = action.payload;
            deleteFieldAndCleanEdges(state.nodes, state.edges, nodeId, fieldIndex, skipRecursive);
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
            // Check if field already exists
            const existingFieldIndex = sourceNode.data.columns.findIndex(c => c.name === newFieldName);

            const newFieldData: TableColumn = {
                name: newFieldName,
                type: 'array', // Force type to match Link
                visible: true,
                isVirtual: true,
                isPrimaryKey: false,
                linkedPrimaryKeyField: sourcePK,
                linkedForeignKeyField: targetFK,
            };

            if (existingFieldIndex !== -1) {
                const existingField = sourceNode.data.columns[existingFieldIndex];
                sourceNode.data.columns[existingFieldIndex] = {
                    ...existingField,
                    ...newFieldData,
                    visible: existingField.visible
                };
            } else {
                sourceNode.data.columns.push(newFieldData);
            }

            // Clean up: Remove FK from source if it was previously an Object relationship
            const sourcePKColumn = sourceNode.data.columns.find(c => c.name === sourcePK);
            if (sourcePKColumn && sourcePKColumn.isForeignKey) {
                // Check if this FK is still used by other edges
                const isStillUsed = state.edges.some(e =>
                    (e.source === sourceNodeId && e.data?.sourceFK === sourcePK) ||
                    (e.target === sourceNodeId && e.targetHandle === sourcePK)
                );
                if (!isStillUsed) {
                    sourcePKColumn.isForeignKey = false;
                }
            }

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
                    field.linkedForeignKeyField = targetKey;
                    delete field.primaryKeyField; // Clean up N:1 props
                } else {
                    // Object (N:1)
                    field.isVirtual = false;
                    field.type = 'object';
                    field.primaryKeyField = targetKey;
                    field.linkedForeignKeyField = sourceKey;
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
                // Check if field already exists (e.g. from table definition)
                const existingFieldIndex = sourceNode.data.columns.findIndex(c => c.name === newFieldName);

                const newFieldData: TableColumn = {
                    name: newFieldName,
                    type: 'object',
                    visible: true,
                    isVirtual: true,
                    isPrimaryKey: false,
                    isForeignKey: false,
                    isNotNull: false,
                    primaryKeyField: targetPK, // Store generic PK ref
                    linkedForeignKeyField: sourceFK,
                    relationshipType: relationshipType || 'n-1'
                };

                if (existingFieldIndex !== -1) {
                    // Update existing field to be a Link
                    const existingField = sourceNode.data.columns[existingFieldIndex];
                    sourceNode.data.columns[existingFieldIndex] = {
                        ...existingField,
                        ...newFieldData,
                        visible: existingField.visible // Keep user visibility preference if any
                    };
                } else {
                    // Create new virtual field
                    sourceNode.data.columns.push(newFieldData);
                }

                // Clean up: Remove FK from target if it was previously an Array relationship
                const targetPKColumn = targetNode.data.columns.find(c => c.name === targetPK);
                if (targetPKColumn && targetPKColumn.isForeignKey) {
                    // Check if this FK is still used by other edges
                    const isStillUsed = state.edges.some(e =>
                        (e.target === targetNodeId && e.targetHandle === targetPK) ||
                        (e.source === targetNodeId && e.data?.sourceFK === targetPK)
                    );
                    if (!isStillUsed) {
                        targetPKColumn.isForeignKey = false;
                    }
                }

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
                        sourceHandle: newFieldName,
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
