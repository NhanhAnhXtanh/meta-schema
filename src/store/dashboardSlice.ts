import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type DashboardState = {
  loading: boolean;
  data: string;
  lastError?: string;
  lastUpdatedAt?: number;
};

const initialState: DashboardState = {
  loading: false,
  data: '',
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    dashboardRequested(state) {
      state.loading = true;
      state.lastError = undefined;
    },
    dashboardReceived(state, action: PayloadAction<any>) {
      state.loading = false;
      state.data = action.payload;
      state.lastUpdatedAt = Date.now();
    },
    dashboardFailed(state, action: PayloadAction<string>) {
      state.loading = false;
      state.lastError = action.payload;
    },
  },
});

export const { dashboardRequested, dashboardReceived, dashboardFailed } = dashboardSlice.actions;
export default dashboardSlice.reducer;
