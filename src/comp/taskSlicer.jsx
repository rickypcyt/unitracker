// src/redux/tasksSlice.js
import { createSlice } from '@reduxjs/toolkit';

export const tasksSlice = createSlice({
  name: 'tasks',
  initialState: [
    // Example tasks (adjust based on your actual data structure)
    { title: 'Task 1', deadline: '2024-12-05' },
    { title: 'Task 2', deadline: '2024-12-10' },
    { title: 'Task 3', deadline: '2024-12-15' },
  ],
  reducers: {
    addTask: (state, action) => {
      state.push(action.payload);
    },
    removeTask: (state, action) => {
      return state.filter((task) => task.id !== action.payload);
    },
  },
});

export const { addTask, removeTask } = tasksSlice.actions;

export default tasksSlice.reducer;
