import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LinkFieldState {
    selectedTargetNodeId: string;
    selectedSourceKey: string;
    selectedTargetKey: string;
    newFieldName: string;
    linkType: '1-n' | 'n-1' | '1-1';
    searchQuery: string;
}

const initialState: LinkFieldState = {
    selectedTargetNodeId: '',
    selectedSourceKey: '',
    selectedTargetKey: '',
    newFieldName: '',
    linkType: '1-n',
    searchQuery: '',
};

const linkFieldSlice = createSlice({
    name: 'linkField',
    initialState,
    reducers: {
        setLinkFieldSelectedTargetNodeId: (state, action: PayloadAction<string>) => {
            state.selectedTargetNodeId = action.payload;
        },
        setLinkFieldSelectedSourceKey: (state, action: PayloadAction<string>) => {
            state.selectedSourceKey = action.payload;
        },
        setLinkFieldSelectedTargetKey: (state, action: PayloadAction<string>) => {
            state.selectedTargetKey = action.payload;
        },
        setLinkFieldNewFieldName: (state, action: PayloadAction<string>) => {
            state.newFieldName = action.payload;
        },
        setLinkFieldLinkType: (state, action: PayloadAction<'1-n' | 'n-1' | '1-1'>) => {
            state.linkType = action.payload;
        },
        setLinkFieldSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
        },
        resetLinkFieldState: (state) => {
            return initialState;
        },
        initializeLinkFieldState: (state, action: PayloadAction<Partial<LinkFieldState>>) => {
            return { ...state, ...action.payload };
        }
    },
});

export const {
    setLinkFieldSelectedTargetNodeId,
    setLinkFieldSelectedSourceKey,
    setLinkFieldSelectedTargetKey,
    setLinkFieldNewFieldName,
    setLinkFieldLinkType,
    setLinkFieldSearchQuery,
    resetLinkFieldState,
    initializeLinkFieldState
} = linkFieldSlice.actions;

export default linkFieldSlice.reducer;
