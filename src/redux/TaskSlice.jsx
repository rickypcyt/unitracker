// src/slices/taskSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tasks: [],
  error: null,
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    fetchTasksSuccess: (state, action) => {
      state.tasks = action.payload;
    },
    addTaskSuccess: (state, action) => {
      state.tasks.push(action.payload);
    },
    toggleTaskStatusOptimistic: (state, action) => {
      const task = state.tasks.find(t => t.id === action.payload.id);
      if (task) {
        task.completed = action.payload.completed;
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
    }
  }
});

export const {
  fetchTasksSuccess,
  addTaskSuccess,
  toggleTaskStatusOptimistic,
  deleteTaskSuccess,
  updateTaskSuccess,
  taskError
} = taskSlice.actions;

export default taskSlice.reducer;