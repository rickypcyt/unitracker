// src/slices/taskSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tasks: [],
  error: null,
  lastFetch: null,
  isCached: false
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    fetchTasksSuccess: (state, action) => {
      state.tasks = action.payload;
      state.lastFetch = Date.now();
      state.isCached = true;
    },
    addTaskSuccess: (state, action) => {
      state.tasks.push(action.payload);
      state.isCached = true;
    },
    toggleTaskStatusOptimistic: (state, action) => {
      const task = state.tasks.find(t => t.id === action.payload.id);
      if (task) {
        task.completed = action.payload.completed;
        task.completed_at = action.payload.completed ? new Date().toISOString() : null;
      }
    },
    deleteTaskSuccess: (state, action) => {
      state.tasks = state.tasks.filter(t => t.id !== action.payload);
    },
    updateTaskSuccess: (state, action) => {
      const index = state.tasks.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    taskError: (state, action) => {
      state.error = action.payload;
    },
    invalidateCache: (state) => {
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