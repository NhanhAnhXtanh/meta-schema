import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { AddTableDialog } from './AddTableDialog';
import { LinkFieldDialog } from './LinkFieldDialog';
import { ObjectConnectionDialog } from './ObjectConnectionDialog';
import {
    setAddTableDialogOpen,
    closeLinkFieldDialog,
    openLinkFieldDialog,
    closeObjectConnectionDialog
} from '@/store/slices/uiSlice';
import {
    confirmLinkField,
    confirmLinkObject,
    confirmObjectConnection,
    deleteField
} from '@/store/slices/schemaSlice';

export function SchemaDialogs() {
    const dispatch = useAppDispatch();

    // Dialog States
    const isAddTableOpen = useAppSelector(state => state.ui.isAddTableDialogOpen);
    const linkFieldDialogState = useAppSelector(state => state.ui.linkFieldDialog);
    const objectConnectionState = useAppSelector(state => state.ui.objectConnectionDialog);

    // Data for Dialogs
    const nodes = useAppSelector(state => state.schema.nodes);
    const visibleNodeIdsArr = useAppSelector(state => state.ui.visibleNodeIds);
    const visibleNodeIds = new Set(visibleNodeIdsArr);

    // Listen custom event 'addField'
    useEffect(() => {
        const handleAddFieldEvent = (event: Event) => {
            const customEvent = event as CustomEvent<{ nodeId: string }>;
            if (customEvent.detail?.nodeId) {
                dispatch(openLinkFieldDialog(customEvent.detail.nodeId));
            }
        };

        window.addEventListener('addField', handleAddFieldEvent);
        return () => {
            window.removeEventListener('addField', handleAddFieldEvent);
        };
    }, [dispatch]);

    // Handlers
    const handleLinkFieldConfirm = (targetNodeId: string, sourceKey: string, targetKey: string, newFieldName: string, type: '1-n' | 'n-1') => {
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
                dispatch(confirmLinkObject({
                    sourceNodeId: linkFieldDialogState.sourceNodeId,
                    targetNodeId,
                    sourceFK: sourceKey,
                    targetPK: targetKey,
                    newFieldName
                }));
            }
            dispatch(closeLinkFieldDialog());
        }
    };

    const handleObjectConnectionConfirm = (fieldName: string, primaryKeyFieldName: string) => {
        if (objectConnectionState.pendingConnection) {
            dispatch(confirmObjectConnection({
                ...objectConnectionState.pendingConnection,
                newFieldName: fieldName,
                primaryKeyFieldName
            }));
            dispatch(closeObjectConnectionDialog());
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

            {objectConnectionState.pendingConnection && (
                <ObjectConnectionDialog
                    open={objectConnectionState.isOpen}
                    onOpenChange={(open) => !open && dispatch(closeObjectConnectionDialog())}
                    sourceNodeId={objectConnectionState.pendingConnection.sourceNodeId}
                    sourceFieldName={objectConnectionState.pendingConnection.sourceFieldName}
                    targetNode={
                        nodes.find(n => n.id === objectConnectionState.pendingConnection?.targetNodeId) || { id: '', data: { label: '', columns: [] } } as any
                    }
                    sourceNode={
                        objectConnectionState.pendingConnection.sourceFieldName === 'object-target'
                            ? (nodes.find(n => n.id === objectConnectionState.pendingConnection?.sourceNodeId) as any)
                            : undefined
                    }
                    isReverse={objectConnectionState.pendingConnection.sourceFieldName === 'object-target'}
                    onConfirm={handleObjectConnectionConfirm}
                />
            )}
        </>
    );
}
