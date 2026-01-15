import { createSlice, PayloadAction } from "@reduxjs/toolkit";



type ListState = {
  loading: boolean;
  data: string;
  lastError?: string;
  lastUpdatedAt?: number;
};

const initialState: ListState = {
  loading: false,
  data: '',
};

const listSlice = createSlice({
  name: "list",
  initialState,
  reducers: {
    listPageRequested(state) {
      state.loading = true;
      state.lastError = undefined;
    },
    listPageReceived(state, action: PayloadAction<any>) {
      state.loading = false;
      state.data = action.payload;
      state.lastUpdatedAt = Date.now();
    },
    listFailed(state, action: PayloadAction<string>) {
      state.loading = false;
      state.lastError = action.payload;
    },
  },
});

export const { listPageRequested, listPageReceived, listFailed } = listSlice.actions;
export default listSlice.reducer;
