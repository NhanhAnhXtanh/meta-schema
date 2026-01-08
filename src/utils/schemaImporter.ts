import { Node, Edge } from '@xyflow/react';
import { TableNodeData } from '@/types/schema';

// Convert exported schema back to internal format for re-import
export const importSchema = (jsonData: any): { nodes: Node<TableNodeData>[], edges: Edge[] } => {
    const nodes: Node<TableNodeData>[] = [];
    const edges: Edge[] = [];

    if (!jsonData.collections) {
        throw new Error('Invalid schema format: missing collections');
    }

    // Process each collection
    jsonData.collections.forEach((collection: any) => {
        // If collection has instances, create a node for each
        if (collection.instances && collection.instances.length > 0) {
            collection.instances.forEach((instance: any, index: number) => {
                // Extract columns from validator schema
                const properties = collection.validator?.$jsonSchema?.properties || {};
                const required = collection.validator?.$jsonSchema?.required || [];

                const columns = Object.entries(properties)
                    .filter(([name]) => name !== '_instanceId') // Skip internal field
                    .map(([name, schema]: [string, any]) => ({
                        name,
                        type: bsonTypeToType(schema.bsonType),
                        isPrimaryKey: required.includes(name) && name === 'id',
                        isForeignKey: schema.isForeignKey || false, // Default from generic schema
                        isNotNull: required.includes(name),
                        visible: true,
                        isRef: schema.isRef || false,
                        children: extractChildren(schema),
                        description: schema.description,
                    }));

                // Apply instance-specific column overrides (e.g. FK/Ref only on this instance)
                if (instance.columnSettings) {
                    columns.forEach((col: any) => {
                        const settings = instance.columnSettings[col.name];
                        if (settings) {
                            if (settings.isForeignKey !== undefined) col.isForeignKey = settings.isForeignKey;
                            if (settings.isRef !== undefined) col.isRef = settings.isRef;
                            if (settings.isPrimaryKey !== undefined) col.isPrimaryKey = settings.isPrimaryKey;
                        }
                    });
                }

                // Add virtual fields back for this instance
                if (collection.virtualFields) {
                    const instanceVirtualFields = collection.virtualFields.filter(
                        (vf: any) => vf.instanceId === instance.id
                    );
                    instanceVirtualFields.forEach((vf: any) => {
                        columns.push({
                            name: vf.name,
                            type: vf.type || 'varchar',
                            isPrimaryKey: false,
                            isForeignKey: false,
                            isNotNull: false,
                            visible: vf.visible !== false,
                            isVirtual: true,
                            isRef: vf.isRef || false,
                            linkedPrimaryKeyField: vf.linkedPrimaryKeyField,
                        } as any);
                    });
                }

                nodes.push({
                    id: instance.id,
                    type: 'table',
                    position: { x: 100 + index * 400, y: 100 },
                    data: {
                        tableName: collection.name,
                        label: instance.label,
                        columns,
                        color: '#22c55e',
                    }
                });
            });
        } else {
            // Single instance (backward compatibility)
            const properties = collection.validator?.$jsonSchema?.properties || {};
            const required = collection.validator?.$jsonSchema?.required || [];

            const columns = Object.entries(properties)
                .filter(([name]) => name !== '_instanceId')
                .map(([name, schema]: [string, any]) => ({
                    name,
                    type: bsonTypeToType(schema.bsonType),
                    isPrimaryKey: required.includes(name) && name === 'id',
                    isForeignKey: schema.isForeignKey || false,
                    isNotNull: required.includes(name),
                    visible: true,
                    isRef: schema.isRef || false,
                    children: extractChildren(schema),
                    description: schema.description,
                }));

            const nodeId = collection.instanceId || `imported-${collection.name}-${Date.now()}`;
            nodes.push({
                id: nodeId,
                type: 'table',
                position: { x: 100, y: 100 },
                data: {
                    tableName: collection.name,
                    label: collection.displayName || collection.name,
                    columns,
                    color: '#22c55e',
                }
            });
        }
    });

    // Reconstruct relationships as edges
    jsonData.collections.forEach((collection: any) => {
        if (collection.relationships) {
            collection.relationships.forEach((rel: any) => {
                const sourceNode = nodes.find(n => n.id === rel.instanceId);
                // Use relatedInstanceId if available to connect to the exact instance
                const targetNode = nodes.find(n =>
                    rel.relatedInstanceId ? n.id === rel.relatedInstanceId : n.data.tableName === rel.relatedCollection
                );

                if (sourceNode && targetNode) {
                    const sourceHandle = rel.field;
                    const targetHandle = rel.targetField || 'id'; // Fallback to 'id' for old exports
                    const edgeId = `${sourceNode.id}-${sourceHandle}-to-${targetNode.id}-${targetHandle}`;

                    // Avoid duplicates
                    if (!edges.some(e => e.id === edgeId)) {
                        edges.push({
                            id: edgeId,
                            source: sourceNode.id,
                            target: targetNode.id,
                            sourceHandle: sourceHandle,
                            targetHandle: targetHandle,
                            type: 'relationship',
                            data: { relationshipType: rel.type }
                        });
                    }
                }
            });
        }
    });

    return { nodes, edges };
};

// Helper: Convert bsonType back to our internal type
const bsonTypeToType = (bsonType: string): string => {
    const mapping: Record<string, string> = {
        'string': 'varchar',
        'int': 'int',
        'long': 'bigint',
        'double': 'float',
        'decimal': 'decimal',
        'bool': 'boolean',
        'date': 'date',
        'object': 'object',
        'array': 'array',
    };
    return mapping[bsonType] || 'varchar';
};

// Helper: Extract nested children from schema
const extractChildren = (schema: any): any[] | undefined => {
    if (schema.bsonType === 'object' && schema.properties) {
        return Object.entries(schema.properties).map(([name, childSchema]: [string, any]) => ({
            name,
            type: bsonTypeToType(childSchema.bsonType),
            visible: true,
            children: extractChildren(childSchema),
        }));
    }

    if (schema.bsonType === 'array' && schema.items?.properties) {
        return Object.entries(schema.items.properties).map(([name, childSchema]: [string, any]) => ({
            name,
            type: bsonTypeToType(childSchema.bsonType),
            visible: true,
            children: extractChildren(childSchema),
        }));
    }

    return undefined;
};
