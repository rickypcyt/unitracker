import type { PayloadAction} from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

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

// Hydrate desde localStorage para persistencia inmediata al refrescar
let initialWorkspaces: Workspace[] = [];
let initialActive: Workspace | null = null;
try {
  const cached = localStorage.getItem('workspacesHydrated');
  const lastId = localStorage.getItem('activeWorkspaceId');
  const lastActiveObjRaw = localStorage.getItem('lastActiveWorkspace');
  const lastActiveObj: Workspace | null = lastActiveObjRaw ? JSON.parse(lastActiveObjRaw) : null;
  if (cached) {
    const parsed = JSON.parse(cached);
    if (Array.isArray(parsed)) {
      initialWorkspaces = parsed;
      if (lastId) {
        const found = initialWorkspaces.find(ws => ws.id === lastId);
        initialActive = found || lastActiveObj || (initialWorkspaces[0] || null);
      } else {
        initialActive = lastActiveObj || (initialWorkspaces[0] || null);
      }
    }
  } else if (lastActiveObj) {
    // Si no hay lista cacheada aún, al menos mostrarmos el último workspace activo
    initialActive = lastActiveObj;
  }
} catch {
  // no-op
}

const initialState: WorkspaceState = {
  workspaces: initialWorkspaces,
  activeWorkspace: initialActive,
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setWorkspaces(state, action: PayloadAction<Workspace[]>) {
      state.workspaces = action.payload;
      const lastActiveId = localStorage.getItem('activeWorkspaceId');
      const lastActiveObjRaw = localStorage.getItem('lastActiveWorkspace');
      const lastActiveObj: Workspace | null = lastActiveObjRaw ? JSON.parse(lastActiveObjRaw) : null;
      if (lastActiveId) {
        const found = state.workspaces.find(ws => ws.id === lastActiveId);
        if (found) {
          state.activeWorkspace = found;
          localStorage.setItem('activeWorkspaceId', found.id);
          return;
        }
        // Si no se encuentra aún en la lista (latencia, filtro, etc.), usa el objeto almacenado
        if (lastActiveObj) {
          state.activeWorkspace = lastActiveObj;
          return;
        }
      }
      // Solo elegir el primero si NO hay activo actual ni persistido
      const hasPersisted = Boolean(lastActiveId) || Boolean(lastActiveObj);
      const hasCurrentActive = Boolean(state.activeWorkspace?.id);
      if (!hasPersisted && !hasCurrentActive) {
        state.activeWorkspace = state.workspaces[0] || null;
        if (state.activeWorkspace) {
          localStorage.setItem('activeWorkspaceId', state.activeWorkspace.id);
          localStorage.setItem('lastActiveWorkspace', JSON.stringify(state.activeWorkspace));
        } else {
          localStorage.removeItem('activeWorkspaceId');
          localStorage.removeItem('lastActiveWorkspace');
        }
      }
    },
    setActiveWorkspace(state, action: PayloadAction<Workspace | null>) {
      state.activeWorkspace = action.payload;
      if (action.payload) {
        localStorage.setItem('activeWorkspaceId', action.payload.id);
        localStorage.setItem('lastActiveWorkspace', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('activeWorkspaceId');
        localStorage.removeItem('lastActiveWorkspace');
      }
    },
    addWorkspace(state, action: PayloadAction<Workspace>) {
      state.workspaces.push(action.payload);
      state.activeWorkspace = action.payload;
      localStorage.setItem('activeWorkspaceId', action.payload.id);
      localStorage.setItem('lastActiveWorkspace', JSON.stringify(action.payload));
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
    } catch {
      // no-op
    }
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