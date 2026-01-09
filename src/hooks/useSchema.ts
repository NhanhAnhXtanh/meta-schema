/**
 * Custom hooks for schema operations
 */

import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { TableColumn } from '@/types/schema';
import { SchemaService } from '@/services/schemaService';
import {
    addField,
    updateField,
    deleteField,
    toggleFieldVisibility,
    reorderFields
} from '@/store/slices/schemaSlice';

/**
 * Hook for field operations
 */
export function useFieldOperations(nodeId: string) {
    const dispatch = useDispatch<AppDispatch>();

    const handleAddField = useCallback((field: TableColumn) => {
        dispatch(addField({ nodeId, field }));
    }, [dispatch, nodeId]);

    const handleUpdateField = useCallback((fieldIndex: number, updates: Partial<TableColumn>) => {
        dispatch(updateField({ nodeId, fieldIndex, updates }));
    }, [dispatch, nodeId]);

    const handleDeleteField = useCallback((fieldIndex: number, skipRecursive?: boolean) => {
        dispatch(deleteField({ nodeId, fieldIndex, skipRecursive }));
    }, [dispatch, nodeId]);

    const handleToggleVisibility = useCallback((fieldIndex: number) => {
        dispatch(toggleFieldVisibility({ nodeId, fieldIndex }));
    }, [dispatch, nodeId]);

    const handleReorderFields = useCallback((oldIndex: number, newIndex: number) => {
        dispatch(reorderFields({ nodeId, oldIndex, newIndex }));
    }, [dispatch, nodeId]);

    return {
        addField: handleAddField,
        updateField: handleUpdateField,
        deleteField: handleDeleteField,
        toggleVisibility: handleToggleVisibility,
        reorderFields: handleReorderFields
    };
}

/**
 * Hook for getting linked node information
 */
export function useLinkedNode(nodeId: string, field: TableColumn) {
    const edges = useSelector((state: RootState) => state.schema.present.edges);
    const nodes = useSelector((state: RootState) => state.schema.present.nodes);

    return useMemo(() => {
        const targetNode = SchemaService.getLinkedTargetNode(nodeId, field, edges, nodes);
        return {
            targetNode,
            hasLink: !!targetNode,
            targetNodeId: targetNode?.id || null
        };
    }, [nodeId, field, edges, nodes]);
}

/**
 * Hook for node hierarchy operations
 */
export function useNodeHierarchy() {
    const nodes = useSelector((state: RootState) => state.schema.present.nodes);
    const edges = useSelector((state: RootState) => state.schema.present.edges);

    const rootNodes = useMemo(() =>
        SchemaService.getRootNodes(nodes, edges),
        [nodes, edges]
    );

    const getDescendants = useCallback((nodeId: string) =>
        SchemaService.getDescendants(nodeId, edges),
        [edges]
    );

    const isRootNode = useCallback((nodeId: string) =>
        rootNodes.some(n => n.id === nodeId),
        [rootNodes]
    );

    return {
        rootNodes,
        getDescendants,
        isRootNode
    };
}

/**
 * Hook for field validation
 */
export function useFieldValidation(nodeId: string) {
    const nodes = useSelector((state: RootState) => state.schema.present.nodes);

    const isFieldNameUnique = useCallback((fieldName: string, excludeIndex?: number) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return false;
        return SchemaService.isFieldNameUnique(node, fieldName, excludeIndex);
    }, [nodes, nodeId]);

    const validateLinkField = useCallback((params: {
        targetNodeId: string;
        sourceKey: string;
        targetKey: string;
        fieldName: string;
    }) => {
        return SchemaService.validateLinkField({
            sourceNodeId: nodeId,
            ...params,
            nodes
        });
    }, [nodeId, nodes]);

    return {
        isFieldNameUnique,
        validateLinkField
    };
}


