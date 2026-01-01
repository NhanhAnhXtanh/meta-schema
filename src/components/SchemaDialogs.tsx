import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { AddTableDialog } from './AddTableDialog';
import { LinkFieldDialog } from './LinkFieldDialog';

import {
    setAddTableDialogOpen,
    closeLinkFieldDialog,
    openLinkFieldDialog,
    addVisibleNodeId
} from '@/store/slices/uiSlice';
import {
    confirmLinkField,
    confirmLinkObject,
    deleteField,
    addTable
} from '@/store/slices/schemaSlice';
import { initialNodes } from '@/data/initialSchema';

export function SchemaDialogs() {
    const dispatch = useAppDispatch();

    // Dialog States
    const isAddTableOpen = useAppSelector(state => state.ui.isAddTableDialogOpen);
    const linkFieldDialogState = useAppSelector(state => state.ui.linkFieldDialog);


    // Data for Dialogs
    const nodes = useAppSelector(state => state.schema.present.nodes);
    const visibleNodeIdsArr = useAppSelector(state => state.ui.visibleNodeIds);
    const visibleNodeIds = new Set(visibleNodeIdsArr);



    // Handlers
    const handleLinkFieldConfirm = (
        targetNodeId: string,
        sourceKey: string,
        targetKey: string,
        newFieldName: string,
        type: '1-n' | 'n-1' | '1-1',
        isNewInstance?: boolean,
        templateId?: string
    ) => {
        if (linkFieldDialogState.sourceNodeId) {
            let finalTargetNodeId = targetNodeId;

            // 1. If Edit Mode, delete field first to cleanup old definition
            if (linkFieldDialogState.isEditMode && linkFieldDialogState.fieldIndex !== undefined) {
                dispatch(deleteField({
                    nodeId: linkFieldDialogState.sourceNodeId,
                    fieldIndex: linkFieldDialogState.fieldIndex,
                    skipRecursive: true
                }));
            }

            // 2. If it's a new instance, create it first
            if (isNewInstance && templateId) {
                // Find template from baseline data
                const template = initialNodes.find(n => n.id === templateId);
                const sourceNode = nodes.find(n => n.id === linkFieldDialogState.sourceNodeId);

                if (template) {
                    const newId = `table-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    // Simple logic to make label unique-ish if it already exists
                    const existingCount = nodes.filter(n => n.data.tableName === template.data.tableName).length;
                    const label = existingCount > 0 ? `${template.data.label} (${existingCount + 1})` : template.data.label;

                    // Calculate position (to the right of source)
                    const position = sourceNode
                        ? { x: sourceNode.position.x + 400, y: sourceNode.position.y }
                        : undefined;

                    dispatch(addTable({
                        id: newId,
                        name: label,
                        tableName: template.data.tableName,
                        columns: template.data.columns,
                        position
                    }));
                    dispatch(addVisibleNodeId(newId));
                    finalTargetNodeId = newId;
                }
            }

            // 3. Add Relationship
            if (type === '1-n') {
                dispatch(confirmLinkField({
                    sourceNodeId: linkFieldDialogState.sourceNodeId,
                    targetNodeId: finalTargetNodeId,
                    sourcePK: sourceKey,
                    targetFK: targetKey,
                    newFieldName
                }));
            } else {
                // n-1 or 1-1
                dispatch(confirmLinkObject({
                    sourceNodeId: linkFieldDialogState.sourceNodeId,
                    targetNodeId: finalTargetNodeId,
                    sourceFK: sourceKey,
                    targetPK: targetKey,
                    newFieldName,
                    relationshipType: type as 'n-1' | '1-1'
                }));
            }
            dispatch(closeLinkFieldDialog());
        }
    };



    return (
        <>
            <AddTableDialog
                open={isAddTableOpen}
                onOpenChange={(open) => dispatch(setAddTableDialogOpen(open))}
            />

            <LinkFieldDialog
                open={linkFieldDialogState.isOpen}
                onOpenChange={(open) => !open && dispatch(closeLinkFieldDialog())}
                sourceNode={nodes.find(n => n.id === linkFieldDialogState.sourceNodeId)}
                allNodes={nodes}
                visibleNodeIds={visibleNodeIds}
                onConfirm={handleLinkFieldConfirm}
                isEditMode={linkFieldDialogState.isEditMode}
                initialValues={linkFieldDialogState.initialValues}
            />


        </>
    );
}
