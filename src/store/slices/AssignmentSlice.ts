import type { PayloadAction} from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

interface Assignment {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

interface AssignmentState {
  list: Assignment[];
  error: string | null;
}

const initialState: AssignmentState = {
  list: [],
  error: null,
};

const assignmentSlice = createSlice({
  name: "assignments",
  initialState,
  reducers: {
    setAssignments: (state, action: PayloadAction<Assignment[]>) => {
      state.list = action.payload;
    },
    addAssignment: (state, action: PayloadAction<Assignment>) => {
      state.list.push(action.payload);
    },
    assignmentError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const { setAssignments, addAssignment, assignmentError } =
  assignmentSlice.actions;
export default assignmentSlice.reducer; 