import { TableColumn } from '@/types/schema';

export const SchemaEvents = {
    // Table Actions
    TABLE_ADD: 'table:add',
    TABLE_UPDATE: 'table:update',
    TABLE_DELETE: 'table:delete',
    TABLE_FOCUS: 'table:focus', // Previously "flyToNode"

    // Field Actions
    FIELD_ADD: 'field:add',
    FIELD_UPDATE: 'field:update',
    FIELD_DELETE: 'field:delete',
    FIELD_REORDER: 'field:reorder',
    FIELD_TOGGLE_VISIBILITY: 'field:toggle_visibility',

    // Global Actions
    SCHEMA_AUTO_LAYOUT: 'schema:auto_layout',
    SCHEMA_UNDO: 'schema:undo',
    SCHEMA_REDO: 'schema:redo',
    RELATIONSHIP_ADD: 'relationship:add',
} as const;

// Event Payload Interfaces
export interface TableAddPayload {
    name: string;
}

export interface TableUpdatePayload {
    id: string;
    updates: any;
}

export interface TableDeletePayload {
    id: string;
}

export interface TableFocusPayload {
    nodeId: string;
}

export interface FieldAddPayload {
    nodeId: string;
    field: TableColumn;
}

export interface FieldUpdatePayload {
    nodeId: string;
    fieldIndex: number;
    updates: Partial<TableColumn>;
}

export interface FieldDeletePayload {
    nodeId: string;
    fieldIndex: number;
}

export interface FieldReorderPayload {
    nodeId: string;
    oldIndex: number;
    newIndex: number;
}

export interface FieldToggleVisibilityPayload {
    nodeId: string;
    fieldIndex: number;
}

export interface RelationshipAddPayload {
    type: '1-n' | 'object';
    relationshipType?: '1-1' | '1-n' | 'n-1';
    sourceNodeId: string;
    targetNodeId: string;
    sourceKey: string;
    targetKey: string;
    fieldName: string;
}
