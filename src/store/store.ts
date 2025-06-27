import assignmentReducer from "@/store/slices/AssignmentSlice";
import authReducer from "@/store/slices/authSlice";
import { configureStore } from "@reduxjs/toolkit";
import { createErrorMiddleware } from '@/store/errorMiddleware';
import lapReducer from "@/store/slices/LapSlice";
import layoutReducer from "@/store/slices/layoutSlice";
import taskReducer from "@/store/slices/TaskSlice";
import uiReducer from "@/store/slices/uiSlice";

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