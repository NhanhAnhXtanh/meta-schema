import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface JsonImportState {
    fileName: string;
    previewData: {
        nodes: any[];
        edges: any[];
        collections: any[];
    } | null;
    error: string;
}

const initialState: JsonImportState = {
    fileName: '',
    previewData: null,
    error: '',
};

const jsonImportSlice = createSlice({
    name: 'jsonImport',
    initialState,
    reducers: {
        setJsonImportFileName: (state, action: PayloadAction<string>) => {
            state.fileName = action.payload;
        },
        setJsonImportPreviewData: (state, action: PayloadAction<any>) => {
            state.previewData = action.payload;
        },
        setJsonImportError: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
        },
        resetJsonImportState: () => initialState,
    },
});

export const { setJsonImportFileName, setJsonImportPreviewData, setJsonImportError, resetJsonImportState } = jsonImportSlice.actions;
export default jsonImportSlice.reducer;
