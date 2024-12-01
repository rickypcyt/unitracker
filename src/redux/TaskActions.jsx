// src/actions/taskActions.js

export const fetchTasks = () => {
  return async (dispatch) => {
    try {
      const response = await fetch('http://localhost:5000/api/tasks');
      const data = await response.json();
      dispatch({ type: 'FETCH_TASKS', payload: data });
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };
};

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
      const data = await response.json();
      dispatch({ type: 'ADD_TASK', payload: data });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };
};

// Acción para marcar tarea como completada
// src/actions/taskActions.js
export const markTaskAsCompleted = (id) => {
  return async (dispatch) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${id}/complete`, {
        method: 'PUT',
      });
      const data = await response.json();
      dispatch({
        type: 'TOGGLE_TASK_STATUS',
        payload: { id: data.id, completed: true }, // Asegúrate de que completed sea 'true' aquí
      });
    } catch (error) {
      console.error('Error marking task as completed:', error);
    }
  };
};

export const markTaskAsNotCompleted = (id) => {
  return async (dispatch) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${id}/incomplete`, {
        method: 'PUT',
      });
      const data = await response.json();
      dispatch({
        type: 'TOGGLE_TASK_STATUS',
        payload: { id: data.id, completed: false }, // Asegúrate de que completed sea 'false' aquí
      });
    } catch (error) {
      console.error('Error marking task as incomplete:', error);
    }
  };
};


export const deleteTask = (id) => {
  return async (dispatch) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'DELETE',
      });
      dispatch({ type: 'DELETE_TASK', payload: id });
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };
};
