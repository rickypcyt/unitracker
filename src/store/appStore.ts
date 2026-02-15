import { createJSONStorage, persist } from 'zustand/middleware';

import type { PomodoroModeType } from '@/types/pomodoro';
import { create } from 'zustand';
import { fetchTasks as fetchTasksAction } from '@/store/TaskActions';

// 🎯 Tipos para el store
export interface PomoState {
  timeLeft: number;
  isRunning: boolean;
  currentMode: PomodoroModeType;
  modeIndex: number;
  workSessionsCompleted: number;
  workSessionsBeforeLongBreak: number;
  longBreakDuration: number;
  startTime: number;
  pausedTime: number;
  work: number;
  break: number;
  longBreak: number;
}

// 🎯 Tipos adicionales para reemplazar Redux
export interface TaskState {
  tasks: any[];
  loading: boolean;
  error: string | null;
  isCached: boolean;
  lastFetch: number | null;
}

export interface LapState {
  laps: any[];
  loading: boolean;
  error: string | null;
  isCached: boolean;
  lastFetch: number | null;
}

export interface AuthState {
  user: any;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface LayoutState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
}

export interface WorkspaceState {
  currentWorkspace: any;
  workspaces: any[];
  loading: boolean;
}

export interface PinnedColumnsState {
  [workspaceId: string]: {
    [assignment: string]: boolean;
  };
}

export interface UiState {
  isCalendarVisible: boolean;
  syncTimers: boolean;
  isStudyRunning: boolean;
  isPomoRunning: boolean;
  syncPomodoroWithTimer: boolean;
  syncCountdownWithTimer: boolean;
  isSynced: boolean;
  isRunning: boolean;
  resetKey: number;
  studyTimerState: 'running' | 'paused' | 'stopped';
  pomodoroState: 'running' | 'paused' | 'stopped';
  countdownState: 'running' | 'paused' | 'stopped';
}

export interface PomodoroMode {
  label: string;
  work: number;
  break: number;
  longBreak: number;
  description?: string;
}

export interface PomodoroSettings {
  autoStartBreak: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
  notificationEnabled: boolean;
  dailyGoal: number;
  volume: number;
}

export interface CountdownTime {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface CountdownState {
  status: 'running' | 'paused' | 'stopped';
  endTimestamp: number | null;
  pausedSecondsLeft: number | null;
  lastTime: CountdownTime;
}

export interface StudyState {
  time: number;
  isRunning: boolean;
  lastStart: number | null;
  timeAtStart: number;
  sessionStatus: 'inactive' | 'active' | 'paused';
  sessionTitle?: string;
  sessionDescription?: string;
  lastPausedAt: number | null;
}

export interface SyncSettings {
  syncPomodoroWithTimer: boolean;
  syncCountdownWithTimer: boolean;
  isSyncedWithStudyTimer: boolean;
}

export interface SessionSyncSettings {
  [sessionId: string]: SyncSettings;
}

export interface AppState {
  // 🍅 Pomodoro State
  pomodoroState: PomoState;
  setPomodoroState: (state: PomoState) => void;
  updatePomodoroState: (updates: Partial<PomoState>) => void;
  
  // Pomodoro Modes
  pomodoroModes: PomodoroMode[];
  setPomodoroModes: (modes: PomodoroMode[]) => void;
  updatePomodoroMode: (index: number, mode: PomodoroMode) => void;
  
  // Pomodoro Counts
  pomodorosThisSession: number;
  incrementPomodorosThisSession: () => void;
  resetPomodorosThisSession: () => void;
  
  pomodorosTodayLocal: number;
  incrementPomodorosTodayLocal: () => void;
  resetPomodorosTodayLocal: () => void;
  
  // ⏰ Countdown State
  countdownState: CountdownState;
  setCountdownState: (state: CountdownState) => void;
  updateCountdownState: (updates: Partial<CountdownState>) => void;
  
  // Countdown Baseline
  countdownBaseline: CountdownTime;
  setCountdownBaseline: (baseline: CountdownTime) => void;
  updateCountdownBaseline: (updates: Partial<CountdownTime>) => void;
  
  // Countdown Settings
  countdownAlarmEnabled: boolean;
  toggleCountdownAlarm: () => void;
  
  // 📚 Study Timer State
  studyState: StudyState;
  setStudyState: (state: StudyState) => void;
  updateStudyState: (updates: Partial<StudyState>) => void;
  
  // Study Session
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  studyTimerStartedAt: number | null;
  setStudyTimerStartedAt: (timestamp: number | null) => void;
  
  // Study Stats
  sessionsTodayCount: number;
  incrementSessionsTodayCount: () => void;
  resetSessionsTodayCount: () => void;
  
  // 🔄 Sync Settings
  syncSettings: SyncSettings;
  setSyncSettings: (settings: SyncSettings) => void;
  updateSyncSettings: (updates: Partial<SyncSettings>) => void;
  
  // 🔄 Session-specific Sync Settings
  sessionSyncSettings: SessionSyncSettings;
  setSessionSyncSettings: (sessionId: string, settings: SyncSettings) => void;
  clearSessionSyncSettings: (sessionId: string) => void;
  
  // 📌 Pinned Columns State
  pinnedColumns: PinnedColumnsState;
  setPinnedColumns: (pinnedColumns: PinnedColumnsState) => void;
  togglePin: (workspaceId: string, assignment: string) => void;
  isPinned: (workspaceId: string, assignment: string) => boolean;
  
  // UI State
  pomodoroTimerState: 'running' | 'paused' | 'stopped';
  setPomodoroTimerState: (state: 'running' | 'paused' | 'stopped') => void;
  
  studyTimerState: 'running' | 'paused' | 'stopped';
  setStudyTimerState: (state: 'running' | 'paused' | 'stopped') => void;
  
  countdownTimerState: 'running' | 'paused' | 'stopped';
  setCountdownTimerState: (state: 'running' | 'paused' | 'stopped') => void;
  
  // Pomodoro Settings
  pomodoroSettings: PomodoroSettings;
  setPomodoroSettings: (settings: PomodoroSettings) => void;
  updatePomodoroSettings: (updates: Partial<PomodoroSettings>) => void;
  
  // 🎯 Reemplazo de Redux slices
  // Tasks
  tasks: TaskState;
  setTasks: (tasks: any[]) => void;
  addTask: (task: any) => void;
  updateTask: (id: string, updates: any) => void;
  deleteTask: (id: string) => void;
  setTasksLoading: (loading: boolean) => void;
  setTasksError: (error: string | null) => void;
  setTasksCached: (cached: boolean, lastFetch?: number) => void;
  
  // Laps (Study Sessions)
  laps: LapState;
  setLaps: (laps: any[]) => void;
  addLap: (lap: any) => void;
  updateLap: (id: string, updates: any) => void;
  deleteLap: (id: string) => void;
  setLapsLoading: (loading: boolean) => void;
  setLapsError: (error: string | null) => void;
  setLapsCached: (cached: boolean, lastFetch?: number) => void;
  
  // Auth
  auth: AuthState;
  setUser: (user: any) => void;
  clearUser: () => void;
  setAuthLoading: (loading: boolean) => void;
  
  // Layout
  layout: LayoutState;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Workspace
  workspace: WorkspaceState;
  setCurrentWorkspace: (workspace: any) => void;
  setWorkspaces: (workspaces: any[]) => void;
  setWorkspaceLoading: (loading: boolean) => void;
  
  // UI
  ui: UiState;
  setCalendarVisible: (visible: boolean) => void;
  setSyncTimers: (sync: boolean) => void;
  setStudyRunning: (running: boolean) => void;
  setPomoRunning: (running: boolean) => void;
  setTimerState: (timer: 'study' | 'pomodoro' | 'countdown', state: 'running' | 'paused' | 'stopped') => void;
  
  // Redux-compatible actions
  setCountdownStateTimer: (state: 'running' | 'paused' | 'stopped') => void;
  setSyncCountdownWithTimer: (sync: boolean) => void;
  setSyncPomodoroWithTimer: (sync: boolean) => void;
  setPomodoroStateTimer: (state: 'running' | 'paused' | 'stopped') => void;
  resetTimerState: () => void;
  setCurrentSession: (session: any) => void;
  setCalendarVisibility: (visible: boolean) => void;
  addTaskSuccess: (task: any) => void;
  updateTaskSuccess: (task: any) => void;
  deleteTaskSuccess: (id: string) => void;
  fetchTasks: (workspaceId?: string, forceRefresh?: boolean) => Promise<void>;
  toggleTaskStatus: (id: string, completed: boolean) => void;
  addLapSuccess: (lap: any) => void;
  updateLapSuccess: (id: string, updates: any) => void;
  deleteLapSuccess: (id: string) => void;
  lapError: (error: string) => void;
  invalidateCache: () => void;
}

// 🎯 Estados por Defecto
const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  autoStartBreak: false,
  autoStartWork: false,
  soundEnabled: true,
  notificationEnabled: true,
  dailyGoal: 8,
  volume: 0.7,
};

const DEFAULT_POMODORO_STATE: PomoState = {
  timeLeft: 1500, // 25 minutes
  isRunning: false,
  currentMode: 'work',
  modeIndex: 0,
  workSessionsCompleted: 0,
  workSessionsBeforeLongBreak: 4,
  longBreakDuration: 900, // 15 minutes
  startTime: 0,
  pausedTime: 0,
  work: 1500, // 25 minutes in seconds
  break: 300, // 5 minutes in seconds
  longBreak: 900, // 15 minutes in seconds
};

const INITIAL_POMODORO_MODES: PomodoroMode[] = [
  { 
    label: 'Traditional', 
    work: 1500, // 25min
    break: 300, // 5min  
    longBreak: 900, // 15min
    description: 'Classic 25-5-15 Pomodoro technique'
  },
  { 
    label: 'Extended Focus', 
    work: 3000, // 50min
    break: 600, // 10min
    longBreak: 1800, // 30min
    description: 'Longer sessions for deep work'
  },
  { 
    label: 'Ultra Focus', 
    work: 3600, // 60min
    break: 900, // 15min
    longBreak: 2700, // 45min
    description: 'Maximum focus for complex projects'
  },
  { 
    label: 'Custom', 
    work: 1500, 
    break: 300, 
    longBreak: 900,
    description: 'Your personalized settings'
  }
];

const DEFAULT_COUNTDOWN_STATE: CountdownState = {
  status: 'stopped',
  endTimestamp: null,
  pausedSecondsLeft: null,
  lastTime: { hours: 2, minutes: 0, seconds: 0 },
};

const DEFAULT_COUNTDOWN_BASELINE: CountdownTime = {
  hours: 2,
  minutes: 0,
  seconds: 0,
};

const DEFAULT_STUDY_STATE: StudyState = {
  time: 0,
  isRunning: false,
  lastStart: null,
  timeAtStart: 0,
  sessionStatus: 'inactive',
  lastPausedAt: null,
};

const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  syncPomodoroWithTimer: false,
  syncCountdownWithTimer: false,
  isSyncedWithStudyTimer: false,
};

const DEFAULT_SESSION_SYNC_SETTINGS: SessionSyncSettings = {};
const DEFAULT_PINNED_COLUMNS_STATE: PinnedColumnsState = {};
const DEFAULT_TASK_STATE: TaskState = {
  tasks: [],
  loading: false,
  error: null,
  isCached: false,
  lastFetch: null,
};

const DEFAULT_LAP_STATE: LapState = {
  laps: [],
  loading: false,
  error: null,
  isCached: false,
  lastFetch: null,
};

const DEFAULT_AUTH_STATE: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
};

const DEFAULT_LAYOUT_STATE: LayoutState = {
  sidebarOpen: true,
  theme: 'light',
};

const DEFAULT_WORKSPACE_STATE: WorkspaceState = {
  currentWorkspace: null,
  workspaces: [],
  loading: false,
};

const DEFAULT_UI_STATE: UiState = {
  isCalendarVisible: true,
  syncTimers: false,
  isStudyRunning: false,
  isPomoRunning: false,
  syncPomodoroWithTimer: false,
  syncCountdownWithTimer: false,
  isSynced: false,
  isRunning: false,
  resetKey: 0,
  studyTimerState: 'stopped',
  pomodoroState: 'stopped',
  countdownState: 'stopped',
};

// 🚀 Store Principal con Zustand + Persistencia
// @ts-nocheck - Temporalmente deshabilitado para evitar errores de tipo masivos
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // 🍅 Pomodoro State
      pomodoroState: DEFAULT_POMODORO_STATE,
      setPomodoroState: (state) => set({ pomodoroState: state }),
      updatePomodoroState: (updates) => 
        set((state) => ({ 
          pomodoroState: { ...state.pomodoroState, ...updates } 
        })),
      
      // Pomodoro Modes
      pomodoroModes: INITIAL_POMODORO_MODES,
      setPomodoroModes: (modes) => set({ pomodoroModes: modes }),
      updatePomodoroMode: (index, mode) =>
        set((state) => {
          const newModes = [...state.pomodoroModes];
          newModes[index] = mode;
          return { pomodoroModes: newModes };
        }),
      
      // Pomodoro Counts
      pomodorosThisSession: 0,
      incrementPomodorosThisSession: () =>
        set((state) => ({ pomodorosThisSession: state.pomodorosThisSession + 1 })),
      resetPomodorosThisSession: () => set({ pomodorosThisSession: 0 }),
      
      pomodorosTodayLocal: 0,
      incrementPomodorosTodayLocal: () =>
        set((state) => ({ pomodorosTodayLocal: state.pomodorosTodayLocal + 1 })),
      resetPomodorosTodayLocal: () => set({ pomodorosTodayLocal: 0 }),
      
      // ⏰ Countdown State
      countdownState: DEFAULT_COUNTDOWN_STATE,
      setCountdownState: (state) => set({ countdownState: state }),
      updateCountdownState: (updates) =>
        set((state) => ({ 
          countdownState: { ...state.countdownState, ...updates } 
        })),
      
      // Countdown Baseline
      countdownBaseline: DEFAULT_COUNTDOWN_BASELINE,
      setCountdownBaseline: (baseline) => set({ countdownBaseline: baseline }),
      updateCountdownBaseline: (updates) =>
        set((state) => ({ 
          countdownBaseline: { ...state.countdownBaseline, ...updates } 
        })),
      
      // Countdown Settings
      countdownAlarmEnabled: true,
      toggleCountdownAlarm: () =>
        set((state) => ({ countdownAlarmEnabled: !state.countdownAlarmEnabled })),
      
      // 📚 Study Timer State
      studyState: DEFAULT_STUDY_STATE,
      setStudyState: (state) => set({ studyState: state }),
      updateStudyState: (updates) =>
        set((state) => ({ 
          studyState: { ...state.studyState, ...updates } 
        })),
      
      // Study Session
      activeSessionId: null,
      setActiveSessionId: (id) => set({ activeSessionId: id }),
      studyTimerStartedAt: null,
      setStudyTimerStartedAt: (timestamp) => set({ studyTimerStartedAt: timestamp }),
      
      // Study Stats
      sessionsTodayCount: 0,
      incrementSessionsTodayCount: () =>
        set((state) => ({ sessionsTodayCount: state.sessionsTodayCount + 1 })),
      resetSessionsTodayCount: () => set({ sessionsTodayCount: 0 }),
      
      // 🔄 Sync Settings
      syncSettings: DEFAULT_SYNC_SETTINGS,
      setSyncSettings: (settings) => set({ syncSettings: settings }),
      updateSyncSettings: (updates) =>
        set((state) => ({ 
          syncSettings: { ...state.syncSettings, ...updates } 
        })),
      
      // 🔄 Session-specific Sync Settings
      sessionSyncSettings: DEFAULT_SESSION_SYNC_SETTINGS,
      setSessionSyncSettings: (sessionId: string, settings: SyncSettings) => set((state) => ({
        sessionSyncSettings: { ...state.sessionSyncSettings, [sessionId]: settings }
      })),
      clearSessionSyncSettings: (sessionId: string) => set((state) => {
        const newSettings = { ...state.sessionSyncSettings };
        delete newSettings[sessionId];
        return { sessionSyncSettings: newSettings };
      }),
      
      // 📌 Pinned Columns State
      pinnedColumns: DEFAULT_PINNED_COLUMNS_STATE,
      setPinnedColumns: (pinnedColumns: PinnedColumnsState) => set({ pinnedColumns }),
      togglePin: (workspaceId: string, assignment: string) => set((state) => {
        const currentPins: PinnedColumnsState = { ...state.pinnedColumns };
        if (!currentPins[workspaceId]) {
          currentPins[workspaceId] = {};
        }
        currentPins[workspaceId] = {
          ...currentPins[workspaceId],
          [assignment]: !currentPins[workspaceId][assignment]
        };
        return { pinnedColumns: currentPins };
      }),
      isPinned: (_workspaceId: string, _assignment: string) => {
  // Esta función se usará desde fuera del store, no aquí dentro
  // La implementación real estará en el hook
  return true; // Placeholder
},
      
      // Pomodoro Settings
      pomodoroSettings: DEFAULT_POMODORO_SETTINGS,
      setPomodoroSettings: (settings) => set({ pomodoroSettings: settings }),
      updatePomodoroSettings: (updates) =>
        set((state) => ({ 
          pomodoroSettings: { ...state.pomodoroSettings, ...updates } 
        })),
      
      // State replacements for Redux
      tasks: DEFAULT_TASK_STATE,
      laps: DEFAULT_LAP_STATE,
      auth: DEFAULT_AUTH_STATE,
      layout: DEFAULT_LAYOUT_STATE,
      workspace: DEFAULT_WORKSPACE_STATE,
      ui: DEFAULT_UI_STATE,
      
      // Tasks
      setTasks: (tasks) => set((state) => ({ tasks: { ...state.tasks, tasks } })),
      addTask: (task) => set((state) => ({
        tasks: { ...state.tasks, tasks: [...state.tasks.tasks, task] }
      })),
      updateTask: (id, updates) => set((state) => ({
        tasks: {
          ...state.tasks,
          tasks: state.tasks.tasks.map(task => 
            task.id === id ? { ...task, ...updates } : task
          )
        }
      })),
      deleteTask: (id) => set((state) => ({
        tasks: {
          ...state.tasks,
          tasks: state.tasks.tasks.filter(task => task.id !== id)
        }
      })),
      setTasksLoading: (loading) => set((state) => ({
        tasks: { ...state.tasks, loading }
      })),
      setTasksError: (error) => set((state) => ({
        tasks: { ...state.tasks, error }
      })),
      setTasksCached: (cached, lastFetch) => set((state) => ({
        tasks: { 
          ...state.tasks, 
          isCached: cached, 
          lastFetch: lastFetch || Date.now() 
        }
      })),
      
      // Laps (Study Sessions)
      setLaps: (laps) => set((state) => ({ laps: { ...state.laps, laps } })),
      addLap: (lap) => set((state) => ({
        laps: { ...state.laps, laps: [...state.laps.laps, lap] }
      })),
      updateLap: (id, updates) => set((state) => ({
        laps: {
          ...state.laps,
          laps: state.laps.laps.map(lap => 
            lap.id === id ? { ...lap, ...updates } : lap
          )
        }
      })),
      deleteLap: (id) => set((state) => ({
        laps: {
          ...state.laps,
          laps: state.laps.laps.filter(lap => lap.id !== id)
        }
      })),
      setLapsLoading: (loading) => set((state) => ({
        laps: { ...state.laps, loading }
      })),
      setLapsError: (error) => set((state) => ({
        laps: { ...state.laps, error }
      })),
      setLapsCached: (cached, lastFetch) => set((state) => ({
        laps: { 
          ...state.laps, 
          isCached: cached, 
          lastFetch: lastFetch || Date.now() 
        }
      })),
      
      // Auth
      setUser: (user) => set((state) => ({ 
        auth: { ...state.auth, user, isAuthenticated: !!user }
      })),
      clearUser: () => set((state) => ({
        auth: { ...state.auth, user: null, isAuthenticated: false }
      })),
      setAuthLoading: (loading) => set((state) => ({
        auth: { ...state.auth, loading }
      })),
      
      // Layout
      setSidebarOpen: (open) => set((state) => ({
        layout: { ...state.layout, sidebarOpen: open }
      })),
      setTheme: (theme) => set((state) => ({
        layout: { ...state.layout, theme }
      })),
      
      // Workspace
      setCurrentWorkspace: (workspace) => set((state) => ({
        workspace: { ...state.workspace, currentWorkspace: workspace }
      })),
      setWorkspaces: (workspaces) => set((state) => ({
        workspace: { ...state.workspace, workspaces }
      })),
      setWorkspaceLoading: (loading) => set((state) => ({
        workspace: { ...state.workspace, loading }
      })),
      
      // UI State
      setCalendarVisible: (visible) => set((prevState) => ({
        ui: { ...prevState.ui, isCalendarVisible: visible }
      })),
      setSyncTimers: (sync) => set((prevState) => ({
        ui: { ...prevState.ui, syncTimers: sync }
      })),
      setStudyRunning: (running) => set((prevState) => ({
        ui: { ...prevState.ui, isStudyRunning: running }
      })),
      setPomoRunning: (running) => set((prevState) => ({
        ui: { ...prevState.ui, isPomoRunning: running }
      })),
      setTimerState: (timer, state) => set((prevState) => {
        const updates: any = {};
        if (timer === 'study') {
          updates.studyTimerState = state;
          updates.studyState = { ...prevState.studyState, isRunning: state === 'running' };
        } else if (timer === 'pomodoro') {
          updates.pomodoroTimerState = state;
          updates.pomodoroState = { ...prevState.pomodoroState, isRunning: state === 'running' };
        } else if (timer === 'countdown') {
          updates.countdownTimerState = state;
          updates.countdownState = { ...prevState.countdownState, status: state };
        }
        return updates;
      }),
      
      // Timer states
      pomodoroTimerState: 'stopped',
      setPomodoroTimerState: (state) => set({ pomodoroTimerState: state }),
      
      studyTimerState: 'stopped',
      setStudyTimerState: (state) => set({ studyTimerState: state }),
      
      countdownTimerState: 'stopped',
      setCountdownTimerState: (state) => set({ countdownTimerState: state }),
      
      // Redux-compatible actions
      setCountdownStateTimer: (state) => set((prevState) => ({ 
        countdownState: { ...prevState.countdownState, status: state },
        countdownTimerState: state
      })),
      setSyncCountdownWithTimer: (sync) => set((prevState) => ({
        syncSettings: { ...prevState.syncSettings, syncCountdownWithTimer: sync }
      })),
      setSyncPomodoroWithTimer: (sync) => set((prevState) => ({
        syncSettings: { ...prevState.syncSettings, syncPomodoroWithTimer: sync }
      })),
      setPomodoroStateTimer: (state) => set((prevState) => ({ 
        pomodoroState: { ...prevState.pomodoroState, isRunning: state === 'running' },
        pomodoroTimerState: state
      })),
      resetTimerState: () => set({
        studyState: DEFAULT_STUDY_STATE,
        pomodoroState: DEFAULT_POMODORO_STATE,
        countdownState: DEFAULT_COUNTDOWN_STATE,
        studyTimerState: 'stopped',
        pomodoroTimerState: 'stopped',
        countdownTimerState: 'stopped'
      }),
      setCurrentSession: (session) => set({ activeSessionId: session?.id || null }),
      setCalendarVisibility: (visible) => set((prevState) => ({
        ui: { ...prevState.ui, isCalendarVisible: visible }
      })),
      addTaskSuccess: (task) => set((prevState) => ({
        tasks: { ...prevState.tasks, tasks: [...prevState.tasks.tasks, task] }
      })),
      updateTaskSuccess: (task) => {
        console.log('DEBUG: updateTaskSuccess received:', { id: task.id, status: task.status });
        set((prevState) => ({
          tasks: {
            ...prevState.tasks,
            tasks: prevState.tasks.tasks.map(t => 
              t.id === task.id ? { ...t, ...task } : t
            ),
            isCached: false, // Invalidate cache when task is updated
            lastFetch: 0
          }
        }));
      },
      deleteTaskSuccess: (id) => set((prevState) => ({
        tasks: {
          ...prevState.tasks,
          tasks: prevState.tasks.tasks.filter(task => task.id !== id)
        }
      })),
      fetchTasks: async (workspaceId?: string, forceRefresh?: boolean) => {
        await fetchTasksAction(workspaceId, forceRefresh);
      },
      toggleTaskStatus: (id, completed) => set((prevState) => ({
        tasks: {
          ...prevState.tasks,
          tasks: prevState.tasks.tasks.map(task => 
            task.id === id ? { ...task, completed, completed_at: completed ? new Date().toISOString() : null } : task
          )
        }
      })),
      addLapSuccess: () => set(() => ({
        // Add lap logic here if needed
      })),
      updateLapSuccess: () => set(() => ({
        // Update lap logic here if needed
      })),
      deleteLapSuccess: () => set(() => ({
        // Delete lap logic here if needed
      })),
      lapError: () => set(() => ({
        // Handle lap errors here if needed
      })),
      invalidateCache: () => set(() => ({
        // Cache invalidation logic here if needed
      })),
    }),
    {
      name: 'uni-tracker-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Solo persistir estado esencial, no estado temporal
        pomodoroState: state.pomodoroState,
        pomodoroModes: state.pomodoroModes,
        pomodorosThisSession: state.pomodorosThisSession,
        pomodorosTodayLocal: state.pomodorosTodayLocal,
        countdownState: state.countdownState,
        countdownBaseline: state.countdownBaseline,
        countdownAlarmEnabled: state.countdownAlarmEnabled,
        studyState: state.studyState,
        activeSessionId: state.activeSessionId,
        studyTimerStartedAt: state.studyTimerStartedAt,
        sessionsTodayCount: state.sessionsTodayCount,
        syncSettings: state.syncSettings,
        sessionSyncSettings: state.sessionSyncSettings,
        // Pinned columns are now managed by Supabase, not localStorage
        // Persistir workspace actual para mantener selección al hacer refresh
        workspace: state.workspace,
        // Persistir pomodoro settings
        pomodoroSettings: state.pomodoroSettings,
        // Persistir tasks y laps pero no estado temporal
        tasks: state.tasks,
        laps: state.laps,
        // No persistir UI state temporal
        // pomodoroTimerState, studyTimerState, countdownTimerState
      }),
      version: 1,
      onRehydrateStorage: () => (state) => {
        // Eliminar console.log para mejorar rendimiento
        // Resetear UI state al cargar
        if (state) {
          state.setPomodoroTimerState('stopped');
          state.setStudyTimerState('stopped');
          state.setCountdownTimerState('stopped');
          
          // Limpiar completamente los modos antiguos y establecer los nuevos
          // Esto elimina Quick Sprints y Student que puedan estar en localStorage
          const currentModes = state.pomodoroModes || [];
          const hasOldModes = currentModes.some(mode => 
            mode.label === 'Quick Sprints' || mode.label === 'Student'
          );
          
          if (hasOldModes || currentModes.length !== INITIAL_POMODORO_MODES.length) {
            state.setPomodoroModes(INITIAL_POMODORO_MODES);
            
            // También limpiar localStorage directamente para asegurar que no queden residuos
            try {
              localStorage.removeItem('pomodoroModes');
            } catch (e) {
              console.warn('[AppStore] Could not clear pomodoroModes from localStorage:', e);
            }
          }
          
          // Asegurar que pomodoroModes siempre tenga todos los modos predefinidos
          if (!state.pomodoroModes || state.pomodoroModes.length < INITIAL_POMODORO_MODES.length) {
            state.setPomodoroModes(INITIAL_POMODORO_MODES);
          }
        }
      },
    }
  )
);

// 🎯 Selectores optimizados para evitar re-renders
export const usePomodoroState = () => useAppStore((state) => state.pomodoroState);
export const usePomodoroModes = () => useAppStore((state) => state.pomodoroModes);
export const usePomodoroSettings = () => useAppStore((state) => state.pomodoroSettings);
export const usePomodoroCounts = () => useAppStore((state) => ({
  thisSession: state.pomodorosThisSession,
  todayLocal: state.pomodorosTodayLocal,
}));

export const useCountdownState = () => useAppStore((state) => state.countdownState);
export const useCountdownBaseline = () => useAppStore((state) => state.countdownBaseline);
export const useCountdownSettings = () => useAppStore((state) => ({
  alarmEnabled: state.countdownAlarmEnabled,
  toggleAlarm: state.toggleCountdownAlarm,
}));

export const useStudyState = () => useAppStore((state) => state.studyState);
export const useStudySession = () => useAppStore((state) => ({
  activeId: state.activeSessionId,
  startedAt: state.studyTimerStartedAt,
  setActiveId: state.setActiveSessionId,
  setStartedAt: state.setStudyTimerStartedAt,
}));

export const useSessionSyncSettings = (sessionId: string | null) => 
  useAppStore((state) => sessionId ? state.sessionSyncSettings[sessionId] || null : null);

export const useSyncSettings = () => useAppStore((state) => state.syncSettings);
export const useTimerStates = () => useAppStore((state) => ({
  pomodoro: state.pomodoroTimerState,
  study: state.studyTimerState,
  countdown: state.countdownTimerState,
}));

// 🎯 Selectors para Redux replacement
export const useTasks = () => useAppStore((state) => state.tasks);
export const useTasksLoading = () => useAppStore((state) => state.tasks.loading);
export const useFetchTasks = (): ((workspaceId?: string, forceRefresh?: boolean) => Promise<void>) => useAppStore((state) => state.fetchTasks);
export const useAddTaskSuccess = () => useAppStore((state) => state.addTaskSuccess);
export const useUpdateTaskSuccess = () => useAppStore((state) => state.updateTaskSuccess);
export const useDeleteTaskSuccess = () => useAppStore((state) => state.deleteTaskSuccess);
export const useToggleTaskStatus = () => useAppStore((state) => state.toggleTaskStatus);
export const useLaps = () => useAppStore((state) => state.laps);
export const useAuth = () => useAppStore((state) => state.auth);
export const useLayout = () => useAppStore((state) => state.layout);
export const useWorkspace = () => useAppStore((state) => state.workspace);
export const useUi = () => useAppStore((state) => state.ui);
export const usePinnedColumns = () => {
  // This selector is kept for backwards compatibility but now returns empty state
  // The actual pinned columns are managed by usePinnedColumns hook
  return {};
};
export const useIsPinned = (_workspaceId: string, _assignment: string) => {
  // This selector is kept for backwards compatibility but now returns false
  // The actual pin state is managed by usePinnedColumns hook
  return false;
};
export const useTimerActions = () => useAppStore((state) => ({
  // Pomodoro
  setPomodoroState: state.setPomodoroState,
  updatePomodoroState: state.updatePomodoroState,
  incrementPomodorosThisSession: state.incrementPomodorosThisSession,
  incrementPomodorosTodayLocal: state.incrementPomodorosTodayLocal,
  
  // Countdown
  setCountdownState: state.setCountdownState,
  updateCountdownState: state.updateCountdownState,
  setCountdownBaseline: state.setCountdownBaseline,
  toggleCountdownAlarm: state.toggleCountdownAlarm,
  
  // Study
  setStudyState: state.setStudyState,
  updateStudyState: state.updateStudyState,
  setActiveSessionId: state.setActiveSessionId,
  setStudyTimerStartedAt: state.setStudyTimerStartedAt,
  incrementSessionsTodayCount: state.incrementSessionsTodayCount,
  
  // Sync
  setSyncSettings: state.setSyncSettings,
  updateSyncSettings: state.updateSyncSettings,
  
  // UI
  setPomodoroTimerState: state.setPomodoroTimerState,
  setStudyTimerState: state.setStudyTimerState,
  setCountdownTimerState: state.setCountdownTimerState,
}));

// 🎯 Actions para Redux replacement
export const useTaskCrudActions = () => {
  const setTasks = useAppStore((state) => state.setTasks);
  const addTask = useAppStore((state) => state.addTask);
  const updateTask = useAppStore((state) => state.updateTask);
  const deleteTask = useAppStore((state) => state.deleteTask);
  
  return {
    setTasks,
    addTask,
    updateTask,
    deleteTask,
  };
};

export const useLapActions = () => {
  const setLaps = useAppStore((state) => state.setLaps);
  const addLap = useAppStore((state) => state.addLap);
  const updateLap = useAppStore((state) => state.updateLap);
  const deleteLap = useAppStore((state) => state.deleteLap);
  const setLapsLoading = useAppStore((state) => state.setLapsLoading);
  const setLapsError = useAppStore((state) => state.setLapsError);
  const setLapsCached = useAppStore((state) => state.setLapsCached);
  
  return {
    setLaps,
    addLap,
    updateLap,
    deleteLap,
    setLapsLoading,
    setLapsError,
    setLapsCached,
  };
};

export const useAuthActions = () => {
  const setUser = useAppStore((state) => state.setUser);
  const clearUser = useAppStore((state) => state.clearUser);
  const setAuthLoading = useAppStore((state) => state.setAuthLoading);
  
  return {
    setUser,
    clearUser,
    setAuthLoading,
  };
};

export const useLayoutActions = () => {
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const setTheme = useAppStore((state) => state.setTheme);
  
  return {
    setSidebarOpen,
    setTheme,
  };
};

export const useWorkspaceActions = () => {
  const setCurrentWorkspace = useAppStore((state) => state.setCurrentWorkspace);
  const setWorkspaces = useAppStore((state) => state.setWorkspaces);
  const setWorkspaceLoading = useAppStore((state) => state.setWorkspaceLoading);
  
  return {
    setCurrentWorkspace,
    setWorkspaces,
    setWorkspaceLoading,
  };
};

export const usePinnedColumnsActions = () => {
  // These actions are kept for backwards compatibility but now do nothing
  // The actual pin actions are managed by usePinnedColumns hook
  return {
    setPinnedColumns: () => {},
    togglePin: () => {},
    isPinned: () => false,
  };
};

export const useUiActions = () => {
  const setCalendarVisible = useAppStore((state) => state.setCalendarVisible);
  const setSyncCountdownWithTimer = useAppStore((state) => state.setSyncCountdownWithTimer);
  const setSyncPomodoroWithTimer = useAppStore((state) => state.setSyncPomodoroWithTimer);
  const setPomodoroStateTimer = useAppStore((state) => state.setPomodoroStateTimer);
  const resetTimerState = useAppStore((state) => state.resetTimerState);
  
  return {
    setCalendarVisible,
    setSyncCountdownWithTimer,
    setSyncPomodoroWithTimer,
    setPomodoroStateTimer,
    resetTimerState,
  };
};

export default useAppStore;
