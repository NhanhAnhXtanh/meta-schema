// Column/Field Types
export interface TableColumn {
    name: string;
    type: string;
    isPrimaryKey?: boolean;
    isForeignKey?: boolean;
    isNotNull?: boolean;
    visible?: boolean;
    isVirtual?: boolean;
    linkedPrimaryKeyField?: string;
    linkedForeignKeyField?: string;
    primaryKeyField?: string;
    relationshipType?: '1-n' | 'n-1' | '1-1' | 'n-n';
}

// Table Node Data
export interface TableNodeData {
    label: string;
    columns: TableColumn[];
    color?: string;
}
