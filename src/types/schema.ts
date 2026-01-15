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
    linkedForeignKeyField?: string; // Field FK mà field object/array link tới
    relationshipType?: '1-n' | 'n-1' | '1-1' | 'n-n';
    children?: TableColumn[]; // Defines inline nested structure
    description?: string;
    isRef?: boolean; // Đánh dấu field là reference
}

export interface TableNodeData {
    tableName: string;  // Tên bảng DB thực tế (e.g. "công_dân")
    label: string;       // Tên hiển thị/vai trò (e.g. "Chủ hộ")
    columns: TableColumn[];
    color?: string;
    _version?: number;   // Version for React Flow updates
    [key: string]: any;  // Index signature to satisfy Record<string, unknown>
}

// Re-export specific types if needed elsewhere or keep generic types here
