import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import taskReducer from './TaskSlice';
import lapReducer from './LapSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    laps: lapReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});