// src/actions/taskActions.js
import { supabase } from '../utils/supabaseClient';
import {
  fetchTasksSuccess,
  addTaskSuccess,
  toggleTaskStatusOptimistic,
  updateTaskSuccess,
  taskError
} from './TaskSlice';

// Acción para obtener tareas
export const fetchTasks = () => async (dispatch) => {
  try {
    const { data, error } = await supabase.from('tasks').select('*');
    if (error) throw error;
    dispatch(fetchTasksSuccess(data));
  } catch (error) {
    dispatch(taskError(error.message));
  }
};

// Acción para agregar tarea
export const addTask = (newTask) => async (dispatch) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...newTask, completed: false }])
      .select();
      
    if (error) throw error;
    dispatch(addTaskSuccess(data[0]));
  } catch (error) {
    dispatch(taskError(error.message));
  }
};

// Acción para marcar como completado/no completado
export const toggleTaskStatus = (id, completed) => async (dispatch) => {
  try {
    // Actualización optimista
    dispatch(toggleTaskStatusOptimistic({ id, completed }));
    
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed })
      .eq('id', id)
      .select();

    if (error) throw error;
    dispatch(updateTaskSuccess(data[0]));
  } catch (error) {
    // Revertir en caso de error
    dispatch(toggleTaskStatusOptimistic({ id, completed: !completed }));
    dispatch(taskError(error.message));
  }
};

// Acción para eliminar tarea
export const deleteTask = (id) => async (dispatch) => {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    dispatch(deleteTaskSuccess(id));
  } catch (error) {
    dispatch(taskError(error.message));
  }
};