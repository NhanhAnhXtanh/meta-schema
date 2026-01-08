import { Node, Edge } from '@xyflow/react';
import { TableNodeData, TableColumn } from '@/types/schema';

// Generate sample data with comments showing structure
export const generateSampleData = (
    nodes: Node<TableNodeData>[],
    edges: Edge[]
) => {
    const collections = nodes.map(node => {
        const sampleDoc: any = {};
        const comments: string[] = [];

        node.data.columns.forEach(column => {
            if (column.isVirtual) {
                // Find the relationship for this virtual field
                const edge = edges.find(e =>
                    (e.source === node.id && e.sourceHandle === column.name) ||
                    (e.target === node.id && e.targetHandle === column.name)
                );
                const relatedNode = edge ? nodes.find(n =>
                    n.id === (edge.source === node.id ? edge.target : edge.source)
                ) : null;

                comments.push(`  "${column.name}": // type: Reference, is_ref: true, ref: ${relatedNode?.data.tableName || 'unknown'}`);
                return;
            }

            const sample = generateSampleValue(column, nodes, edges);
            sampleDoc[column.name] = sample.value;

            if (sample.comment) {
                comments.push(`  "${column.name}": ${sample.comment}`);
            }
        });

        return {
            collection: node.data.tableName,
            displayName: node.data.label,
            sampleDocument: sampleDoc,
            comments: comments.length > 0 ? comments : undefined,
        };
    });

    return {
        version: '1.0',
        timestamp: new Date().toISOString(),
        database: 'my_database',
        description: 'Sample data with type annotations',
        collections,
    };
};

// Generate sample value for a field
const generateSampleValue = (
    field: TableColumn,
    nodes: Node<TableNodeData>[],
    edges: Edge[]
): { value: any; comment?: string } => {
    switch (field.type.toLowerCase()) {
        case 'varchar':
        case 'text':
            return { value: 'Sample text' };

        case 'uuid':
            return { value: 'uuid-001' };

        case 'int':
        case 'int4':
        case 'bigint':
            return { value: 123 };

        case 'float':
        case 'decimal':
            return { value: 123.45 };

        case 'boolean':
            return { value: true };

        case 'date':
        case 'timestamp':
            return { value: '2024-01-01' };

        case 'object':
            if (field.children && field.children.length > 0) {
                const obj: any = {};
                field.children.forEach(child => {
                    const childSample = generateSampleValue(child, nodes, edges);
                    obj[child.name] = childSample.value;
                });

                const refComment = field.description ? `, ref: ${field.description}` : '';
                return {
                    value: obj,
                    comment: `// type: Object, is_ref: false${refComment}`
                };
            }
            return {
                value: {},
                comment: field.description ? `// type: Object, is_ref: true, ref: ${field.description}` : undefined
            };

        case 'array':
            if (field.children && field.children.length > 0) {
                const item: any = {};
                field.children.forEach(child => {
                    const childSample = generateSampleValue(child, nodes, edges);
                    item[child.name] = childSample.value;
                });
                return {
                    value: [item],
                    comment: '// type: Array, is_ref: false'
                };
            }
            return {
                value: [],
                comment: '// type: Array, is_ref: false'
            };

        default:
            return { value: null };
    }
};

// Generate formatted JSON string with comments
export const generateSampleDataWithComments = (
    nodes: Node<TableNodeData>[],
    edges: Edge[]
): string => {
    let output = '// Sample Data Structure\n';
    output += '// Generated at: ' + new Date().toISOString() + '\n\n';

    nodes.forEach((node, index) => {
        if (index > 0) output += '\n\n';

        output += `// Collection: ${node.data.tableName}\n`;
        output += `// Display Name: ${node.data.label}\n`;
        output += '{\n';

        node.data.columns.forEach((column, colIndex) => {
            if (column.isVirtual) {
                // Find relationship
                const edge = edges.find(e =>
                    (e.source === node.id && e.sourceHandle === column.name) ||
                    (e.target === node.id && e.targetHandle === column.name)
                );
                const relatedNode = edge ? nodes.find(n =>
                    n.id === (edge.source === node.id ? edge.target : edge.source)
                ) : null;

                output += `  "${column.name}": // type: Reference, is_ref: true, ref: ${relatedNode?.data.tableName || 'unknown'}\n`;
                return;
            }

            const sample = generateSampleValue(column, nodes, edges);
            const jsonValue = JSON.stringify(sample.value, null, 2).split('\n').map((line, i) =>
                i === 0 ? line : '  ' + line
            ).join('\n');

            output += `  "${column.name}": ${jsonValue}`;
            if (sample.comment) {
                output += ` ${sample.comment}`;
            }
            if (colIndex < node.data.columns.length - 1) {
                output += ',';
            }
            output += '\n';
        });

        output += '}';
    });

    return output;
};
