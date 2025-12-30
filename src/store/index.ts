import { configureStore } from '@reduxjs/toolkit';
import undoable, { excludeAction } from 'redux-undo';
import schemaReducer from './slices/schemaSlice';
import uiReducer from './slices/uiSlice';

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
        }),
        ui: uiReducer,
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
