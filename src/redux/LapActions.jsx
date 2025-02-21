import { supabase } from '../utils/supabaseClient';
import { 
  fetchLapsSuccess, 
  addLapSuccess, 
  updateLapSuccess, 
  deleteLapSuccess, 
  lapError 
} from './LapSlice';

export const fetchLaps = () => async (dispatch) => {
  try {
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

    const { error } = await supabase
      .from('study_laps')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    dispatch(deleteLapSuccess(id));
  } catch (error) {
    dispatch(lapError(error.message));
  }
};