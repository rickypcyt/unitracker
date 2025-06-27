import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { Task } from '@/utils/taskStorage';

interface TaskState {
  tasks: Task[];
  error: string | null;
  lastFetch: number | null;
  isCached: boolean;
}

const initialState: TaskState = {
  tasks: [],
  error: null,
  lastFetch: null,
  isCached: false
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    fetchTasksSuccess: (state, action: PayloadAction<Task[]>) => {
      console.log(`[Tasks] Fetched ${action.payload.length} tasks from database`);
      state.tasks = action.payload;
      state.lastFetch = Date.now();
      state.isCached = true;
    },
    addTaskSuccess: (state, action: PayloadAction<Task>) => {
      console.log(`[Tasks] Added new task: "${action.payload.title}" (ID: ${action.payload.id})`);
      state.tasks.push(action.payload);
      state.isCached = true;
    },
    toggleTaskStatusOptimistic: (state, action: PayloadAction<{ id: string; completed: boolean }>) => {
      const task = state.tasks.find(t => t.id === action.payload.id);
      if (task) {
        const newStatus = action.payload.completed ? 'completed' : 'pending';
        console.log(`[Tasks] Task "${task.title}" marked as ${newStatus}`);
        task.completed = action.payload.completed;
        task.completed_at = action.payload.completed ? new Date().toISOString() : null;
      }
    },
    deleteTaskSuccess: (state, action: PayloadAction<string>) => {
      const taskToDelete = state.tasks.find(t => t.id === action.payload);
      if (taskToDelete) {
        console.log(`[Tasks] Deleted task: "${taskToDelete.title}" (ID: ${action.payload})`);
      }
      state.tasks = state.tasks.filter(t => t.id !== action.payload);
    },
    updateTaskSuccess: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        const oldTask = state.tasks[index];
        console.log(`[Tasks] Updated task: "${oldTask.title}" -> "${action.payload.title}" (ID: ${action.payload.id})`);
        state.tasks[index] = action.payload;
      }
    },
    taskError: (state, action: PayloadAction<string>) => {
      console.error(`[Tasks] Error: ${action.payload}`);
      state.error = action.payload;
    },
    invalidateCache: (state) => {
      console.log('[Tasks] Cache invalidated, will fetch fresh data on next request');
      state.isCached = false;
    }
  }
});

export const {
  fetchTasksSuccess,
  addTaskSuccess,
  toggleTaskStatusOptimistic,
  deleteTaskSuccess,
  updateTaskSuccess,
  taskError,
  invalidateCache
} = taskSlice.actions;

export default taskSlice.reducer; 