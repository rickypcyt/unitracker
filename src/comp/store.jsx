import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from './taskSlicer'; // Assuming you have a tasks slice

export const store = configureStore({
  reducer: {
    tasks: tasksReducer, // tasks slice reducer
  },
});
