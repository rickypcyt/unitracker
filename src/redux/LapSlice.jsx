import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  laps: [],
  error: null,
  currentSession: null,
  status: 'idle'
};

const lapSlice = createSlice({
  name: 'laps',
  initialState,
  reducers: {
    fetchLapsSuccess(state, action) {
      state.status = 'succeeded';
      state.laps = action.payload;
      state.error = null;
    },
    addLapSuccess(state, action) {
      state.status = 'succeeded';
      state.laps.unshift(action.payload);
    },
    updateLapSuccess(state, action) {
      const index = state.laps.findIndex(lap => lap.id === action.payload.id);
      if (index !== -1) state.laps[index] = action.payload;
    },
    deleteLapSuccess(state, action) {
      state.laps = state.laps.filter(lap => lap.id !== action.payload);
    },
    setCurrentSession(state, action) {
      state.currentSession = action.payload;
    },
    resetTimerState(state) {
      state.currentSession = null;
    },
    lapError(state, action) {
      state.status = 'failed';
      state.error = action.payload;
    }
  }
});

export const {
  fetchLapsSuccess,
  addLapSuccess,
  updateLapSuccess,
  deleteLapSuccess,
  setCurrentSession,
  resetTimerState,
  lapError
} = lapSlice.actions;

export default lapSlice.reducer;