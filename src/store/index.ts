import { configureStore, Reducer, UnknownAction } from "@reduxjs/toolkit";
import dashboardReducer from "./dashboardSlice";
import listReducer from "./listSlice";
import jmixReducer from "../bridge/jmixSlice";
import { jmixMiddlewares } from "../bridge/middleware";
import undoable, { excludeAction, StateWithHistory } from "redux-undo";


import linkFieldReducer from './slices/linkFieldSlice';

export const store = configureStore({
  reducer: {
    jmix: jmixReducer,
    linkField: linkFieldReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(...jmixMiddlewares),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
