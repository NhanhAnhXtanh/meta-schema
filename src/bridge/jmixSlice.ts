/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { EnvelopeV1 } from "./types";

const jmixSlice = createSlice({
  name: "jmix",
  initialState: {},
  reducers: {
    eventReceived: (_state, _action: PayloadAction<EnvelopeV1>) => {},
  },
});

export const { eventReceived } = jmixSlice.actions;
export default jmixSlice.reducer;

