import {
  addLapSuccess,
  deleteLapSuccess,
  fetchLapsSuccess,
  invalidateCache,
  lapError,
  updateLapSuccess
} from '@/store/slices/LapSlice';

import { supabase } from '@/utils/supabaseClient';

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export const fetchLaps = () => async (dispatch, getState) => {
  console.log('[DEBUG] fetchLaps - Iniciando obtención de sesiones');
  try {
    const { laps } = getState();
    
    // Verificar caché
    if (laps.isCached && laps.lastFetch && (Date.now() - laps.lastFetch < CACHE_DURATION)) {
      console.log('[DEBUG] Usando datos en caché');
      return; // Usar datos en caché
    }

    console.log('[DEBUG] Obteniendo usuario...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      const errorMsg = userError?.message || 'Usuario no autenticado';
      console.error('[DEBUG] Error de autenticación:', errorMsg);
      throw new Error(errorMsg);
    }

    console.log(`[DEBUG] Obteniendo sesiones para el usuario: ${user.id}`);
    const { data, error, count } = await supabase
      .from('study_laps')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[DEBUG] Error al obtener sesiones:', error);
      throw error;
    }

    console.log(`[DEBUG] Sesiones obtenidas: ${count}`);
    if (data && data.length > 0) {
      console.log('[DEBUG] Ejemplo de sesión:', {
        id: data[0].id,
        created_at: data[0].created_at,
        name: data[0].name,
        duration: data[0].duration
      });
    } else {
      console.log('[DEBUG] No se encontraron sesiones');
    }

    dispatch(fetchLapsSuccess(data || []));
    return data;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[DEBUG] Error en fetchLaps:', errorMsg, error);
    dispatch(lapError(errorMsg));
    throw error;
  }
};

export const createLap = (lapData) => async (dispatch) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('study_laps')
      .insert({ ...lapData, user_id: user.id })
      .select();

    if (error) throw error;
    dispatch(addLapSuccess(data[0]));
  } catch (error) {
    dispatch(lapError(error.message));
  }
};

export const updateLap = (id, updates) => async (dispatch) => {
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
    dispatch(updateLapSuccess(data[0]));
  } catch (error) {
    dispatch(lapError(error.message));
  }
};

export const deleteLap = (id) => async (dispatch) => {
  console.log('[DEBUG] deleteLap - Iniciando eliminación de sesión, ID:', id);
  
  try {
    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      const errorMsg = authError?.message || 'User not authenticated';
      console.error('[DEBUG] Error de autenticación:', errorMsg);
      throw new Error(errorMsg);
    }
    console.log('[DEBUG] Usuario autenticado:', user.id);

    // 2. Obtener tareas asociadas a la sesión
    console.log('[DEBUG] Obteniendo tareas de la sesión...');
    const { data: sessionTasks, error: fetchError } = await supabase
      .from('session_tasks')
      .select('task_id')
      .eq('session_id', id);

    if (fetchError) {
      console.error('[DEBUG] Error al obtener tareas de la sesión:', fetchError);
      throw fetchError;
    }
    console.log(`[DEBUG] Tareas asociadas: ${sessionTasks?.length || 0}`);

    // 3. Eliminar relaciones session_tasks
    console.log('[DEBUG] Eliminando relaciones session_tasks...');
    const { error: deleteSessionTasksError } = await supabase
      .from('session_tasks')
      .delete()
      .eq('session_id', id);

    if (deleteSessionTasksError) {
      console.error('[DEBUG] Error al eliminar relaciones session_tasks:', deleteSessionTasksError);
      throw deleteSessionTasksError;
    }

    // 4. Eliminar la sesión
    console.log('[DEBUG] Eliminando sesión...');
    const { error: deleteError, count } = await supabase
      .from('study_laps')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[DEBUG] Error al eliminar la sesión:', deleteError);
      throw deleteError;
    }
    
    console.log(`[DEBUG] Sesión eliminada, filas afectadas: ${count}`);

    // 5. Actualizar tareas asociadas
    if (sessionTasks?.length > 0) {
      const taskIds = sessionTasks.map(st => st.task_id);
      console.log(`[DEBUG] Actualizando ${taskIds.length} tareas asociadas...`);
      
      const { error: updateTasksError } = await supabase
        .from('tasks')
        .update({ activetask: false })
        .in('id', taskIds);

      if (updateTasksError) {
        console.error('[DEBUG] Error al actualizar tareas:', updateTasksError);
        throw updateTasksError;
      }
    }

    console.log('[DEBUG] deleteLap - Sesión eliminada exitosamente');
    dispatch(deleteLapSuccess(id));
    return { success: true, id };
    
  } catch (error) {
    console.error('[DEBUG] Error en deleteLap:', error);
    dispatch(lapError(error.message));
    throw error;
  }
};

// Action to force a refresh of laps
export const forceLapRefresh = () => async (dispatch) => {
  dispatch(invalidateCache());
  return dispatch(fetchLaps());
};