import { openLinkFieldDialog, openEditLinkFieldDialog, openConfirmDeleteDialog } from '@/store/slices/uiSlice';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { schemaEventBus } from '@/events/eventBus';
import { SchemaEvents, TableAddPayload, TableUpdatePayload, TableDeletePayload, FieldAddPayload, FieldUpdatePayload, FieldDeletePayload, FieldReorderPayload, FieldToggleVisibilityPayload, RelationshipAddPayload } from '@/events/schemaEvents';
import { addTable, updateTable, deleteTable, addField, updateField, deleteField, reorderFields, toggleFieldVisibility, setNodes, resetSchema } from '@/store/slices/schemaSlice';
import { confirmLinkField, confirmLinkObject } from '@/store/slices/schemaSlice';
import { performAutoLayout } from '@/utils/autoLayout';
import { ActionCreators } from 'redux-undo';
import { AppDispatch, RootState } from '@/store';

/**
 * JmixDataController
 * 
 * Đóng vai trò là "Bộ não" quản lý dữ liệu (Database/Schema).
 * Component này lắng nghe các sự kiện logic từ UI/External, xử lý, và cập nhật Redux Store.
 * Hỗ trợ Bulk Load từ Jmix và Replica ID Mapping.
 */
export function JmixDataController() {
    const dispatch = useDispatch<AppDispatch>();
    const { nodes, edges } = useSelector((state: RootState) => state.schema.present);

    // Store mapping from Jmix Original ID -> React Replica Node IDs (Array)
    const idMapRef = useRef<Record<string, string[]>>({});

    useEffect(() => {
        // --- Schema Manipulation Handlers (Database Ops) ---

        const handleTableAdd = (payload: TableAddPayload) => {
            dispatch(addTable(payload as any));
        };

        const handleTableUpdate = (payload: TableUpdatePayload) => {
            dispatch(updateTable({ id: payload.id, updates: payload.updates }));
        };

        const handleTableDelete = (payload: TableDeletePayload) => {
            dispatch(deleteTable(payload.id));
        };

        const handleTableToggleVisibility = (payload: { id: string }) => {
            const node = nodes.find(n => n.id === payload.id);
            if (node) {
                const current = node.data.isActive !== false;
                dispatch(updateTable({ id: payload.id, updates: { isActive: !current } }));
            }
        };

        const handleFieldAdd = (payload: FieldAddPayload) => {
            dispatch(addField({ nodeId: payload.nodeId, field: payload.field }));
        };

        const handleFieldUpdate = (payload: FieldUpdatePayload) => {
            dispatch(updateField({ nodeId: payload.nodeId, fieldIndex: payload.fieldIndex, updates: payload.updates }));
        };

        const handleFieldDelete = (payload: FieldDeletePayload) => {
            dispatch(deleteField({ nodeId: payload.nodeId, fieldIndex: payload.fieldIndex }));
        };

        const handleFieldReorder = (payload: FieldReorderPayload) => {
            dispatch(reorderFields({ nodeId: payload.nodeId, oldIndex: payload.oldIndex, newIndex: payload.newIndex }));
        };

        const handleFieldToggleVisibility = (payload: FieldToggleVisibilityPayload) => {
            console.log('Toggle visibility for node:', payload.nodeId);
            dispatch(toggleFieldVisibility({ nodeId: payload.nodeId, fieldIndex: payload.fieldIndex }));
        };

        const handleUndo = () => dispatch(ActionCreators.undo());
        const handleRedo = () => dispatch(ActionCreators.redo());

        const handleAutoLayout = () => {
            const layoutedNodes = performAutoLayout(nodes);
            dispatch(setNodes(layoutedNodes));
        };

        const handleFieldRequestEdit = (payload: { nodeId: string; fieldIndex: number }) => {
            const node = nodes.find(n => n.id === payload.nodeId);
            if (!node) return;
            const field = node.data.columns[payload.fieldIndex];
            if (!field) return;

            console.log('[JmixDataController] Request Edit Field:', field.name);

            if (field.isVirtual || field.type === 'object' || field.type === 'array') {
                // Determine Link Type
                const linkType = (field.type === 'object' || (field.relationshipType === 'n-1') || (field.relationshipType === '1-1')) ? 'n-1' : '1-n';

                // Find connected edge to prepopulate dialog
                const edge = edges.find(e => e.source === payload.nodeId && e.sourceHandle === field.name);

                if (edge) {
                    dispatch(openEditLinkFieldDialog({
                        sourceNodeId: payload.nodeId,
                        fieldIndex: payload.fieldIndex,
                        initialValues: {
                            targetNodeId: edge.target,
                            sourceKey: linkType === '1-n' ? field.linkedPrimaryKeyField || 'id' : field.linkedForeignKeyField || 'id',
                            targetKey: edge.targetHandle || 'id',
                            fieldName: field.name,
                            linkType: linkType
                        }
                    }));
                } else {
                    console.warn('[JmixDataController] Edge not found for link field:', field.name);
                    // Fallback or just open dialog empty? Better to warn.
                }
            } else {
                // TODO: Implement Basic Field Editor
                console.log('[JmixDataController] Edit normal field requested. Not implemented dialog yet.');
                // Placeholder: User expects a popup. We can alert for now or silence.
                alert(`Edit request for field '${field.name}' received from Jmix.\n(Normal field editing dialog is coming soon)`);
            }
        };

        const handleRelationshipAdd = (payload: RelationshipAddPayload) => {
            if (payload.type === '1-n') {
                dispatch(confirmLinkField({
                    sourceNodeId: payload.sourceNodeId,
                    targetNodeId: payload.targetNodeId,
                    sourcePK: payload.sourceKey,
                    targetFK: payload.targetKey,
                    newFieldName: payload.fieldName,
                    relationshipType: payload.relationshipType as any
                }));
            } else {
                dispatch(confirmLinkObject({
                    sourceNodeId: payload.sourceNodeId,
                    targetNodeId: payload.targetNodeId,
                    sourceFK: payload.sourceKey,
                    targetPK: payload.targetKey,
                    newFieldName: payload.fieldName,
                    relationshipType: payload.relationshipType as any
                }));
            }
        };

        const handleLinkFieldOpen = (payload: any) => {
            dispatch(openLinkFieldDialog(payload.sourceNodeId));
        };

        const handleRelationshipSelected = (payload: any) => {
            console.log('[JmixDataController] Received RELATIONSHIP_SELECTED:', payload);
        };

        // ... (existing handlers)

        const handleFieldRequestDelete = (payload: { nodeId: string; fieldIndex: number; fieldName?: string }) => {
            const node = nodes.find(n => n.id === payload.nodeId);
            if (node) {
                let index = payload.fieldIndex;
                let field = node.data.columns[index];

                // Robust Lookup by Name
                if (payload.fieldName && (!field || field.name !== payload.fieldName)) {
                    const foundIdx = node.data.columns.findIndex(c => c.name === payload.fieldName);
                    if (foundIdx !== -1) {
                        index = foundIdx;
                        field = node.data.columns[foundIdx];
                    }
                }

                if (field) {
                    dispatch(openConfirmDeleteDialog({
                        nodeId: payload.nodeId,
                        fieldIndex: index,
                        fieldName: field.name
                    }));
                }
            }
        };

        // Register Internal Listeners
        schemaEventBus.on(SchemaEvents.TABLE_ADD, handleTableAdd);
        schemaEventBus.on(SchemaEvents.TABLE_UPDATE, handleTableUpdate);
        schemaEventBus.on(SchemaEvents.TABLE_DELETE, handleTableDelete);
        schemaEventBus.on(SchemaEvents.TABLE_TOGGLE_VISIBILITY, handleTableToggleVisibility);

        schemaEventBus.on(SchemaEvents.FIELD_ADD, handleFieldAdd);
        schemaEventBus.on(SchemaEvents.FIELD_UPDATE, handleFieldUpdate);
        schemaEventBus.on(SchemaEvents.FIELD_DELETE, handleFieldDelete);
        schemaEventBus.on(SchemaEvents.FIELD_REQUEST_DELETE, handleFieldRequestDelete);
        schemaEventBus.on(SchemaEvents.FIELD_REORDER, handleFieldReorder);
        schemaEventBus.on(SchemaEvents.FIELD_TOGGLE_VISIBILITY, handleFieldToggleVisibility);
        schemaEventBus.on(SchemaEvents.FIELD_REQUEST_EDIT, handleFieldRequestEdit); // Changed

        schemaEventBus.on(SchemaEvents.SCHEMA_UNDO, handleUndo);
        schemaEventBus.on(SchemaEvents.SCHEMA_REDO, handleRedo);
        schemaEventBus.on(SchemaEvents.SCHEMA_AUTO_LAYOUT, handleAutoLayout);
        schemaEventBus.on(SchemaEvents.RELATIONSHIP_ADD, handleRelationshipAdd);
        schemaEventBus.on(SchemaEvents.LINK_FIELD_OPEN, handleLinkFieldOpen);
        schemaEventBus.on(SchemaEvents.RELATIONSHIP_SELECTED as any, handleRelationshipSelected);


        // --- External Message Listener (Jmix Integration) ---
        const handleWindowMessage = (event: MessageEvent) => {
            const data = event.data;
            if (data && data.type === 'SCHEMA_ACTION' && data.payload) {
                const { event: eventName, data: eventData } = data.payload;

                // Handle Bulk Load (One-way Sync from Jmix)
                if (eventName === 'schema:load') {
                    console.log('[JmixDataController] Loading Bulk Schema with Broadcast Mapping...', eventData);
                    dispatch(resetSchema());

                    // Reset Map
                    idMapRef.current = {};

                    // TODO: Implement Step 2: Filter / Validate Schema Data here
                    // e.g. Remove duplicates, check permissions, or select specific instances to load

                    // 1. Process Tables (Detect Duplicates & Replicate)
                    const processedIds: Record<string, number> = {};
                    const originalNames: Record<string, string> = {};

                    if (Array.isArray(eventData.tables)) {
                        eventData.tables.forEach((table: TableAddPayload) => {
                            const jmixId = table.id;
                            let nodeId = table.id;
                            let tableName = table.name;

                            if (jmixId) {
                                // Store original name
                                if (originalNames[jmixId] === undefined) {
                                    originalNames[jmixId] = table.name;
                                } else {
                                    tableName = originalNames[jmixId];
                                }

                                // Check duplicate count to generate Replica ID
                                if (processedIds[jmixId] === undefined) {
                                    processedIds[jmixId] = 0;
                                    // First instance: Keep ID simple (or add prefix if collision risk)
                                    // Let's use 'node_' prefix to be safe from internal collisions
                                    nodeId = `node_${jmixId}`;
                                } else {
                                    processedIds[jmixId]++;
                                    // Subsequent instances: Mark as Replica
                                    nodeId = `node_${jmixId}_replica_${processedIds[jmixId]}`;
                                }

                                // Map Logic
                                if (!idMapRef.current[jmixId]) {
                                    idMapRef.current[jmixId] = [];
                                }
                                idMapRef.current[jmixId].push(nodeId!);
                            }

                            dispatch(addTable({
                                ...table,
                                id: nodeId,
                                name: tableName
                            } as any));
                        });
                    }

                    // 2. Load Relationships
                    if (Array.isArray(eventData.relationships)) {
                        setTimeout(() => {
                            eventData.relationships.forEach((rel: RelationshipAddPayload) => {
                                // Map Jmix Entity IDs to actual Node IDs (Broadcast to ALL replicas)
                                const sourceNodeIds = idMapRef.current[rel.sourceNodeId] || [rel.sourceNodeId];
                                const targetNodeIds = idMapRef.current[rel.targetNodeId] || [rel.targetNodeId];

                                // Create relationship for Specific Replica (if specified) or Default to Primary (Index 0)
                                const sourceIdx = (rel as any).sourceReplicaIndex || 0;
                                const targetIdx = (rel as any).targetReplicaIndex || 0;

                                const sourceId = sourceNodeIds[sourceIdx];
                                const targetId = targetNodeIds[targetIdx];

                                if (sourceId && targetId) {
                                    // User Requirement: Strict Type Checking (array vs object only)
                                    const type = rel.type.toLowerCase();

                                    if (type === 'array') {
                                        dispatch(confirmLinkField({
                                            sourceNodeId: sourceId,
                                            targetNodeId: targetId,
                                            sourcePK: rel.sourceKey,
                                            targetFK: rel.targetKey,
                                            newFieldName: rel.fieldName,
                                            relationshipType: rel.relationshipType as any
                                        }));
                                    }
                                    else if (type === 'object') {
                                        dispatch(confirmLinkObject({
                                            sourceNodeId: sourceId,
                                            targetNodeId: targetId,
                                            sourceFK: rel.sourceKey,
                                            targetPK: rel.targetKey,
                                            newFieldName: rel.fieldName,
                                            relationshipType: rel.relationshipType as any
                                        }));
                                    }
                                }
                            });
                        }, 50);
                    }

                    // 3. Auto Layout
                    if (eventData.autoLayout) {
                        setTimeout(() => schemaEventBus.emit(SchemaEvents.SCHEMA_AUTO_LAYOUT), 100);
                    }
                    return;
                }

                // Handle Other Events
                if (Object.values(SchemaEvents).includes(eventName as any)) {
                    // ID Remapping for Follow-up Events
                    let targetIds: string[] = [];
                    let idField = 'nodeId'; // Default field name for node ID

                    if (eventData.nodeId) {
                        idField = 'nodeId';
                        console.log(`[JmixDataController] Received Event: ${eventName} for ${eventData.nodeId}`);
                        console.log(`[JmixDataController] Current Map:`, idMapRef.current);
                        targetIds = idMapRef.current[eventData.nodeId] || [eventData.nodeId];
                        console.log(`[JmixDataController] Mapped to Targets:`, targetIds);
                    } else if (eventData.id) {
                        idField = 'id';
                        targetIds = idMapRef.current[eventData.id] || [eventData.id];
                    }

                    if (targetIds.length > 0) {
                        // Check if specific instance index is requested
                        if (typeof eventData.instanceIndex === 'number' && targetIds[eventData.instanceIndex]) {
                            const targetId = targetIds[eventData.instanceIndex];
                            const newPayload = { ...eventData, [idField]: targetId };
                            console.log(`[JmixDataController] Emitting ${eventName} for SPECIFIC target ${targetId} (Index ${eventData.instanceIndex})`);
                            schemaEventBus.emit(eventName as any, newPayload);
                        } else {
                            // Broadcast event to all mapped replicas
                            targetIds.forEach(targetId => {
                                const newPayload = { ...eventData, [idField]: targetId };
                                console.log(`[JmixDataController] Emitting ${eventName} for ${targetId}`);
                                schemaEventBus.emit(eventName as any, newPayload);
                            });
                        }
                    } else {
                        // Fallback for global events (no specific target ID)
                        schemaEventBus.emit(eventName as any, eventData);
                    }
                }
            }
        };

        window.addEventListener('message', handleWindowMessage);

        // Cleanup
        return () => {
            schemaEventBus.off(SchemaEvents.TABLE_ADD, handleTableAdd);
            schemaEventBus.off(SchemaEvents.TABLE_UPDATE, handleTableUpdate);
            // ... (rest off unbinds)

            schemaEventBus.off(SchemaEvents.TABLE_DELETE, handleTableDelete);
            schemaEventBus.off(SchemaEvents.TABLE_TOGGLE_VISIBILITY, handleTableToggleVisibility);
            schemaEventBus.off(SchemaEvents.FIELD_ADD, handleFieldAdd);
            schemaEventBus.off(SchemaEvents.FIELD_UPDATE, handleFieldUpdate);
            schemaEventBus.off(SchemaEvents.FIELD_DELETE, handleFieldDelete);
            schemaEventBus.off(SchemaEvents.FIELD_REORDER, handleFieldReorder);
            schemaEventBus.off(SchemaEvents.FIELD_TOGGLE_VISIBILITY, handleFieldToggleVisibility);
            schemaEventBus.off(SchemaEvents.SCHEMA_UNDO, handleUndo);
            schemaEventBus.off(SchemaEvents.SCHEMA_REDO, handleRedo);
            schemaEventBus.off(SchemaEvents.SCHEMA_AUTO_LAYOUT, handleAutoLayout);
            schemaEventBus.off(SchemaEvents.RELATIONSHIP_ADD, handleRelationshipAdd);
            schemaEventBus.off(SchemaEvents.RELATIONSHIP_ADD, handleRelationshipAdd);
            schemaEventBus.off(SchemaEvents.LINK_FIELD_OPEN, handleLinkFieldOpen);
            schemaEventBus.off(SchemaEvents.RELATIONSHIP_SELECTED as any, handleRelationshipSelected);

            window.removeEventListener('message', handleWindowMessage);
        };
    }, [dispatch, nodes]);

    return null;
}
