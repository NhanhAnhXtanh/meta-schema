/**
 * Schema Service
 * Handles all business logic related to schema operations
 */

import { Node, Edge } from '@xyflow/react';
import { TableNodeData, TableColumn } from '@/types/schema';

export class SchemaService {
    /**
     * Validates if a field name is unique within a node
     */
    static isFieldNameUnique(node: Node<TableNodeData>, fieldName: string, excludeIndex?: number): boolean {
        return !node.data.columns.some((col, idx) =>
            col.name === fieldName && idx !== excludeIndex
        );
    }

    /**
     * Finds all child nodes connected to a specific field
     */
    static findChildNodes(
        nodeId: string,
        fieldName: string,
        edges: Edge[]
    ): string[] {
        const childEdges = edges.filter(e =>
            (e.source === nodeId && e.sourceHandle === fieldName) ||
            (e.source === nodeId && e.data?.objectFieldName === fieldName)
        );
        return childEdges.map(e => e.target);
    }

    /**
     * Finds all edges connected to a specific field
     */
    static findFieldEdges(
        nodeId: string,
        fieldName: string,
        edges: Edge[]
    ): Edge[] {
        return edges.filter(e =>
            (e.source === nodeId && e.sourceHandle === fieldName) ||
            (e.target === nodeId && e.targetHandle === fieldName) ||
            (e.source === nodeId && e.data?.objectFieldName === fieldName)
        );
    }

    /**
     * Gets the target node for a link field
     */
    static getLinkedTargetNode(
        nodeId: string,
        field: TableColumn,
        edges: Edge[],
        nodes: Node<TableNodeData>[]
    ): Node<TableNodeData> | null {
        let targetNodeId: string | null = null;

        if (field.isVirtual) {
            const edge = edges.find(e => e.source === nodeId && e.sourceHandle === field.name);
            if (edge) targetNodeId = edge.target;
        } else if (field.type === 'object') {
            const edge = edges.find(e => e.source === nodeId && e.data?.objectFieldName === field.name);
            if (edge) targetNodeId = edge.target;
        }

        return targetNodeId ? nodes.find(n => n.id === targetNodeId) || null : null;
    }

    /**
     * Generates a unique edge ID
     */
    static generateEdgeId(
        sourceNodeId: string,
        sourceHandle: string,
        targetNodeId: string,
        targetHandle: string
    ): string {
        return `${sourceNodeId}-${sourceHandle}-to-${targetNodeId}-${targetHandle}`;
    }

    /**
     * Validates link field configuration
     */
    static validateLinkField(params: {
        sourceNodeId: string;
        targetNodeId: string;
        sourceKey: string;
        targetKey: string;
        fieldName: string;
        nodes: Node<TableNodeData>[];
    }): { valid: boolean; error?: string } {
        const { sourceNodeId, targetNodeId, sourceKey, targetKey, fieldName, nodes } = params;

        const sourceNode = nodes.find(n => n.id === sourceNodeId);
        const targetNode = nodes.find(n => n.id === targetNodeId);

        if (!sourceNode) {
            return { valid: false, error: 'Source node not found' };
        }

        if (!targetNode) {
            return { valid: false, error: 'Target node not found' };
        }

        if (!fieldName.trim()) {
            return { valid: false, error: 'Field name is required' };
        }

        if (!this.isFieldNameUnique(sourceNode, fieldName)) {
            return { valid: false, error: 'Field name already exists' };
        }

        const sourceKeyExists = sourceNode.data.columns.some(c => c.name === sourceKey);
        if (!sourceKeyExists) {
            return { valid: false, error: 'Source key not found' };
        }

        const targetKeyExists = targetNode.data.columns.some(c => c.name === targetKey);
        if (!targetKeyExists) {
            return { valid: false, error: 'Target key not found' };
        }

        return { valid: true };
    }

    /**
     * Filters root nodes (nodes that are not targets of any edge)
     */
    static getRootNodes(nodes: Node<TableNodeData>[], edges: Edge[]): Node<TableNodeData>[] {
        return nodes.filter(node =>
            !edges.some(edge => edge.target === node.id)
        );
    }

    /**
     * Gets all descendants of a node recursively
     */
    static getDescendants(
        nodeId: string,
        edges: Edge[],
        visited: Set<string> = new Set()
    ): string[] {
        if (visited.has(nodeId)) return [];
        visited.add(nodeId);

        const children = edges
            .filter(e => e.source === nodeId)
            .map(e => e.target);

        const descendants: string[] = [...children];

        children.forEach(childId => {
            descendants.push(...this.getDescendants(childId, edges, visited));
        });

        return descendants;
    }
}
