import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { AppDispatch } from '../store';
import { supabase } from '@/utils/supabaseClient';

export interface Workspace {
  id: string;
  name: string;
  icon?: string; // nombre del icono de lucide-react
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
}

const initialState: WorkspaceState = {
  workspaces: [],
  activeWorkspace: null,
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setWorkspaces(state, action: PayloadAction<Workspace[]>) {
      state.workspaces = action.payload;
      const lastActiveId = localStorage.getItem('activeWorkspaceId');
      if (lastActiveId) {
        const found = state.workspaces.find(ws => ws.id === lastActiveId);
        if (found) {
          state.activeWorkspace = found;
          return;
        }
      }
      if (!state.workspaces.find(ws => ws.id === state.activeWorkspace?.id)) {
        state.activeWorkspace = state.workspaces[0] || null;
      }
    },
    setActiveWorkspace(state, action: PayloadAction<Workspace | null>) {
      state.activeWorkspace = action.payload;
      if (action.payload) {
        localStorage.setItem('activeWorkspaceId', action.payload.id);
      }
    },
    addWorkspace(state, action: PayloadAction<Workspace>) {
      state.workspaces.push(action.payload);
      state.activeWorkspace = action.payload;
      localStorage.setItem('activeWorkspaceId', action.payload.id);
    },
  },
});

export const { setWorkspaces, setActiveWorkspace, addWorkspace } = workspaceSlice.actions;

// Acción asíncrona para obtener workspaces con caché local
export const fetchWorkspaces = () => async (dispatch: AppDispatch) => {
  // 1. Leer de localStorage primero
  const cached = localStorage.getItem('workspacesHydrated');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        dispatch(setWorkspaces(parsed));
      }
    } catch {}
  }

  // 2. Fetch real a la base de datos
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data, error } = await supabase
    .from('workspaces')
    .select('id, name, icon')
    .eq('user_id', user.id)
    .order('name');
  if (!error && data) {
    dispatch(setWorkspaces(data));
    localStorage.setItem('workspacesHydrated', JSON.stringify(data));
  }
};

export default workspaceSlice.reducer; 