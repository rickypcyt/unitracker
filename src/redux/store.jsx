import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import taskReducer from "./TaskSlice";
import lapReducer from "./LapSlice";
import uiReducer from "./uiSlice";
import layoutReducer from "./layoutSlice";
import assignmentReducer from "./AssignmentSlice"; // importa tu nuevo slice

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
        }),
});
