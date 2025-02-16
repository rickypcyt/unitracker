// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import taskReducer from './TaskSlice'; // Updated import path

const store = configureStore({
  reducer: {
    tasks: taskReducer, // Now uses the reducer from taskSlice
  },
});

export { store };