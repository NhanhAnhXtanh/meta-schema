import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
    sidebarOpen: boolean;
    visibleNodeIds: string[]; // IDs of nodes visible in the sidebar tree or filtered view
    selectedNodeId: string | null;

    // Dialog States
    isAddTableDialogOpen: boolean;

    linkFieldDialog: {
        isOpen: boolean;
        sourceNodeId: string | null;
        isEditMode?: boolean;
        fieldIndex?: number;
        initialValues?: {
            targetNodeId: string;
            sourceKey: string;
            targetKey: string;
            fieldName: string;
            linkType: '1-n' | 'n-1';
        };
    };
}

const initialState: UiState = {
    sidebarOpen: true,
    visibleNodeIds: ['1'], // Initially just the root node '1' as per original App.tsx
    selectedNodeId: null,
    isAddTableDialogOpen: false,
    linkFieldDialog: {
        isOpen: false,
        sourceNodeId: null
    }
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen;
        },
        setVisibleNodeIds: (state, action: PayloadAction<string[]>) => {
            state.visibleNodeIds = action.payload;
        },
        addVisibleNodeId: (state, action: PayloadAction<string>) => {
            if (!state.visibleNodeIds.includes(action.payload)) {
                state.visibleNodeIds.push(action.payload);
            }
        },
        removeVisibleNodeId: (state, action: PayloadAction<string>) => {
            state.visibleNodeIds = state.visibleNodeIds.filter(id => id !== action.payload);
        },
        setSelectedNodeId: (state, action: PayloadAction<string | null>) => {
            state.selectedNodeId = action.payload;
        },

        // Dialog Actions
        setAddTableDialogOpen: (state, action: PayloadAction<boolean>) => {
            state.isAddTableDialogOpen = action.payload;
        },

        openLinkFieldDialog: (state, action: PayloadAction<string>) => {
            state.linkFieldDialog.isOpen = true;
            state.linkFieldDialog.sourceNodeId = action.payload;
            state.linkFieldDialog.isEditMode = false;
            state.linkFieldDialog.initialValues = undefined;
        },

        openEditLinkFieldDialog: (state, action: PayloadAction<{
            sourceNodeId: string;
            fieldIndex: number;
            initialValues: {
                targetNodeId: string;
                sourceKey: string;
                targetKey: string;
                fieldName: string;
                linkType: '1-n' | 'n-1';
            }
        }>) => {
            state.linkFieldDialog.isOpen = true;
            state.linkFieldDialog.sourceNodeId = action.payload.sourceNodeId;
            state.linkFieldDialog.isEditMode = true;
            state.linkFieldDialog.fieldIndex = action.payload.fieldIndex;
            state.linkFieldDialog.initialValues = action.payload.initialValues;
        },

        closeLinkFieldDialog: (state) => {
            state.linkFieldDialog.isOpen = false;
            state.linkFieldDialog.sourceNodeId = null;
            state.linkFieldDialog.isEditMode = false;
            state.linkFieldDialog.initialValues = undefined;
        },
    },
});

export const {
    toggleSidebar, setVisibleNodeIds, addVisibleNodeId, removeVisibleNodeId, setSelectedNodeId,
    setAddTableDialogOpen,
    openLinkFieldDialog, openEditLinkFieldDialog, closeLinkFieldDialog
} = uiSlice.actions;

export default uiSlice.reducer;
