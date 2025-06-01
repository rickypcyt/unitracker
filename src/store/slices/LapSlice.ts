import { PayloadAction, createSlice } from '@reduxjs/toolkit';

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

const formatDuration = (duration: number): string => {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}m ${seconds}s`;
};

const lapSlice = createSlice({
  name: 'laps',
  initialState,
  reducers: {
    fetchLapsSuccess(state, action: PayloadAction<Lap[]>) {
      console.log(`[Laps] Fetched ${action.payload.length} laps from database`);
      state.status = 'succeeded';
      state.laps = action.payload;
      state.error = null;
      state.lastFetch = Date.now();
      state.isCached = true;
    },
    addLapSuccess(state, action: PayloadAction<Lap>) {
      const duration = action.payload.duration ? formatDuration(action.payload.duration) : 'ongoing';
      console.log(`[Laps] Added new lap: Started at ${new Date(action.payload.start_time).toLocaleTimeString()}, Duration: ${duration}`);
      state.status = 'succeeded';
      state.laps.unshift(action.payload);
      state.isCached = true;
    },
    updateLapSuccess(state, action: PayloadAction<Lap>) {
      const index = state.laps.findIndex(lap => lap.id === action.payload.id);
      if (index !== -1) {
        const oldLap = state.laps[index];
        const duration = action.payload.duration ? formatDuration(action.payload.duration) : 'ongoing';
        console.log(`[Laps] Updated lap: ID ${action.payload.id}, New duration: ${duration}`);
        state.laps[index] = action.payload;
        state.isCached = true;
      }
    },
    deleteLapSuccess(state, action: PayloadAction<string>) {
      const lapToDelete = state.laps.find(lap => lap.id === action.payload);
      if (lapToDelete) {
        console.log(`[Laps] Deleted lap: Started at ${new Date(lapToDelete.start_time).toLocaleTimeString()}`);
      }
      state.laps = state.laps.filter(lap => lap.id !== action.payload);
      state.isCached = true;
    },
    setCurrentSession(state, action: PayloadAction<CurrentSession | null>) {
      if (action.payload) {
        console.log(`[Laps] Started new session at ${new Date(action.payload.startTime).toLocaleTimeString()}`);
      } else {
        console.log('[Laps] Session ended');
      }
      state.currentSession = action.payload;
    },
    resetTimerState(state) {
      console.log('[Laps] Timer state reset');
      state.currentSession = null;
    },
    lapError(state, action: PayloadAction<string>) {
      console.error(`[Laps] Error: ${action.payload}`);
      state.status = 'failed';
      state.error = action.payload;
    },
    invalidateCache(state) {
      console.log('[Laps] Cache invalidated, will fetch fresh data on next request');
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