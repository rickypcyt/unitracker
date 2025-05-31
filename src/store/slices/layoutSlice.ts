import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface LayoutItem {
  id: string;
  type: string;
  props?: Record<string, any>;
}

interface LayoutState {
  layout: LayoutItem[];
}

const initialState: LayoutState = {
  layout: []
};

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    setLayout: (state, action: PayloadAction<LayoutItem[]>) => {
      state.layout = action.payload;
    }
  }
});

export const { setLayout } = layoutSlice.actions;
export default layoutSlice.reducer; 