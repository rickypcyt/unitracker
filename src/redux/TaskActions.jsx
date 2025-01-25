// src/actions/taskActions.js

// Acción para manejar errores
export const taskError = (error) => ({
  type: 'TASK_ERROR',
  payload: error,
});

// Acción para obtener tareas
export const fetchTasks = () => {
  return async (dispatch) => {
    try {
      const response = await fetch('http://localhost:5000/api/tasks');
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
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
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      });
      if (!response.ok) {
        throw new Error('Failed to add task');
      }
      const data = await response.json();
      dispatch({ type: 'ADD_TASK', payload: data });
    } catch (error) {
      console.error('Error adding task:', error);
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
      const endpoint = completed ? 'complete' : 'incomplete';
      const response = await fetch(`http://localhost:5000/api/tasks/${id}/${endpoint}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const data = await response.json();
      // Opcional: Despachar una acción para actualizar el estado con los datos del servidor
      dispatch({ type: 'UPDATE_TASK', payload: data });
    } catch (error) {
      console.error('Error toggling task status:', error);
      // Revertir la actualización optimista
      dispatch({
        type: 'TOGGLE_TASK_STATUS',
        payload: { id, completed: !completed },
      });
      // Notificar el error
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
      const response = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      dispatch({ type: 'DELETE_TASK', payload: id });
    } catch (error) {
      console.error('Error deleting task:', error);
      dispatch(taskError(error.message));
    }
  };
};