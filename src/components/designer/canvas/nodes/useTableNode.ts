import { useRef, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { SchemaEvents } from '@/events/schemaEvents';
import { schemaEventBus } from '@/events/eventBus';
import { TableNodeData, TableColumn } from '@/types/schema';
import { THEME } from '@/constants/theme';
import { AppDispatch } from '@/store';

export function useTableNode(id: string, data: TableNodeData) {
    const dispatch = useDispatch<AppDispatch>();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(data.label);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const headerColor = data.color || THEME.NODE.HEADER_BG_DEFAULT;

    const handleAddField = () => {
        schemaEventBus.emit(SchemaEvents.LINK_FIELD_OPEN, { sourceNodeId: id });
    };

    const handleClone = () => {
        const newId = `table-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        schemaEventBus.emit(SchemaEvents.TABLE_ADD, {
            id: newId,
            name: `${data.label} (Bản sao)`,
            tableName: data.tableName || data.label,
            columns: data.columns
        });
    };

    const handleSaveRename = () => {
        if (editName.trim()) {
            schemaEventBus.emit(SchemaEvents.TABLE_UPDATE, { id, updates: { label: editName.trim() } });
            setIsEditing(false);
        }
    };

    return {
        isEditing,
        setIsEditing,
        editName,
        setEditName,
        showDeleteDialog,
        setShowDeleteDialog,
        headerColor,
        handleAddField,
        handleClone,
        handleSaveRename
    };
}
