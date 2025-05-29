import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import taskReducer from "./slices/TaskSlice";
import lapReducer from "./slices/LapSlice";
import uiReducer from "./slices/uiSlice";
import layoutReducer from "./slices/layoutSlice";
import assignmentReducer from "./slices/AssignmentSlice"; // importa tu nuevo slice
import { createErrorMiddleware } from './middleware/errorMiddleware';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        tasks: taskReducer,
        laps: lapReducer,
        ui: uiReducer,
        layout: layoutReducer,
        assignments: assignmentReducer, // <-- agrégalo aquí
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
