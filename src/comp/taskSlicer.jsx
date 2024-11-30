// src/comp/Tasks.jsx o src/store/tasksSlice.js (preferiblemente tasksSlice.js)
import { createSlice } from '@reduxjs/toolkit';

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: [],
  reducers: {
    addTask: (state, action) => {
      state.push(action.payload);
    },
    toggleTaskCompletion: (state, action) => {
      const task = state.find((task) => task.id === action.payload);
      if (task) {
        task.completed = !task.completed;
      }
    },
    removeTask: (state, action) => {
      return state.filter((task) => task.id !== action.payload);
    },
  },
});

export const { addTask, toggleTaskCompletion, removeTask } = tasksSlice.actions;
export default tasksSlice.reducer;  // Asegúrate de exportar el reducer correctamente
