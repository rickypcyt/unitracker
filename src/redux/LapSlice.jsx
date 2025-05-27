import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  laps: [],
  error: null,
  currentSession: null,
  status: 'idle',
  lastFetch: null,
  isCached: false
};

const lapSlice = createSlice({
  name: 'laps',
  initialState,
  reducers: {
    fetchLapsSuccess(state, action) {
      state.status = 'succeeded';
      state.laps = action.payload;
      state.error = null;
      state.lastFetch = Date.now();
      state.isCached = true;
    },
    addLapSuccess(state, action) {
      state.status = 'succeeded';
      state.laps.unshift(action.payload);
      state.isCached = true;
    },
    updateLapSuccess(state, action) {
      const index = state.laps.findIndex(lap => lap.id === action.payload.id);
      if (index !== -1) state.laps[index] = action.payload;
      state.isCached = true;
    },
    deleteLapSuccess(state, action) {
      state.laps = state.laps.filter(lap => lap.id !== action.payload);
      state.isCached = true;
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
    },
    invalidateCache(state) {
      state.isCached = false;
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
  lapError,
  invalidateCache
} = lapSlice.actions;

export default lapSlice.reducer;