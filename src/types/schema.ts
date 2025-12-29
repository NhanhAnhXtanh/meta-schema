export interface TableColumn {
    name: string;
    type: string;
    isPrimaryKey?: boolean;
    isForeignKey?: boolean;
    isNotNull?: boolean;
    visible?: boolean;
    primaryKeyField?: string; // Field làm PK cho object type
    isVirtual?: boolean; // Đánh dấu field virtual
    linkedPrimaryKeyField?: string; // Field PK mà field virtual link tới
    relationshipType?: '1-n' | 'n-1' | '1-1' | 'n-n';
}

export interface TableNodeData {
    label: string;
    columns: TableColumn[];
    color?: string;
}

// Re-export specific types if needed elsewhere or keep generic types here
