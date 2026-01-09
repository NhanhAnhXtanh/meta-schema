import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LinkFieldState {
    targetType: 'existing' | 'template';
    selectedTargetNodeId: string;
    selectedTemplateId: string;
    selectedSourceKey: string;
    selectedTargetKey: string;
    newFieldName: string;
    linkType: '1-n' | 'n-1' | '1-1';
    searchQuery: string;
}

const initialState: LinkFieldState = {
    targetType: 'template',
    selectedTargetNodeId: '',
    selectedTemplateId: '',
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
        setLinkFieldTargetType: (state, action: PayloadAction<'existing' | 'template'>) => {
            state.targetType = action.payload;
        },
        setLinkFieldSelectedTargetNodeId: (state, action: PayloadAction<string>) => {
            state.selectedTargetNodeId = action.payload;
        },
        setLinkFieldSelectedTemplateId: (state, action: PayloadAction<string>) => {
            state.selectedTemplateId = action.payload;
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
        resetLinkFieldState: (state) => { // Keep initial values if needed or reset to default
            return initialState;
        },
        initializeLinkFieldState: (state, action: PayloadAction<Partial<LinkFieldState>>) => {
            return { ...state, ...action.payload };
        }

    },
});

export const {
    setLinkFieldTargetType,
    setLinkFieldSelectedTargetNodeId,
    setLinkFieldSelectedTemplateId,
    setLinkFieldSelectedSourceKey,
    setLinkFieldSelectedTargetKey,
    setLinkFieldNewFieldName,
    setLinkFieldLinkType,
    setLinkFieldSearchQuery,
    resetLinkFieldState,
    initializeLinkFieldState
} = linkFieldSlice.actions;

export default linkFieldSlice.reducer;
