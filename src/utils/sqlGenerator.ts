import { Node, Edge } from '@xyflow/react';
import { TableNodeData, TableColumn } from '@/types/schema';

// Map internal types to SQL types
const typeToSQLType = (type: string): string => {
    const mapping: Record<string, string> = {
        'varchar': 'VARCHAR(255)',
        'text': 'TEXT',
        'uuid': 'UUID',
        'int': 'INTEGER',
        'int4': 'INTEGER',
        'bigint': 'BIGINT',
        'float': 'FLOAT',
        'decimal': 'DECIMAL(10,2)',
        'money': 'DECIMAL(19,4)',
        'boolean': 'BOOLEAN',
        'date': 'DATE',
        'timestamp': 'TIMESTAMP',
        'jsonb': 'JSONB',
        'object': 'JSONB',
        'array': 'JSONB',
    };
    return mapping[type.toLowerCase()] || 'VARCHAR(255)';
};

// Generate PostgreSQL CREATE TABLE statements
export const generatePostgreSQLSchema = (
    nodes: Node<TableNodeData>[],
    edges: Edge[]
): string => {
    let sql = '-- PostgreSQL Schema\n';
    sql += `-- Generated at: ${new Date().toISOString()}\n\n`;

    // Group nodes by tableName to avoid duplicates
    const groupedByTable = nodes.reduce((acc, node) => {
        const tableName = node.data.tableName;
        if (!acc[tableName]) {
            acc[tableName] = node;
        }
        return acc;
    }, {} as Record<string, Node<TableNodeData>>);

    // Generate CREATE TABLE statements
    Object.values(groupedByTable).forEach(node => {
        sql += `-- Table: ${node.data.label}\n`;
        sql += `CREATE TABLE IF NOT EXISTS ${node.data.tableName} (\n`;

        const columnDefs: string[] = [];
        const constraints: string[] = [];

        node.data.columns.forEach(column => {
            // Skip virtual fields
            if (column.isVirtual) {
                return;
            }

            let colDef = `    ${column.name} ${typeToSQLType(column.type)}`;

            if (column.isPrimaryKey) {
                colDef += ' PRIMARY KEY';
            }

            if (column.isNotNull && !column.isPrimaryKey) {
                colDef += ' NOT NULL';
            }

            if (column.description) {
                // PostgreSQL comment will be added separately
            }

            columnDefs.push(colDef);
        });

        sql += columnDefs.join(',\n');

        if (constraints.length > 0) {
            sql += ',\n' + constraints.join(',\n');
        }

        sql += '\n);\n\n';

        // Add comments for columns with descriptions
        node.data.columns.forEach(column => {
            if (column.description && !column.isVirtual) {
                sql += `COMMENT ON COLUMN ${node.data.tableName}.${column.name} IS '${column.description}';\n`;
            }
        });

        if (node.data.columns.some(c => c.description && !c.isVirtual)) {
            sql += '\n';
        }
    });

    // Add foreign key constraints
    edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        if (sourceNode && targetNode && edge.data?.relationshipType) {
            const sourceField = edge.sourceHandle;
            const targetField = edge.targetHandle || 'id';

            sql += `-- Foreign Key: ${sourceNode.data.tableName}.${sourceField} -> ${targetNode.data.tableName}.${targetField}\n`;
            sql += `ALTER TABLE ${sourceNode.data.tableName}\n`;
            sql += `    ADD CONSTRAINT fk_${sourceNode.data.tableName}_${sourceField}\n`;
            sql += `    FOREIGN KEY (${sourceField})\n`;
            sql += `    REFERENCES ${targetNode.data.tableName}(${targetField})\n`;
            sql += `    ON DELETE CASCADE;\n\n`;
        }
    });

    // Add indexes
    Object.values(groupedByTable).forEach(node => {
        node.data.columns.forEach(column => {
            if (column.isForeignKey && !column.isVirtual) {
                sql += `CREATE INDEX IF NOT EXISTS idx_${node.data.tableName}_${column.name}\n`;
                sql += `    ON ${node.data.tableName}(${column.name});\n\n`;
            }
        });
    });

    return sql;
};

// Generate MySQL CREATE TABLE statements
export const generateMySQLSchema = (
    nodes: Node<TableNodeData>[],
    edges: Edge[]
): string => {
    let sql = '-- MySQL Schema\n';
    sql += `-- Generated at: ${new Date().toISOString()}\n\n`;

    const groupedByTable = nodes.reduce((acc, node) => {
        const tableName = node.data.tableName;
        if (!acc[tableName]) {
            acc[tableName] = node;
        }
        return acc;
    }, {} as Record<string, Node<TableNodeData>>);

    Object.values(groupedByTable).forEach(node => {
        sql += `-- Table: ${node.data.label}\n`;
        sql += `CREATE TABLE IF NOT EXISTS \`${node.data.tableName}\` (\n`;

        const columnDefs: string[] = [];

        node.data.columns.forEach(column => {
            if (column.isVirtual) return;

            let colDef = `    \`${column.name}\` ${typeToSQLType(column.type).replace('JSONB', 'JSON')}`;

            if (column.isPrimaryKey) {
                colDef += ' PRIMARY KEY';
            }

            if (column.isNotNull && !column.isPrimaryKey) {
                colDef += ' NOT NULL';
            }

            if (column.description) {
                colDef += ` COMMENT '${column.description}'`;
            }

            columnDefs.push(colDef);
        });

        sql += columnDefs.join(',\n');
        sql += '\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n';
    });

    // Foreign keys
    edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        if (sourceNode && targetNode) {
            const sourceField = edge.sourceHandle;
            const targetField = edge.targetHandle || 'id';

            sql += `ALTER TABLE \`${sourceNode.data.tableName}\`\n`;
            sql += `    ADD CONSTRAINT \`fk_${sourceNode.data.tableName}_${sourceField}\`\n`;
            sql += `    FOREIGN KEY (\`${sourceField}\`)\n`;
            sql += `    REFERENCES \`${targetNode.data.tableName}\`(\`${targetField}\`)\n`;
            sql += `    ON DELETE CASCADE;\n\n`;
        }
    });

    return sql;
};
