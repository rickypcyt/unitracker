// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import taskReducer from './TaskSlice';

const store = configureStore({
  reducer: {
    tasks: taskReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true, // Habilita Redux Thunk
    }),
});

export { store };