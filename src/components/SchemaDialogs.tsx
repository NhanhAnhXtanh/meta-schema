import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { AddTableDialog } from './AddTableDialog';
import { LinkFieldDialog } from './LinkFieldDialog';
import {
    setAddTableDialogOpen,
    closeLinkFieldDialog,
    openLinkFieldDialog
} from '@/store/slices/uiSlice';
import {
    confirmLinkField,
    confirmLinkObject,
    deleteField
} from '@/store/slices/schemaSlice';

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
    const handleLinkFieldConfirm = (targetNodeId: string, sourceKey: string, targetKey: string, newFieldName: string, type: '1-n' | 'n-1' | '1-1') => {
        if (linkFieldDialogState.sourceNodeId) {
            // 1. If Edit Mode, delete field first to cleanup old definition
            if (linkFieldDialogState.isEditMode && linkFieldDialogState.fieldIndex !== undefined) {
                dispatch(deleteField({
                    nodeId: linkFieldDialogState.sourceNodeId,
                    fieldIndex: linkFieldDialogState.fieldIndex,
                    skipRecursive: true
                }));
            }

            // 2. Add New (or Re-add)
            if (type === '1-n') {
                dispatch(confirmLinkField({
                    sourceNodeId: linkFieldDialogState.sourceNodeId,
                    targetNodeId,
                    sourcePK: sourceKey,
                    targetFK: targetKey,
                    newFieldName
                }));
            } else {
                // n-1 or 1-1
                dispatch(confirmLinkObject({
                    sourceNodeId: linkFieldDialogState.sourceNodeId,
                    targetNodeId,
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
