import { supabase } from '@/utils/supabaseClient';
import { useAppStore } from '@/store/appStore';

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export const fetchLaps = async () => {
  const store = useAppStore.getState();
  const { laps } = store;

  try {
    // Verificar caché
    if (laps.isCached && laps.lastFetch && (Date.now() - laps.lastFetch < CACHE_DURATION)) {
      return; // Usar datos en caché
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      const errorMsg = userError?.message || 'Usuario no autenticado';
      console.error('[DEBUG] Error de autenticación:', errorMsg);
      throw new Error(errorMsg);
    }

    const { data, error, count } = await supabase
      .from('study_laps')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[DEBUG] Error al obtener sesiones:', error);
      throw error;
    }

    // Update Zustand store
    useAppStore.getState().setLaps(data || []);
    useAppStore.getState().setLapsCached(true, Date.now());
    
    return data;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[DEBUG] Error en fetchLaps:', errorMsg, error);
    useAppStore.getState().setLapsError(errorMsg);
    throw error;
  }
};

export const createLap = async (lapData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('study_laps')
      .insert({ ...lapData, user_id: user.id })
      .select();

    if (error) throw error;
    useAppStore.getState().addLap(data[0]);
  } catch (error) {
    useAppStore.getState().lapError(error.message);
  }
};

export const updateLap = async (id, updates) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('study_laps')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select();

    if (error) throw error;
    useAppStore.getState().updateLap(id, data[0]);
  } catch (error) {
    useAppStore.getState().lapError(error.message);
  }
};

export const deleteLap = async (id) => {
  try {
    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      const errorMsg = authError?.message || 'User not authenticated';
      console.error('[DEBUG] Error de autenticación:', errorMsg);
      throw new Error(errorMsg);
    }

    // 2. Obtener tareas asociadas a la sesión
    const { data: sessionTasks, error: fetchError } = await supabase
      .from('session_tasks')
      .select('task_id')
      .eq('session_id', id);

    if (fetchError) {
      console.error('[DEBUG] Error al obtener tareas de la sesión:', fetchError);
      throw fetchError;
    }

    // 3. Eliminar relaciones session_tasks
    const { error: deleteSessionTasksError } = await supabase
      .from('session_tasks')
      .delete()
      .eq('session_id', id);

    if (deleteSessionTasksError) {
      console.error('[DEBUG] Error al eliminar relaciones session_tasks:', deleteSessionTasksError);
      throw deleteSessionTasksError;
    }

    // 4. Eliminar la sesión
    const { error: deleteError, count } = await supabase
      .from('study_laps')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[DEBUG] Error al eliminar la sesión:', deleteError);
      throw deleteError;
    }

    // 5. Actualizar tareas asociadas
    if (sessionTasks?.length > 0) {
      const taskIds = sessionTasks.map(st => st.task_id);

      const { error: updateTasksError } = await supabase
        .from('tasks')
        .update({ activetask: false })
        .in('id', taskIds);

      if (updateTasksError) {
        console.error('[DEBUG] Error al actualizar tareas:', updateTasksError);
        throw updateTasksError;
      }
    }
    useAppStore.getState().deleteLap(id);
    return { success: true, id };
    
  } catch (error) {
    console.error('[DEBUG] Error en deleteLap:', error);
    useAppStore.getState().lapError(error.message);
    throw error;
  }
};

// Action to force a refresh of laps
export const forceLapRefresh = async () => {
  useAppStore.getState().invalidateCache();
  return fetchLaps();
};