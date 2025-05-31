import assignmentReducer from "./slices/AssignmentSlice";
import authReducer from "./slices/authSlice";
import { configureStore } from "@reduxjs/toolkit";
import { createErrorMiddleware } from './middleware/errorMiddleware';
import lapReducer from "./slices/LapSlice";
import layoutReducer from "./slices/layoutSlice";
import taskReducer from "./slices/TaskSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        tasks: taskReducer,
        laps: lapReducer,
        ui: uiReducer,
        layout: layoutReducer,
        assignments: assignmentReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
            thunk: true
        }).concat(createErrorMiddleware({
            maxRetries: 3,
            retryDelay: 1000
        })),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 