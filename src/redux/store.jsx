import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import taskReducer from './TaskSlice';
import lapReducer from './LapSlice';
import uiReducer from './uiSlice';
import layoutReducer from './layoutSlice';
import themeReducer from './themeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    laps: lapReducer,
    ui: uiReducer,
    layout: layoutReducer,
    theme: themeReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});