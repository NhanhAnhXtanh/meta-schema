import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ExportFormat = 'sample' | 'schema';

interface ExportState {
    format: ExportFormat;
}

const initialState: ExportState = {
    format: 'sample',
};

const exportSlice = createSlice({
    name: 'export',
    initialState,
    reducers: {
        setExportFormat: (state, action: PayloadAction<ExportFormat>) => {
            state.format = action.payload;
        },
    },
});

export const { setExportFormat } = exportSlice.actions;
export default exportSlice.reducer;
