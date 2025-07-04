import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { Task } from '@/utils/taskStorage';

interface TaskState {
  tasks: Task[];
  error: string | null;
  lastFetch: number | null;
  isCached: boolean;
  loading: boolean;
}

const initialState: TaskState = {
  tasks: [],
  error: null,
  lastFetch: null,
  isCached: false,
  loading: false
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    hydrateTasksFromLocalStorage: (state) => {
      try {
        const local = localStorage.getItem('tasksHydrated');
        if (local) {
          state.tasks = JSON.parse(local);
        }
      } catch (e) {
        // ignore
      }
    },
    fetchTasksStart: (state) => {
      state.loading = true;
    },
    fetchTasksSuccess: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
      state.isCached = true;
      state.lastFetch = Date.now();
      state.loading = false;
    },
    addTaskSuccess: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
    },
    toggleTaskStatusOptimistic: (state, action: PayloadAction<{ id: string; completed: boolean }>) => {
      const task = state.tasks.find(t => t.id === action.payload.id);
      if (task) {
        const newStatus = action.payload.completed ? 'completed' : 'not completed';
        task.completed = action.payload.completed;
        task.completed_at = action.payload.completed ? new Date().toISOString() : null;
      }
    },
    deleteTaskSuccess: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(t => t.id !== action.payload);
    },
    updateTaskSuccess: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    taskError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    invalidateCache: (state) => {
      state.isCached = false;
    }
  }
});

export const {
  hydrateTasksFromLocalStorage,
  fetchTasksStart,
  fetchTasksSuccess,
  addTaskSuccess,
  toggleTaskStatusOptimistic,
  deleteTaskSuccess,
  updateTaskSuccess,
  taskError,
  invalidateCache
} = taskSlice.actions;

export default taskSlice.reducer; 