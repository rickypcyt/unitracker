import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface UiState {
  isCalendarVisible: boolean;
}

const initialState: UiState = {
  isCalendarVisible: true
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCalendarVisibility: (state, action: PayloadAction<boolean>) => {
      state.isCalendarVisible = action.payload;
    }
  }
});

export const { setCalendarVisibility } = uiSlice.actions;
export default uiSlice.reducer; 