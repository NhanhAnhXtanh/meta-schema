import { openLinkFieldDialog } from '@/store/slices/uiSlice';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { schemaEventBus } from '@/events/eventBus';
import { SchemaEvents, TableAddPayload, TableUpdatePayload, TableDeletePayload, FieldAddPayload, FieldUpdatePayload, FieldDeletePayload, FieldReorderPayload, FieldToggleVisibilityPayload, RelationshipAddPayload } from '@/events/schemaEvents';
import { addTable, updateTable, addField, updateField, deleteField, reorderFields, toggleFieldVisibility, setNodes } from '@/store/slices/schemaSlice';
import { deleteTableCascade, deleteFieldCascade } from '@/store/thunks/schemaThunks';
import { confirmLinkField, confirmLinkObject } from '@/store/slices/schemaSlice';
import { performAutoLayout } from '@/utils/autoLayout';
import { ActionCreators } from 'redux-undo';
import { AppDispatch, RootState } from '@/store';

/**
 * JmixDataController
 * 
 * Đóng vai trò là "Bộ não" quản lý dữ liệu (Database/Schema).
 * Component này lắng nghe các sự kiện logic từ UI, xử lý, và cập nhật Redux Store.
 * Nó KHÔNG phụ thuộc vào React Flow hay Canvas visualization.
 */
export function JmixDataController() {
    const dispatch = useDispatch<AppDispatch>();
    const nodes = useSelector((state: RootState) => state.schema.present.nodes);

    useEffect(() => {
        // --- Schema Manipulation Handlers (Database Ops) ---

        const handleTableAdd = (payload: TableAddPayload) => {
            dispatch(addTable(payload as any));
        };

        const handleTableUpdate = (payload: TableUpdatePayload) => {
            dispatch(updateTable({ id: payload.id, updates: payload.updates }));
        };

        const handleTableDelete = (payload: TableDeletePayload) => {
            dispatch(deleteTableCascade(payload.id));
        };

        const handleFieldAdd = (payload: FieldAddPayload) => {
            dispatch(addField({ nodeId: payload.nodeId, field: payload.field }));
        };

        const handleFieldUpdate = (payload: FieldUpdatePayload) => {
            dispatch(updateField({ nodeId: payload.nodeId, fieldIndex: payload.fieldIndex, updates: payload.updates }));
        };

        const handleFieldDelete = (payload: FieldDeletePayload) => {
            dispatch(deleteFieldCascade(payload.nodeId, payload.fieldIndex));
        };

        const handleFieldReorder = (payload: FieldReorderPayload) => {
            dispatch(reorderFields({ nodeId: payload.nodeId, oldIndex: payload.oldIndex, newIndex: payload.newIndex }));
        };

        const handleFieldToggleVisibility = (payload: FieldToggleVisibilityPayload) => {
            dispatch(toggleFieldVisibility({ nodeId: payload.nodeId, fieldIndex: payload.fieldIndex }));
        };

        const handleUndo = () => dispatch(ActionCreators.undo());
        const handleRedo = () => dispatch(ActionCreators.redo());

        const handleAutoLayout = () => {
            // Layout logic updates X,Y positions (DB fields)
            const layoutedNodes = performAutoLayout(nodes);
            dispatch(setNodes(layoutedNodes));
        };

        const handleRelationshipAdd = (payload: RelationshipAddPayload) => {
            if (payload.type === '1-n') {
                dispatch(confirmLinkField({
                    sourceNodeId: payload.sourceNodeId,
                    targetNodeId: payload.targetNodeId,
                    sourcePK: payload.sourceKey,
                    targetFK: payload.targetKey,
                    newFieldName: payload.fieldName,
                    relationshipType: payload.relationshipType as any || '1-n'
                }));
            } else {
                // type === 'object'
                dispatch(confirmLinkObject({
                    sourceNodeId: payload.sourceNodeId,
                    targetNodeId: payload.targetNodeId,
                    sourceFK: payload.sourceKey,
                    targetPK: payload.targetKey,
                    newFieldName: payload.fieldName,
                    relationshipType: payload.relationshipType as 'n-1' | '1-1'
                }));
            }
        };

        const handleLinkFieldOpen = (payload: any) => {
            dispatch(openLinkFieldDialog(payload.sourceNodeId));
        };

        const handleTableToggleVisibility = (payload: { id: string }) => {
            const node = nodes.find(n => n.id === payload.id);
            if (node) {
                const current = node.data.isActive !== false;
                dispatch(updateTable({ id: payload.id, updates: { isActive: !current } }));
            }
        };

        // Register Listeners
        schemaEventBus.on(SchemaEvents.TABLE_ADD, handleTableAdd);
        schemaEventBus.on(SchemaEvents.TABLE_UPDATE, handleTableUpdate);
        schemaEventBus.on(SchemaEvents.TABLE_DELETE, handleTableDelete);
        schemaEventBus.on(SchemaEvents.TABLE_TOGGLE_VISIBILITY, handleTableToggleVisibility);

        schemaEventBus.on(SchemaEvents.FIELD_ADD, handleFieldAdd);
        schemaEventBus.on(SchemaEvents.FIELD_UPDATE, handleFieldUpdate);
        schemaEventBus.on(SchemaEvents.FIELD_DELETE, handleFieldDelete);
        schemaEventBus.on(SchemaEvents.FIELD_REORDER, handleFieldReorder);
        schemaEventBus.on(SchemaEvents.FIELD_TOGGLE_VISIBILITY, handleFieldToggleVisibility);

        schemaEventBus.on(SchemaEvents.SCHEMA_UNDO, handleUndo);
        schemaEventBus.on(SchemaEvents.SCHEMA_REDO, handleRedo);
        schemaEventBus.on(SchemaEvents.SCHEMA_AUTO_LAYOUT, handleAutoLayout);
        schemaEventBus.on(SchemaEvents.RELATIONSHIP_ADD, handleRelationshipAdd);
        schemaEventBus.on(SchemaEvents.LINK_FIELD_OPEN, handleLinkFieldOpen);

        // Cleanup
        return () => {
            schemaEventBus.off(SchemaEvents.TABLE_ADD, handleTableAdd);
            schemaEventBus.off(SchemaEvents.TABLE_UPDATE, handleTableUpdate);
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
            schemaEventBus.off(SchemaEvents.LINK_FIELD_OPEN, handleLinkFieldOpen);
        };
    }, [dispatch, nodes]);

    return null;
}
