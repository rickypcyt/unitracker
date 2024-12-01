// src/store/store.js

// Import the configureStore function from @reduxjs/toolkit
import { configureStore } from '@reduxjs/toolkit';

// Import the taskReducer from the TaskReducer file
import taskReducer from './TaskReducer';

// Configure the Redux store using the configureStore function
const store = configureStore({
  // Define the reducers for the store
  reducer: {
    // Map the taskReducer to the 'tasks' slice of the state
    tasks: taskReducer,
  },
});

// Export the configured store
export { store }; // Ensure to export the store correctly
