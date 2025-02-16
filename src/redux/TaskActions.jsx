// src/actions/taskActions.js
import { supabase } from '../utils/supabaseClient'; // Ajusta la ruta si es necesario

// Acción para manejar errores
export const taskError = (error) => ({
  type: 'TASK_ERROR',
  payload: error,
});

// Acción para obtener tareas
export const fetchTasks = () => {
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*');

      if (error) {
        throw new Error(error.message);
      }

      dispatch({ type: 'FETCH_TASKS', payload: data });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      dispatch(taskError(error.message));
    }
  };
};

// Acción para agregar una tarea
export const addTask = (newTask) => {
  return async (dispatch) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title: newTask.title,
            description: newTask.description,
            deadline: newTask.deadline,
            completed: newTask.completed || false,
          },
        ]);

      if (error) {
        throw new Error(error.message);
      }

      // Obtener las tareas más recientes después de agregar la nueva tarea
      const { data: allTasks, error: fetchError } = await supabase
        .from('tasks')
        .select();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Actualizar el estado con la lista completa de tareas
      dispatch({ type: 'FETCH_TASKS', payload: allTasks });
    } catch (error) {
      console.error('Error adding task:', error.message, error);
      dispatch(taskError(error.message));
    }
  };
};




// Función auxiliar para marcar tarea como completada/incompleta
const toggleTaskStatus = (id, completed) => {
  return async (dispatch, getState) => {
    const task = getState().tasks?.tasks.find((task) => task.id === id);
    if (!task) {
      console.error('Task not found');
      return;
    }

    // Actualización optimista
    dispatch({
      type: 'TOGGLE_TASK_STATUS',
      payload: { id, completed },
    });

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      dispatch({ type: 'UPDATE_TASK', payload: data[0] });
    } catch (error) {
      console.error('Error toggling task status:', error);
      // Revertir la actualización optimista
      dispatch({
        type: 'TOGGLE_TASK_STATUS',
        payload: { id, completed: !completed },
      });
      dispatch(taskError(error.message));
    }
  };
};

export const markTaskAsCompleted = (id) => toggleTaskStatus(id, true);
export const markTaskAsNotCompleted = (id) => toggleTaskStatus(id, false);

// Acción para eliminar una tarea
export const deleteTask = (id) => {
  return async (dispatch) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      dispatch({ type: 'DELETE_TASK', payload: id });
    } catch (error) {
      console.error('Error deleting task:', error);
      dispatch(taskError(error.message));
    }
  };
};
