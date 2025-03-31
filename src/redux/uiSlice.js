import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isCalendarVisible: true
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCalendarVisibility: (state, action) => {
      state.isCalendarVisible = action.payload;
    }
  }
});

export const { setCalendarVisibility } = uiSlice.actions;
export default uiSlice.reducer; 