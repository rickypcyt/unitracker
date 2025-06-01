import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface User {
  id: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthState {
  user: User | null;
  error: string | null;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  error: null,
  loading: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      if (action.payload) {
        console.log(`[Auth] User logged in: ${action.payload.email} (ID: ${action.payload.id})`);
      } else {
        console.log('[Auth] User logged out');
      }
      state.user = action.payload;
    },
    clearUser(state) {
      console.log('[Auth] User session cleared');
      state.user = null;
    },
    setError(state, action: PayloadAction<string | null>) {
      if (action.payload) {
        console.error(`[Auth] Error: ${action.payload}`);
      }
      state.error = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      if (action.payload) {
        console.log('[Auth] Loading started');
      } else {
        console.log('[Auth] Loading finished');
      }
      state.loading = action.payload;
    }
  }
});

export const { setUser, clearUser, setError, setLoading } = authSlice.actions;
export default authSlice.reducer; 