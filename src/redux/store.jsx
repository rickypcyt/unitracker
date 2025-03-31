import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import taskReducer from './TaskSlice';
import lapReducer from './LapSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    laps: lapReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});