import { useEffect, useMemo, useCallback } from 'react';
import { useTemplates } from '@/hooks/useTemplates';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
    setLinkFieldTargetType,
    setLinkFieldSelectedTargetNodeId,
    setLinkFieldSelectedTemplateId,
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
        targetType,
        selectedTargetNodeId,
        selectedTemplateId,
        selectedSourceKey,
        selectedTargetKey,
        newFieldName,
        linkType,
        searchQuery
    } = useSelector((state: RootState) => state.linkField);

    // Derived State
    const sourceNode = useMemo(() => nodes.find(n => n.id === sourceNodeId), [nodes, sourceNodeId]);
    const allNodes = nodes;

    // Initialize Form
    useEffect(() => {
        if (isOpen) {
            if (initialValues) {
                dispatch(initializeLinkFieldState({
                    targetType: 'existing',
                    selectedTargetNodeId: initialValues.targetNodeId,
                    selectedSourceKey: initialValues.sourceKey,
                    selectedTargetKey: initialValues.targetKey,
                    newFieldName: initialValues.fieldName,
                    linkType: initialValues.linkType,
                    selectedTemplateId: '',
                    searchQuery: ''
                }));
            } else {
                dispatch(resetLinkFieldState());
            }
        }
    }, [isOpen, initialValues, dispatch]);


    // Templates Logic (Reused)
    const { templates, filteredTemplates } = useTemplates(searchQuery);


    // Available Targets
    const availableTargetNodes = useMemo(() => {
        if (!sourceNode) return [];
        return allNodes;
    }, [allNodes, sourceNode]);

    const sourceFields = useMemo(() => {
        if (!sourceNode) return [];
        return sourceNode.data.columns.filter((col) => col.visible !== false);
    }, [sourceNode]);

    const targetFields = useMemo(() => {
        if (targetType === 'existing') {
            if (!selectedTargetNodeId) return [];
            const targetNode = availableTargetNodes.find((n) => n.id === selectedTargetNodeId);
            if (!targetNode) return [];
            return targetNode.data.columns.filter((col) => col.visible !== false);
        } else {
            if (!selectedTemplateId) return [];
            const template = templates.find(t => t.id === selectedTemplateId);
            if (!template) return [];
            return template.columns;
        }
    }, [selectedTargetNodeId, selectedTemplateId, availableTargetNodes, templates, targetType]);

    const selectedTargetName = useMemo(() => {
        if (targetType === 'existing') {
            return availableTargetNodes.find(n => n.id === selectedTargetNodeId)?.data.label;
        }
        return templates.find(t => t.id === selectedTemplateId)?.name;
    }, [targetType, selectedTargetNodeId, selectedTemplateId, availableTargetNodes, templates]);


    // Validation Logic
    const validationError = useMemo(() => {
        if (!selectedSourceKey || !selectedTargetKey) return null;
        const finalTargetId = targetType === 'existing' ? selectedTargetNodeId : selectedTemplateId;
        if (!finalTargetId) return null;

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
    }, [selectedSourceKey, selectedTargetKey, selectedTargetNodeId, selectedTemplateId, sourceNode, targetFields, targetType, sourceFields]);

    const isFormValid =
        (targetType === 'existing' ? selectedTargetNodeId : selectedTemplateId) &&
        selectedSourceKey &&
        selectedTargetKey &&
        newFieldName.trim() &&
        !validationError;


    // Submit Handler
    const handleConfirm = useCallback(() => {
        if (!sourceNodeId) return;
        const finalTargetId = targetType === 'existing' ? selectedTargetNodeId : selectedTemplateId;
        const isNewInstance = targetType === 'template';

        if (finalTargetId && selectedSourceKey && selectedTargetKey && newFieldName.trim()) {
            let actualTargetNodeId = selectedTargetNodeId;

            // 1. Delete old field if editing
            if (isEditMode && fieldIndex !== undefined) {
                schemaEventBus.emit(SchemaEvents.FIELD_DELETE, {
                    nodeId: sourceNodeId,
                    fieldIndex: fieldIndex,
                    skipRecursive: true
                });
            }

            // 2. Create new instance if needed
            if (isNewInstance && selectedTemplateId) {
                const template = templates.find(n => n.id === selectedTemplateId);
                const sNode = nodes.find(n => n.id === sourceNodeId);

                if (template && sNode) {
                    const newId = `table-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    const existingCount = nodes.filter(n => n.data.tableName === template.tableName).length;
                    const label = existingCount > 0 ? `${template.name} (${existingCount + 1})` : template.name;

                    // Simple auto-layout calculation (can be extracted further)
                    const position = { x: sNode.position.x + 600, y: sNode.position.y };
                    // ... More complex collision detection skipped for brevity / already in Controller logic usually?
                    // Reusing the simple logic from before:

                    schemaEventBus.emit(SchemaEvents.TABLE_ADD, {
                        id: newId,
                        name: label,
                        tableName: template.tableName,
                        columns: template.columns.map(c => ({ ...c, isVirtual: false })),
                        position
                    });

                    actualTargetNodeId = newId;
                }
            }

            // 3. Add Relationship Event
            schemaEventBus.emit(SchemaEvents.RELATIONSHIP_ADD, {
                type: (linkType === '1-n') ? '1-n' : 'object',
                relationshipType: linkType,
                sourceNodeId: sourceNodeId!,
                targetNodeId: actualTargetNodeId,
                sourceKey: selectedSourceKey,
                targetKey: selectedTargetKey,
                fieldName: newFieldName.trim()
            });

            dispatch(closeLinkFieldDialog());
        }
    }, [sourceNodeId, targetType, selectedTargetNodeId, selectedTemplateId, selectedSourceKey, selectedTargetKey, newFieldName, isEditMode, fieldIndex, linkType, nodes, dispatch, templates]);

    const handleCancel = () => dispatch(closeLinkFieldDialog());

    // Action wrappers
    const setTargetTypeAction = (t: any) => dispatch(setLinkFieldTargetType(t));
    const setSelectionAction = (payload: any) => {
        if (payload.type === 'template') {
            dispatch(setLinkFieldTargetType('template'));
            dispatch(setLinkFieldSelectedTemplateId(payload.id));
            dispatch(setLinkFieldSelectedTargetNodeId(''));
        } else {
            dispatch(setLinkFieldTargetType('existing'));
            dispatch(setLinkFieldSelectedTargetNodeId(payload.id));
            dispatch(setLinkFieldSelectedTemplateId(''));
        }
    };
    // ... allow component to dispatch specific setters if needed, or wrap them.
    // For simplicity, we expose dispatch or specific setters.

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
        targetType,
        selectedTargetNodeId,
        selectedTemplateId,
        selectedSourceKey,
        selectedTargetKey,
        newFieldName,
        linkType,
        searchQuery,
        selectedTargetName,
        availableTargetNodes,
        filteredTemplates,
        templates,

        // Handlers
        handleConfirm,
        handleCancel,

        // Setters
        setLinkFieldSearchQuery: (q: string) => dispatch(setLinkFieldSearchQuery(q)),
        setLinkFieldSelectedTemplateId: (id: string) => dispatch(setLinkFieldSelectedTemplateId(id)),
        setLinkFieldNewFieldName: (n: string) => dispatch(setLinkFieldNewFieldName(n)),
        setLinkFieldTargetType: setTargetTypeAction,
        setLinkFieldLinkType: (t: any) => dispatch(setLinkFieldLinkType(t)),
        setLinkFieldSelectedTargetNodeId: (id: string) => dispatch(setLinkFieldSelectedTargetNodeId(id)),
        setLinkFieldSelectedSourceKey: (k: string) => dispatch(setLinkFieldSelectedSourceKey(k)),
        setLinkFieldSelectedTargetKey: (k: string) => dispatch(setLinkFieldSelectedTargetKey(k)),
        setSelectionAction
    }
}
