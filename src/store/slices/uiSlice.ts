import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
    sidebarOpen: boolean;

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

        openLinkFieldDialogWithValues: (state, action: PayloadAction<{
            sourceNodeId: string;
            initialValues: {
                targetNodeId: string;
                sourceKey: string;
                targetKey: string;
                fieldName?: string;
                linkType: '1-n' | 'n-1';
            }
        }>) => {
            state.linkFieldDialog.isOpen = true;
            state.linkFieldDialog.sourceNodeId = action.payload.sourceNodeId;
            state.linkFieldDialog.isEditMode = false;
            state.linkFieldDialog.initialValues = {
                fieldName: '',
                ...action.payload.initialValues
            };
        },

        closeLinkFieldDialog: (state) => {
            state.linkFieldDialog.isOpen = false;
            state.linkFieldDialog.sourceNodeId = null;
            state.linkFieldDialog.isEditMode = false;
            state.linkFieldDialog.initialValues = undefined;
        },

        // Confirm Delete Dialog
        openConfirmDeleteDialog: (state, action: PayloadAction<{ nodeId: string; fieldIndex: number; fieldName: string }>) => {
            state.confirmDeleteDialog = {
                isOpen: true,
                nodeId: action.payload.nodeId,
                fieldIndex: action.payload.fieldIndex,
                fieldName: action.payload.fieldName
            };
        },
        closeConfirmDeleteDialog: (state) => {
            state.confirmDeleteDialog = {
                isOpen: false,
                nodeId: null,
                fieldIndex: undefined,
                fieldName: undefined
            };
        },
    },
});

export const {
    toggleSidebar,
    setAddTableDialogOpen,
    openLinkFieldDialog, openEditLinkFieldDialog, openLinkFieldDialogWithValues, closeLinkFieldDialog,
    openConfirmDeleteDialog, closeConfirmDeleteDialog
} = uiSlice.actions;

export default uiSlice.reducer;
