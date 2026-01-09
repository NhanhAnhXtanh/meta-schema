import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SidebarState {
    searchQuery: string;
    expandedNodes: string[]; // Store as array for Redux serialization
    draggedNodeId: string | null;
    dragOverNodeId: string | null;
    width: number;
    isResizing: boolean;
    isCollapsed: boolean;

    // Sidebar Item UI States
    editingNodeId: string | null; // The ID of the node currently being renamed
    editName: string; // The current value of the rename input
    menuOpenNodeId: string | null; // The ID of the node whose menu is open
    deleteDialogNodeId: string | null; // The ID of the node confirming deletion

    // Field DnD
    draggedFieldNodeId: string | null;
    draggedFieldIndex: number | null;
    dragOverFieldIndex: number | null;
}

const initialState: SidebarState = {
    searchQuery: '',
    expandedNodes: [],
    draggedNodeId: null,
    dragOverNodeId: null,
    width: 320,
    isResizing: false,
    isCollapsed: false,

    editingNodeId: null,
    editName: '',
    menuOpenNodeId: null,
    deleteDialogNodeId: null,

    draggedFieldNodeId: null,
    draggedFieldIndex: null,
    dragOverFieldIndex: null,
};

const sidebarSlice = createSlice({
    name: 'sidebar',
    initialState,
    reducers: {
        setSidebarSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
        },
        toggleSidebarNodeExpand: (state, action: PayloadAction<string>) => {
            const id = action.payload;
            if (state.expandedNodes.includes(id)) {
                state.expandedNodes = state.expandedNodes.filter(nodeId => nodeId !== id);
            } else {
                state.expandedNodes.push(id);
            }
        },
        setSidebarDraggedNodeId: (state, action: PayloadAction<string | null>) => {
            state.draggedNodeId = action.payload;
        },
        setSidebarDragOverNodeId: (state, action: PayloadAction<string | null>) => {
            state.dragOverNodeId = action.payload;
        },
        setSidebarWidth: (state, action: PayloadAction<number>) => {
            state.width = action.payload;
        },
        setIsSidebarResizing: (state, action: PayloadAction<boolean>) => {
            state.isResizing = action.payload;
        },
        setIsSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
            state.isCollapsed = action.payload;
        },

        // Item UI Reducers
        setEditingNodeId: (state, action: PayloadAction<string | null>) => {
            state.editingNodeId = action.payload;
            if (action.payload === null) state.editName = '';
        },
        setEditName: (state, action: PayloadAction<string>) => {
            state.editName = action.payload;
        },
        setMenuOpenNodeId: (state, action: PayloadAction<string | null>) => {
            state.menuOpenNodeId = action.payload;
        },
        setDeleteDialogNodeId: (state, action: PayloadAction<string | null>) => {
            state.deleteDialogNodeId = action.payload;
        },

        // Field DnD Reducers
        setSidebarFieldDragState: (state, action: PayloadAction<{ nodeId: string | null, index: number | null }>) => {
            state.draggedFieldNodeId = action.payload.nodeId;
            state.draggedFieldIndex = action.payload.index;
        },
        setSidebarFieldDragOverIndex: (state, action: PayloadAction<number | null>) => {
            state.dragOverFieldIndex = action.payload;
        }
    },
});

export const {
    setSidebarSearchQuery,
    toggleSidebarNodeExpand,
    setSidebarDraggedNodeId,
    setSidebarDragOverNodeId,
    setSidebarWidth,
    setIsSidebarResizing,
    setIsSidebarCollapsed,
    setEditingNodeId,
    setEditName,
    setMenuOpenNodeId,
    setDeleteDialogNodeId,
    setSidebarFieldDragState,
    setSidebarFieldDragOverIndex
} = sidebarSlice.actions;

export default sidebarSlice.reducer;
