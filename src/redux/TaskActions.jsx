import { supabase } from '../utils/supabaseClient';
import {
  fetchTasksSuccess,
  addTaskSuccess,
  toggleTaskStatusOptimistic,
  updateTaskSuccess,
  deleteTaskSuccess,
  taskError
} from './TaskSlice';

// En tu archivo TaskActions.js
export const fetchTasks = () => async (dispatch) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener tareas filtradas por user_id
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id); // <- Filtro clave

    if (error) throw error;

    dispatch(fetchTasksSuccess(data));
  } catch (error) {
    dispatch(taskError(error.message));
  }
};

// Acción para obtener tareas
export const addTask = (newTask) => async (dispatch) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const taskWithUser = {
      title: newTask.title,
      description: newTask.description,
      deadline: newTask.deadline,
      user_id: user.id, // ← Solo campos existentes en la tabla
    };

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

    // Actualizar la tarea en la base de datos
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed })
      .eq('id', id)
      .select();

    if (error) throw error;

    // Despachar la tarea actualizada
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
    // Eliminar la tarea de la base de datos
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Despachar la tarea eliminada
    dispatch(deleteTaskSuccess(id));
  } catch (error) {
    // Manejar errores
    dispatch(taskError(error.message));
  }
};

