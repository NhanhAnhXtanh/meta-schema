import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TableColumn } from '@/types/schema';

interface AddTableState {
    mode: 'manual' | 'template' | 'api' | 'json' | 'export';
    searchQuery: string;
    apiUrl: string;
    isFetching: boolean;
    tableName: string;
    displayLabel: string;
    columns: TableColumn[];
    selectedTemplateName: string | null;
}

const initialState: AddTableState = {
    mode: 'template',
    searchQuery: '',
    apiUrl: 'https://jsonplaceholder.typicode.com/users/1',
    isFetching: false,
    tableName: '',
    displayLabel: '',
    columns: [{ name: 'id', type: 'uuid', isPrimaryKey: true, visible: true }],
    selectedTemplateName: null,
};

const addTableSlice = createSlice({
    name: 'addTable',
    initialState,
    reducers: {
        setMode: (state, action: PayloadAction<'manual' | 'template' | 'api' | 'json' | 'export'>) => {
            state.mode = action.payload;
        },
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
        },
        setApiUrl: (state, action: PayloadAction<string>) => {
            state.apiUrl = action.payload;
        },
        setIsFetching: (state, action: PayloadAction<boolean>) => {
            state.isFetching = action.payload;
        },
        setTableName: (state, action: PayloadAction<string>) => {
            state.tableName = action.payload;
        },
        setDisplayLabel: (state, action: PayloadAction<string>) => {
            state.displayLabel = action.payload;
        },
        setColumns: (state, action: PayloadAction<TableColumn[]>) => {
            state.columns = action.payload;
        },
        addColumn: (state) => {
            state.columns.push({ name: '', type: 'varchar', visible: true });
        },
        updateColumn: (state, action: PayloadAction<{ index: number; field: string; value: any }>) => {
            const { index, field, value } = action.payload;
            if (state.columns[index]) {
                (state.columns[index] as any)[field] = value;
            }
        },
        removeColumn: (state, action: PayloadAction<number>) => {
            state.columns = state.columns.filter((_, i) => i !== action.payload);
        },
        setSelectedTemplateName: (state, action: PayloadAction<string | null>) => {
            state.selectedTemplateName = action.payload;
        },
        resetAddTableState: () => {
            return initialState;
        },
        resetManualForm: (state) => {
            state.tableName = '';
            state.displayLabel = '';
            state.columns = [{ name: 'id', type: 'uuid', isPrimaryKey: true, visible: true }];
        }
    }
});

export const {
    setMode, setSearchQuery, setApiUrl, setIsFetching, setTableName, setDisplayLabel,
    setColumns, addColumn, updateColumn, removeColumn, setSelectedTemplateName,
    resetAddTableState, resetManualForm
} = addTableSlice.actions;

export default addTableSlice.reducer;
