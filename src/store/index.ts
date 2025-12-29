import { configureStore } from '@reduxjs/toolkit';
import schemaReducer from './slices/schemaSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
    reducer: {
        schema: schemaReducer,
        ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these paths in the state for serializability check
                // React Flow nodes/edges might contain non-serializable data if we aren't careful, 
                // but typically they are fine. Just a safeguard if we store functions in data.
                ignoredActions: ['schema/onNodesChange', 'schema/onEdgesChange'],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
