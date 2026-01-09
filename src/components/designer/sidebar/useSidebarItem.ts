import { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { updateTable, reorderFields } from '@/store/slices/schemaSlice';
import { openLinkFieldDialog } from '@/store/slices/uiSlice';
import { schemaEventBus } from '@/events/eventBus';
import { SchemaEvents } from '@/events/schemaEvents';
import {
    setEditingNodeId,
    setMenuOpenNodeId,
    setSidebarFieldDragState,
    setSidebarFieldDragOverIndex
} from '@/store/slices/sidebarSlice';
import { Node } from '@xyflow/react';
import { TableNodeData } from '@/types/schema';

export function useSidebarItem(
    node: Node<TableNodeData>,
    isExpanded: boolean,
    onToggleExpand: (id: string) => void
) {
    const dispatch = useDispatch<AppDispatch>();

    // Selectors optimized
    const {
        editingNodeId,
        editName: globalEditName,
        menuOpenNodeId,
        deleteDialogNodeId,
        draggedFieldNodeId,
        draggedFieldIndex,
        dragOverFieldIndex
    } = useSelector((state: RootState) => state.sidebar);

    const isEditing = editingNodeId === node.id;
    const currentEditName = isEditing ? globalEditName : node.data.label;
    const isMenuOpen = menuOpenNodeId === node.id;
    const showDeleteDialog = deleteDialogNodeId === node.id;
    const isThisNodeFieldDragging = draggedFieldNodeId === node.id;

    // Actions
    const handleSaveEdit = () => {
        if (currentEditName.trim()) {
            // Refactor: Emit event instead of direct dispatch
            schemaEventBus.emit(SchemaEvents.TABLE_UPDATE, {
                id: node.id,
                updates: { label: currentEditName.trim() }
            });
            dispatch(setEditingNodeId(null));
        }
    };

    const handleFieldDragStart = (e: React.DragEvent, index: number) => {
        dispatch(setSidebarFieldDragState({ nodeId: node.id, index }));
        e.dataTransfer.effectAllowed = 'move';
        e.stopPropagation();
    };

    const handleFieldDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (isThisNodeFieldDragging && draggedFieldIndex !== index) {
            dispatch(setSidebarFieldDragOverIndex(index));
        }
    };

    const handleFieldDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (isThisNodeFieldDragging && draggedFieldIndex !== null && draggedFieldIndex !== index) {
            // Emitting event for reorder is tricky if we don't have a specific event for it yet.
            // But checking SchemaEvents, we don't have FIELD_REORDER yet.
            // Let's stick to dispatch for now OR add new event.
            // Given the user wants "Events", let's assume we should treat reorder as a schema change.
            // For now, let's keep dispatch for reorder to minimalize risk, 
            // OR let's add `dispatch(reorderFields(...))` because it's a very specific internal UI Interaction.
            // If Sidebar moves to Jmix, Jmix likely won't handle drag-drop INSIDE this React component,
            // but Jmix might send a "Full Schema Update".
            // Since we are inside the React App Sidebar (for now), direct dispatch is okay for detailed UI interaction,
            // BUT for major actions (Rename, Delete) event bus is better.

            // Let's use direct dispatch for drag/drop reorder for now as it's highly interactive local state.
            dispatch(reorderFields({ nodeId: node.id, oldIndex: draggedFieldIndex, newIndex: index }));
        }
        dispatch(setSidebarFieldDragState({ nodeId: null, index: null }));
        dispatch(setSidebarFieldDragOverIndex(null));
    };


    const handleAddField = () => {
        dispatch(openLinkFieldDialog(node.id));
    };

    const handleFocusNode = () => {
        schemaEventBus.emit(SchemaEvents.TABLE_FOCUS, { nodeId: node.id });
    };

    const handleToggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(setMenuOpenNodeId(isMenuOpen ? null : node.id));
    };

    const handleConfirmDelete = () => {
        schemaEventBus.emit(SchemaEvents.TABLE_DELETE, { id: node.id });
        dispatch(setDeleteDialogNodeId(null));
    };

    return {
        // State
        isEditing,
        currentEditName,
        isMenuOpen,
        showDeleteDialog,
        draggedFieldIndex,
        dragOverFieldIndex,
        isThisNodeFieldDragging,

        // Handlers
        handleSaveEdit,
        handleFieldDragStart,
        handleFieldDragOver,
        handleFieldDrop,
        handleAddField,
        handleFocusNode,
        handleToggleMenu,
        handleConfirmDelete, // Export new handler
    };
}
