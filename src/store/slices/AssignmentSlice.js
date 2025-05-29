// src/slices/assignmentSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    list: [],
    error: null,
};

const assignmentSlice = createSlice({
    name: "assignments",
    initialState,
    reducers: {
        setAssignments: (state, action) => {
            state.list = action.payload;
        },
        addAssignment: (state, action) => {
            state.list.push(action.payload);
        },
        assignmentError: (state, action) => {
            state.error = action.payload;
        },
    },
});

export const { setAssignments, addAssignment, assignmentError } =
    assignmentSlice.actions;
export default assignmentSlice.reducer;
