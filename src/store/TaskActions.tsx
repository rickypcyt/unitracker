import {
  addTaskSuccess,
  deleteTaskSuccess,
  fetchTasksStart,
  fetchTasksSuccess,
  invalidateCache,
  taskError,
  toggleTaskStatusOptimistic,
  updateTaskSuccess
} from '@/store/slices/TaskSlice';

import { supabase } from '@/utils/supabaseClient';

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Helper para guardar en localStorage
function saveTasksToLocalStorage(tasks) {
  try {
    localStorage.setItem('tasksHydrated', JSON.stringify(tasks));
  } catch {
    // no-op
  }
}

// En tu archivo TaskActions.js
export const fetchTasks = () => async (dispatch, getState) => {
  dispatch(fetchTasksStart());
  try {
    const { tasks } = getState();
    // Check if we have a valid cache
    if (tasks.isCached && tasks.lastFetch && (Date.now() - tasks.lastFetch < CACHE_DURATION)) {
      dispatch(fetchTasksSuccess(tasks.tasks)); // Use cached data, pero apaga loading
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    let query = supabase
      .from('tasks')
      .select('id, title, description, completed, completed_at, created_at, updated_at, user_id, assignment, difficulty, activetask, deadline, workspace_id')
      .eq('user_id', user.id)
      .order('assignment');

    // if (workspace?.activeWorkspace?.id) {
    //   query = query.eq('workspace_id', workspace.activeWorkspace.id);
    // }

    const { data, error } = await query;

    if (error) throw error;

    dispatch(fetchTasksSuccess(data));
    saveTasksToLocalStorage(data);
  } catch (error) {
    dispatch(taskError(error.message));
  }
};

// Acción para obtener tareas
export const addTask = (newTask) => async (dispatch, getState) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { workspace } = getState();

    if (!user) {
      // If no user, generate a local ID and store in localStorage
      const localTasks = JSON.parse(localStorage.getItem('localTasks') || '[]');
      const localTask = {
        ...newTask,
        id: Date.now(), // Use timestamp as local ID
        created_at: new Date().toISOString(),
        completed: false,
        activetask: false
      };
      localTasks.push(localTask);
      localStorage.setItem('localTasks', JSON.stringify(localTasks));
      return localTask;
    }

    const taskWithUser = {
      ...newTask,
      user_id: user.id,
      created_at: new Date().toISOString(),
      completed: false,
      activetask: false,
      workspace_id: workspace?.activeWorkspace?.id || null
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert([taskWithUser])
      .select()
      .single();

    if (error) throw error;

    dispatch(addTaskSuccess(data));
    // Actualiza localStorage
    saveTasksToLocalStorage([...(await getTasksFromStoreOrLocalStorage()), data]);
    return data;
  } catch (error) {
    dispatch(taskError(error.message));
    throw error;
  }
};

// Acción para marcar como completado/no completado
export const toggleTaskStatus = (id, completed) => async (dispatch) => {
  try {
    // Actualización optimista
    dispatch(toggleTaskStatusOptimistic({ id, completed }));

    // Actualizar en la base de datos
    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        completed: completed,
        completed_at: completed ? new Date().toISOString() : null 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Revertir en caso de error
      dispatch(toggleTaskStatusOptimistic({ id, completed: !completed }));
      throw error;
    }

    // Actualizar el estado con la respuesta del servidor
    dispatch(updateTaskSuccess(data));
  } catch (error) {
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

    dispatch(deleteTaskSuccess(id));
    // Actualiza localStorage
    saveTasksToLocalStorage((await getTasksFromStoreOrLocalStorage()).filter(t => t.id !== id));
  } catch (error) {
    dispatch(taskError(error.message));
  }
};

// Acción para actualizar tarea
export const updateTask = (task) => async (dispatch) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    if (!task || !task.id) {
      throw new Error('ID de tarea inválido');
    }

    // Verificar que la tarea pertenece al usuario
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('user_id')
      .eq('id', task.id)
      .single();

    if (taskError) throw taskError;

    if (!taskData || taskData.user_id !== user.id) {
      throw new Error('No tienes permiso para editar esta tarea');
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        completed: task.completed,
        difficulty: task.difficulty,
        assignment: task.assignment,
        activetask: task.activetask
      })
      .eq('id', task.id)
      .select();

    if (error) throw error;

    dispatch(updateTaskSuccess(data[0]));
    // Actualiza localStorage
    saveTasksToLocalStorage(await getTasksFromStoreOrLocalStorage().then(tasks => tasks.map(t => t.id === data[0].id ? data[0] : t)));
  } catch (error) {
    dispatch(taskError(error.message));
    throw error;
  }
};

// Acción para forzar una actualización de las tareas
export const forceTaskRefresh = () => async (dispatch) => {
  dispatch(invalidateCache());
  return dispatch(fetchTasks());
};

// Helper para obtener tasks actuales
async function getTasksFromStoreOrLocalStorage() {
  try {
    const local = localStorage.getItem('tasksHydrated');
    if (local) return JSON.parse(local);
  } catch {
    // no-op
  }
  return [];
}

