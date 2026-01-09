import { configureStore, Reducer, UnknownAction } from '@reduxjs/toolkit';
import undoable, { excludeAction, StateWithHistory } from 'redux-undo';
import schemaReducer, { SchemaState } from './slices/schemaSlice';
import uiReducer from './slices/uiSlice';
import addTableReducer from './slices/addTableSlice';
import exportReducer from './slices/exportSlice';
import jsonImportReducer from './slices/jsonImportSlice';
import sidebarReducer from './slices/sidebarSlice';
import linkFieldReducer from './slices/linkFieldSlice';

export const store = configureStore({
    reducer: {
        schema: undoable(schemaReducer, {
            limit: 50,
            filter: excludeAction([
                'schema/onNodesChange',
                'schema/onEdgesChange',
                'schema/setNodes',
                'schema/setEdges'
            ])
        }) as Reducer<StateWithHistory<SchemaState>, UnknownAction>,
        ui: uiReducer,
        addTable: addTableReducer,
        export: exportReducer,
        jsonImport: jsonImportReducer,
        sidebar: sidebarReducer,
        linkField: linkFieldReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['schema/onNodesChange', 'schema/onEdgesChange'],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

declare module 'react-redux' {
    interface DefaultRootState extends RootState { }
}
