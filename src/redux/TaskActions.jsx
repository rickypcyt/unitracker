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
const fetchTasks = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id);
  if (error) console.error(error);
  return data;
};

// Acción para agregar tarea
export const addTask = (newTask) => async (dispatch) => {
  try {
    // Obtener el usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Agregar el user_id y el estado completed al nuevo task
    const taskWithUser = { 
      ...newTask, 
      user_id: user.id, // Asociar la tarea al usuario
      completed: false  // Estado inicial de la tarea
    };

    // Insertar la tarea en la base de datos
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskWithUser])
      .select();

    if (error) throw error;

    // Despachar la acción de éxito con la tarea creada
    dispatch(addTaskSuccess(data[0]));
  } catch (error) {
    // Despachar la acción de error
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