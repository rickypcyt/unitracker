import { supabase } from '../../config/supabaseClient';

import { 
  fetchLapsSuccess, 
  addLapSuccess, 
  updateLapSuccess, 
  deleteLapSuccess, 
  lapError,
  invalidateCache
} from '../slices/LapSlice';

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export const fetchLaps = () => async (dispatch, getState) => {
  try {
    const { laps } = getState();
    
    // Check if we have a valid cache
    if (laps.isCached && laps.lastFetch && (Date.now() - laps.lastFetch < CACHE_DURATION)) {
      return; // Use cached data
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('study_laps')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    dispatch(fetchLapsSuccess(data));
  } catch (error) {
    dispatch(lapError(error.message));
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
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // First, get all tasks associated with this session
    const { data: sessionTasks, error: fetchError } = await supabase
      .from('session_tasks')
      .select('task_id')
      .eq('session_id', id);

    if (fetchError) throw fetchError;

    // Delete the session_tasks relationships
    const { error: deleteSessionTasksError } = await supabase
      .from('session_tasks')
      .delete()
      .eq('session_id', id);

    if (deleteSessionTasksError) throw deleteSessionTasksError;

    // Delete the session
    const { error: deleteError } = await supabase
      .from('study_laps')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    // Update tasks that were associated with this session
    if (sessionTasks && sessionTasks.length > 0) {
      const taskIds = sessionTasks.map(st => st.task_id);
      const { error: updateTasksError } = await supabase
        .from('tasks')
        .update({ activetask: false })
        .in('id', taskIds);

      if (updateTasksError) throw updateTasksError;
    }

    dispatch(deleteLapSuccess(id));
  } catch (error) {
    dispatch(lapError(error.message));
    throw error;
  }
};

// Action to force a refresh of laps
export const forceLapRefresh = () => async (dispatch) => {
  dispatch(invalidateCache());
  return dispatch(fetchLaps());
};