import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface UiState {
  isCalendarVisible: boolean;
  syncTimers: boolean;
  isStudyRunning: boolean;
  isPomoRunning: boolean;
  syncPomodoroWithTimer: boolean;
  syncCountdownWithTimer: boolean;
}

const initialState: UiState = {
  isCalendarVisible: true,
  syncTimers: false,
  isStudyRunning: false,
  isPomoRunning: false,
  syncPomodoroWithTimer: localStorage.getItem('syncPomodoroWithTimer') === 'true',
  syncCountdownWithTimer: localStorage.getItem('syncCountdownWithTimer') === 'true',
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
    },
    setSyncPomodoroWithTimer: (state, action: PayloadAction<boolean>) => {
      state.syncPomodoroWithTimer = action.payload;
      localStorage.setItem('syncPomodoroWithTimer', action.payload ? 'true' : 'false');
    },
    setSyncCountdownWithTimer: (state, action: PayloadAction<boolean>) => {
      state.syncCountdownWithTimer = action.payload;
      localStorage.setItem('syncCountdownWithTimer', action.payload ? 'true' : 'false');
    },
  }
});

export const { setCalendarVisibility, toggleSyncTimers, setStudyRunning, setPomoRunning, setSyncPomodoroWithTimer, setSyncCountdownWithTimer } = uiSlice.actions;
export default uiSlice.reducer; 