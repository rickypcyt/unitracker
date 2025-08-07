import type { PayloadAction} from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

interface UiState {
  isCalendarVisible: boolean;
  syncTimers: boolean;
  isStudyRunning: boolean;
  isPomoRunning: boolean;
  syncPomodoroWithTimer: boolean;
  syncCountdownWithTimer: boolean;
  // Estados globales para sincronización
  isSynced: boolean;
  isRunning: boolean;
  resetKey: number;
  // Estados individuales de timers
  studyTimerState: 'running' | 'paused' | 'stopped';
  pomodoroState: 'running' | 'paused' | 'stopped';
  countdownState: 'running' | 'paused' | 'stopped';
}

const initialState: UiState = {
  isCalendarVisible: true,
  syncTimers: false,
  isStudyRunning: false,
  isPomoRunning: false,
  syncPomodoroWithTimer: localStorage.getItem('syncPomodoroWithTimer') === 'true',
  syncCountdownWithTimer: localStorage.getItem('syncCountdownWithTimer') === 'true',
  // Estados globales para sincronización
  isSynced: false,
  isRunning: false,
  resetKey: 0,
  // Estados individuales de timers
  studyTimerState: 'stopped',
  pomodoroState: 'stopped',
  countdownState: 'stopped',
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
    // Acciones para sincronización global
    setIsSynced: (state, action: PayloadAction<boolean>) => {
      state.isSynced = action.payload;
    },
    setIsRunning: (state, action: PayloadAction<boolean>) => {
      state.isRunning = action.payload;
    },
    setResetKey: (state, action: PayloadAction<number>) => {
      state.resetKey = action.payload;
    },
    triggerReset: (state) => {
      state.resetKey = Date.now();
    },
    // Acciones para estados individuales de timers
    setStudyTimerState: (state, action: PayloadAction<'running' | 'paused' | 'stopped'>) => {
      state.studyTimerState = action.payload;
    },
    setPomodoroState: (state, action: PayloadAction<'running' | 'paused' | 'stopped'>) => {
      state.pomodoroState = action.payload;
    },
    setCountdownState: (state, action: PayloadAction<'running' | 'paused' | 'stopped'>) => {
      state.countdownState = action.payload;
    },
  }
});

export const { 
  setCalendarVisibility, 
  toggleSyncTimers, 
  setStudyRunning, 
  setPomoRunning, 
  setSyncPomodoroWithTimer, 
  setSyncCountdownWithTimer,
  setIsSynced,
  setIsRunning,
  setResetKey,
  triggerReset,
  setStudyTimerState,
  setPomodoroState,
  setCountdownState
} = uiSlice.actions;
export default uiSlice.reducer; 