import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface UiState {
  isCalendarVisible: boolean;
  syncTimers: boolean;
  isStudyRunning: boolean;
  isPomoRunning: boolean;
}

const initialState: UiState = {
  isCalendarVisible: true,
  syncTimers: false,
  isStudyRunning: false,
  isPomoRunning: false
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCalendarVisibility: (state, action: PayloadAction<boolean>) => {
      state.isCalendarVisible = action.payload;
    },
    toggleSyncTimers: (state) => {
      state.syncTimers = !state.syncTimers;
    },
    setStudyRunning: (state, action: PayloadAction<boolean>) => {
      state.isStudyRunning = action.payload;
    },
    setPomoRunning: (state, action: PayloadAction<boolean>) => {
      state.isPomoRunning = action.payload;
    }
  }
});

export const { setCalendarVisibility, toggleSyncTimers, setStudyRunning, setPomoRunning } = uiSlice.actions;
export default uiSlice.reducer; 