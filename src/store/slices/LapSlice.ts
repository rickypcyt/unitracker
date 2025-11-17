import type { PayloadAction} from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

export interface Lap {
  id: string;
  user_id: string;
  name: string | null;
  description: string | null;
  duration: string;
  session_number: number;
  created_at: string;
  started_at: string;
  ended_at: string | null;
  tasks_completed: number;
  pomodoros_completed: number;
  session_assignment: string | null;
  updated_at?: string;
  
  // Campos adicionales que pueden estar presentes
  type?: string;
  subject_id?: string;
  subject_name?: string;
  subject_color?: string;
  
  // Campos para compatibilidad con versiones anteriores
  start_time?: string;
  end_time?: string;
  task_id?: string;
  
  // Cualquier otro campo adicional que pueda existir
  [key: string]: any;
}

interface CurrentSession {
  startTime: string;
  taskId?: string;
}

type LapStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface LapState {
  laps: Lap[];
  error: string | null;
  currentSession: CurrentSession | null;
  status: LapStatus;
  lastFetch: number | null;
  isCached: boolean;
}

const initialState: LapState = {
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
    hydrateLapsFromLocalStorage: (state) => {
      try {
        const local = localStorage.getItem('lapsHydrated');
        if (local) {
          state.laps = JSON.parse(local);
          state.isCached = true;
          state.lastFetch = Date.now();
        }
      } catch {
        // ignore
      }
    },
    fetchLapsSuccess(state, action: PayloadAction<Lap[]>) {
      state.laps = action.payload;
      state.isCached = true;
      state.lastFetch = Date.now();
      // Save to localStorage
      localStorage.setItem('lapsHydrated', JSON.stringify(action.payload));
    },
    addLapSuccess(state, action: PayloadAction<Lap>) {
      state.laps.push(action.payload);
      // Update localStorage
      localStorage.setItem('lapsHydrated', JSON.stringify(state.laps));
    },
    updateLapSuccess(state, action: PayloadAction<Lap>) {
      const index = state.laps.findIndex((l) => l.id === action.payload.id);
      if (index !== -1) {
        state.laps[index] = action.payload;
        // Update localStorage
        localStorage.setItem('lapsHydrated', JSON.stringify(state.laps));
      }
    },
    deleteLapSuccess(state, action: PayloadAction<string>) {
      state.laps = state.laps.filter((l) => l.id !== action.payload);
      // Update localStorage
      localStorage.setItem('lapsHydrated', JSON.stringify(state.laps));
    },
    setCurrentSession(state, action: PayloadAction<CurrentSession | null>) {
      state.currentSession = action.payload;
    },
    resetTimerState(state) {
      state.currentSession = null;
    },
    lapError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    invalidateCache(state) {
      state.isCached = false;
    }
  }
});

export const {
  hydrateLapsFromLocalStorage,
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