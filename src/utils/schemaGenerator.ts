import { Node, Edge } from '@xyflow/react';
import { TableNodeData, TableColumn } from '@/types/schema';

// Type mapping from our schema to MongoDB bsonType
const typeToBsonType = (type: string): string => {
    const mapping: Record<string, string> = {
        'varchar': 'string',
        'text': 'string',
        'uuid': 'string',
        'int': 'int',
        'int4': 'int',
        'bigint': 'long',
        'float': 'double',
        'decimal': 'decimal',
        'money': 'decimal',
        'boolean': 'bool',
        'date': 'date',
        'timestamp': 'date',
        'jsonb': 'object',
        'object': 'object',
        'array': 'array',
    };
    return mapping[type.toLowerCase()] || 'string';
};

// Generate MongoDB schema for a single field
const generateFieldSchema = (field: TableColumn): any => {
    const bsonType = typeToBsonType(field.type);

    const schema: any = {
        bsonType,
    };

    // Add description if exists
    if (field.description) {
        schema.description = field.description;
    }

    // Handle object type with nested fields
    if (field.type === 'object' && field.children && field.children.length > 0) {
        schema.properties = {};
        const requiredFields: string[] = [];

        field.children.forEach(child => {
            schema.properties[child.name] = generateFieldSchema(child);
            if (child.isNotNull) {
                requiredFields.push(child.name);
            }
        });

        if (requiredFields.length > 0) {
            schema.required = requiredFields;
        }
    }

    // Handle array type with nested schema
    if (field.type === 'array' && field.children && field.children.length > 0) {
        // Array of objects
        schema.items = {
            bsonType: 'object',
            properties: {},
        };

        const requiredFields: string[] = [];

        field.children.forEach(child => {
            schema.items.properties[child.name] = generateFieldSchema(child);
            if (child.isNotNull) {
                requiredFields.push(child.name);
            }
        });

        if (requiredFields.length > 0) {
            schema.items.required = requiredFields;
        }
    }

    return schema;
};

// Generate collection schema
export const generateSchema = (
    nodes: Node<TableNodeData>[],
    edges: Edge[]
) => {
    // Group nodes by tableName
    const groupedByTable = nodes.reduce((acc, node) => {
        const tableName = node.data.tableName;
        if (!acc[tableName]) {
            acc[tableName] = [];
        }
        acc[tableName].push(node);
        return acc;
    }, {} as Record<string, Node<TableNodeData>[]>);

    const collections = Object.entries(groupedByTable).map(([tableName, instances]) => {
        // Use the first instance as the base schema
        const baseNode = instances[0];
        const properties: Record<string, any> = {};
        const requiredFields: string[] = [];
        const indexes: any[] = [];

        // Process columns from base node
        baseNode.data.columns.forEach(column => {
            // Skip virtual fields for validator (they don't exist in database)
            if (column.isVirtual) {
                return;
            }

            properties[column.name] = generateFieldSchema(column);

            // Track required fields
            if (column.isNotNull || column.isPrimaryKey) {
                requiredFields.push(column.name);
            }

            // Track indexes
            if (column.isPrimaryKey) {
                indexes.push({
                    key: { [column.name]: 1 },
                    unique: true,
                    name: `${column.name}_pk`
                });
            } else if (column.isForeignKey) {
                indexes.push({
                    key: { [column.name]: 1 },
                    name: `${column.name}_fk`
                });
            }
        });

        // Collect virtual fields separately (for re-import)
        const virtualFields = instances.flatMap(node =>
            node.data.columns
                .filter(col => col.isVirtual)
                .map(col => ({
                    instanceId: node.id,
                    name: col.name,
                    type: col.type,
                    linkedPrimaryKeyField: col.linkedPrimaryKeyField,
                    visible: col.visible,
                }))
        );

        // Add _instanceId field to distinguish between instances
        properties['_instanceId'] = {
            bsonType: 'string',
            description: 'Instance identifier for UI tracking'
        };

        // Build validator
        const validator: any = {
            $jsonSchema: {
                bsonType: 'object',
                title: baseNode.data.label,
                properties,
            }
        };

        if (requiredFields.length > 0) {
            validator.$jsonSchema.required = requiredFields;
        }

        // Collect all relationships from all instances
        const allRelationships = instances.flatMap(node => {
            return edges
                .filter(edge => edge.source === node.id || edge.target === node.id)
                .map(edge => {
                    const isSource = edge.source === node.id;
                    const relatedNode = nodes.find(n => n.id === (isSource ? edge.target : edge.source));

                    return {
                        instanceId: node.id,
                        field: isSource ? edge.sourceHandle : edge.targetHandle,
                        relatedCollection: relatedNode?.data.tableName || 'unknown',
                        type: edge.data?.relationshipType || '1-n',
                        direction: isSource ? 'outgoing' : 'incoming'
                    };
                });
        });

        return {
            name: tableName,
            displayName: baseNode.data.label,
            instances: instances.map(node => ({
                id: node.id,
                label: node.data.label,
            })),
            validator,
            indexes: indexes.length > 0 ? indexes : undefined,
            relationships: allRelationships.length > 0 ? allRelationships : undefined,
            virtualFields: virtualFields.length > 0 ? virtualFields : undefined, // Add virtual fields
        };
    });

    return {
        version: '1.0',
        timestamp: new Date().toISOString(),
        database: 'my_database',
        collections,
    };
};

// Generate shell commands to create collections with validators
export const generateCommands = (schema: any): string => {
    let commands = `// Schema Creation Commands\n`;
    commands += `// Generated at: ${schema.timestamp}\n\n`;
    commands += `use ${schema.database};\n\n`;

    schema.collections.forEach((collection: any) => {
        commands += `// Create collection: ${collection.name}\n`;
        commands += `db.createCollection("${collection.name}", ${JSON.stringify({ validator: collection.validator }, null, 2)});\n\n`;

        // Add indexes
        if (collection.indexes) {
            collection.indexes.forEach((index: any) => {
                commands += `db.${collection.name}.createIndex(${JSON.stringify(index.key)}, { unique: ${index.unique || false}, name: "${index.name}" });\n`;
            });
            commands += '\n';
        }
    });

    return commands;
};
