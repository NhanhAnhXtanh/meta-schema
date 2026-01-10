import { useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
    setLinkFieldSelectedTargetNodeId,
    setLinkFieldSelectedSourceKey,
    setLinkFieldSelectedTargetKey,
    setLinkFieldNewFieldName,
    setLinkFieldLinkType,
    setLinkFieldSearchQuery,
    initializeLinkFieldState,
    resetLinkFieldState
} from '@/store/slices/linkFieldSlice';
import { closeLinkFieldDialog } from '@/store/slices/uiSlice';
import { schemaEventBus } from '@/events/eventBus';
import { SchemaEvents } from '@/events/schemaEvents';

import { ValidationUtils } from '@/utils/validation';

export function useLinkFieldForm() {
    const dispatch = useDispatch();

    // Global State
    const nodes = useSelector((state: RootState) => state.schema.present.nodes);

    // UI Dialog State
    const { isOpen, sourceNodeId, isEditMode, fieldIndex, initialValues } = useSelector((state: RootState) => state.ui.linkFieldDialog);

    // Form State
    const {
        selectedTargetNodeId,
        selectedSourceKey,
        selectedTargetKey,
        newFieldName,
        linkType,
        searchQuery
    } = useSelector((state: RootState) => state.linkField);

    // Derived State
    const sourceNode = useMemo(() => nodes.find(n => n.id === sourceNodeId), [nodes, sourceNodeId]);

    // Initialize Form
    useEffect(() => {
        if (isOpen) {
            if (initialValues) {
                dispatch(initializeLinkFieldState({
                    selectedTargetNodeId: initialValues.targetNodeId,
                    selectedSourceKey: initialValues.sourceKey,
                    selectedTargetKey: initialValues.targetKey,
                    newFieldName: initialValues.fieldName,
                    linkType: initialValues.linkType,
                    searchQuery: ''
                }));
            } else {
                dispatch(resetLinkFieldState());
            }
        }
    }, [isOpen, initialValues, dispatch]);

    // Available Targets (Existing tables only)
    const availableTargetNodes = useMemo(() => {
        if (!sourceNode) return [];
        return nodes;
    }, [nodes, sourceNode]);

    const sourceFields = useMemo(() => {
        if (!sourceNode) return [];
        return sourceNode.data.columns.filter((col) => col.visible !== false);
    }, [sourceNode]);

    const targetFields = useMemo(() => {
        if (!selectedTargetNodeId) return [];
        const targetNode = availableTargetNodes.find((n) => n.id === selectedTargetNodeId);
        if (!targetNode) return [];
        return targetNode.data.columns.filter((col) => col.visible !== false);
    }, [selectedTargetNodeId, availableTargetNodes]);

    const selectedTargetName = useMemo(() => {
        return availableTargetNodes.find(n => n.id === selectedTargetNodeId)?.data.label;
    }, [selectedTargetNodeId, availableTargetNodes]);


    // Validation Logic
    const validationError = useMemo(() => {
        if (!selectedSourceKey || !selectedTargetKey) return null;
        if (!selectedTargetNodeId) return null;

        const sourceCol = sourceNode?.data.columns.find(c => c.name === selectedSourceKey);
        const targetCol = targetFields.find(c => c.name === selectedTargetKey);

        if (sourceCol && targetCol) {
            const validation = ValidationUtils.validateRelationshipTypes(
                sourceCol.type,
                targetCol.type,
                sourceCol.name,
                targetCol.name
            );
            if (!validation.valid) return validation.error;
        }

        // Validate primitive types only for keys
        if (selectedSourceKey) {
            const sourceField = sourceFields.find(f => f.name === selectedSourceKey);
            if (sourceField && (sourceField.type === 'array' || sourceField.type === 'object')) {
                return `Không thể liên kết tới trường '${selectedSourceKey}' vì nó có kiểu '${sourceField.type}'`;
            }
        }

        if (selectedTargetKey) {
            const targetField = targetFields.find(f => f.name === selectedTargetKey);
            if (targetField && (targetField.type === 'array' || targetField.type === 'object')) {
                return `Không thể liên kết tới trường '${selectedTargetKey}' vì nó có kiểu '${targetField.type}'`;
            }
        }

        return null;
    }, [selectedSourceKey, selectedTargetKey, selectedTargetNodeId, sourceNode, targetFields, sourceFields]);

    const isFormValid =
        selectedTargetNodeId &&
        selectedSourceKey &&
        selectedTargetKey &&
        newFieldName.trim() &&
        !validationError;


    // Submit Handler
    const handleConfirm = useCallback(() => {
        if (!sourceNodeId) return;

        if (selectedTargetNodeId && selectedSourceKey && selectedTargetKey && newFieldName.trim()) {

            // 1. Delete old field if editing
            if (isEditMode && fieldIndex !== undefined) {
                schemaEventBus.emit(SchemaEvents.FIELD_DELETE, {
                    nodeId: sourceNodeId,
                    fieldIndex: fieldIndex,
                    skipRecursive: true
                });
            }

            // 2. Add Relationship Event
            schemaEventBus.emit(SchemaEvents.RELATIONSHIP_ADD, {
                type: (linkType === '1-n') ? '1-n' : 'object',
                relationshipType: linkType,
                sourceNodeId: sourceNodeId!,
                targetNodeId: selectedTargetNodeId,
                sourceKey: selectedSourceKey,
                targetKey: selectedTargetKey,
                fieldName: newFieldName.trim()
            });

            dispatch(closeLinkFieldDialog());
        }
    }, [sourceNodeId, selectedTargetNodeId, selectedSourceKey, selectedTargetKey, newFieldName, isEditMode, fieldIndex, linkType, dispatch]);

    const handleCancel = () => dispatch(closeLinkFieldDialog());

    return {
        // State
        isOpen,
        isEditMode,
        sourceNode,
        sourceFields,
        targetFields,
        validationError,
        isFormValid,

        // Form Values
        selectedTargetNodeId,
        selectedSourceKey,
        selectedTargetKey,
        newFieldName,
        linkType,
        searchQuery,
        selectedTargetName,
        availableTargetNodes,

        // Handlers
        handleConfirm,
        handleCancel,

        // Setters
        setLinkFieldSearchQuery: (q: string) => dispatch(setLinkFieldSearchQuery(q)),
        setLinkFieldNewFieldName: (n: string) => dispatch(setLinkFieldNewFieldName(n)),
        setLinkFieldLinkType: (t: any) => dispatch(setLinkFieldLinkType(t)),
        setLinkFieldSelectedTargetNodeId: (id: string) => dispatch(setLinkFieldSelectedTargetNodeId(id)),
        setLinkFieldSelectedSourceKey: (k: string) => dispatch(setLinkFieldSelectedSourceKey(k)),
        setLinkFieldSelectedTargetKey: (k: string) => dispatch(setLinkFieldSelectedTargetKey(k)),
    }
}
