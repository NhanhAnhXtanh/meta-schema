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

                if (template && sourceNode) {
                    const newId = `table-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    // Simple logic to make label unique-ish if it already exists
                    const existingCount = nodes.filter(n => n.data.tableName === template.data.tableName).length;
                    const label = existingCount > 0 ? `${template.data.label} (${existingCount + 1})` : template.data.label;

                    // Smart Positioning Logic
                    // We want to align the Source Field (Right Handle) with the Target Field (Left Handle)
                    const ROW_HEIGHT = 37; // Exact tailwind py-2 (16px) + text-sm (20px) + border (1px)

                    // Find index of source field (Visual Index)
                    // The new field will be appended to the end of the list
                    const sourceCols = sourceNode.data.columns.filter((c: any) => c.visible !== false);
                    const sourceIndex = sourceCols.length; // New field is at the bottom

                    // Find index of target field (Visual Index in new template)
                    const targetCols = template.data.columns.filter((c: any) => c.visible !== false);
                    const targetIndex = targetCols.findIndex((c: any) => c.name === targetKey);

                    // Default position: To the right (x + 600) for better separation
                    let position = { x: sourceNode.position.x + 600, y: sourceNode.position.y };

                    if (targetIndex !== -1) {
                        // Align handles vertically
                        // Target NodeY = SourceNodeY + (S_Index - T_Index) * Row
                        const yDiff = (sourceIndex - targetIndex) * ROW_HEIGHT;
                        position.y = sourceNode.position.y + yDiff;
                    }

                    // Check for collision with existing nodes at roughly the same position
                    // If overlap, push down. Simple heuristic.
                    const isOccupied = (x: number, y: number) => {
                        return nodes.some(n =>
                            Math.abs(n.position.x - x) < 100 &&
                            Math.abs(n.position.y - y) < 100
                        );
                    };

                    // Retry a few times if occupied (though alignment is primary request, avoiding total overlap is good)
                    let attempts = 0;
                    while (isOccupied(position.x, position.y) && attempts < 5) {
                        position.y += 100; // Push down
                        attempts++;
                    }

                    dispatch(addTable({
                        id: newId,
                        name: label,
                        tableName: template.data.tableName,
                        columns: template.data.columns.map(c => ({ ...c, isVirtual: false })),
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

            {linkFieldDialogState.isOpen && (
                <LinkFieldDialog
                    open={linkFieldDialogState.isOpen}
                    onOpenChange={(open) => !open && dispatch(closeLinkFieldDialog())}
                    sourceNode={nodes.find(n => n.id === linkFieldDialogState.sourceNodeId)}
                    allNodes={nodes}
                    visibleNodeIds={visibleNodeIds}
                    onConfirm={handleLinkFieldConfirm}
                    isEditMode={linkFieldDialogState.isEditMode}
                    initialValues={linkFieldDialogState.initialValues}
                    isNameEditable={(() => {
                        const sourceNode = nodes.find(n => n.id === linkFieldDialogState.sourceNodeId);
                        const fieldName = linkFieldDialogState.initialValues?.fieldName;
                        const field = sourceNode?.data.columns.find(c => c.name === fieldName);
                        // If field exists, only editable if virtual. If creating a new one (field undefined), it's editable.
                        return field ? !!field.isVirtual : true;
                    })()}
                />
            )}


        </>
    );
}
