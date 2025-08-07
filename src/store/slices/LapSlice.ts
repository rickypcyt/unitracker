import type { PayloadAction} from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

interface Lap {
  id: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  task_id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
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
    fetchLapsSuccess(state, action: PayloadAction<Lap[]>) {
      state.laps = action.payload;
      state.isCached = true;
      state.lastFetch = Date.now();
    },
    addLapSuccess(state, action: PayloadAction<Lap>) {
      state.laps.push(action.payload);
    },
    updateLapSuccess(state, action: PayloadAction<Lap>) {
      const index = state.laps.findIndex((l) => l.id === action.payload.id);
      if (index !== -1) {
        state.laps[index] = action.payload;
      }
    },
    deleteLapSuccess(state, action: PayloadAction<string>) {
      state.laps = state.laps.filter((l) => l.id !== action.payload);
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