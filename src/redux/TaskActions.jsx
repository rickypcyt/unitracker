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

// Acción para agregar la tarea
export const addTask = (task) => {
  return async (dispatch) => {
    try {
      // Llamada al backend para crear la tarea
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(task),
      });
      const data = await response.json();

      // Si la tarea se creó correctamente, la agregamos al store
      dispatch({
        type: "ADD_TASK",
        payload: data,
      });

      return data; // Devuelvo los datos para continuar el flujo
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };
};

// Acción para agregar tags a una tarea existente
export const addTags = (tags) => {
  return async (dispatch) => {
    try {
      // Llamada al backend para actualizar los tags
      const response = await fetch("/api/addTags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags }), // Aquí se pasan solo los tags
      });
      const data = await response.json();

      // Actualizar el estado de Redux si es necesario
      dispatch({
        type: "ADD_TAGS",
        payload: data,
      });

      return data;
    } catch (error) {
      console.error("Error adding tags:", error);
    }
  };
};



// Acción para marcar tarea como completada
// src/actions/taskActions.js
// src/actions/taskActions.js

// Acción para marcar tarea como completada
export const markTaskAsCompleted = (id) => {
  return async (dispatch, getState) => {
    const task = getState().tasks.tasks.find((task) => task.id === id);

    // Realiza el update optimista (sin esperar al servidor)
    dispatch({
      type: 'TOGGLE_TASK_STATUS',
      payload: { id, completed: true },
    });

    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${id}/complete`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const data = await response.json();

      // Aquí no necesitamos hacer nada, ya que ya hemos hecho el cambio optimista
    } catch (error) {
      console.error('Error marking task as completed:', error);

      // Si el update falla, revertimos el cambio optimista
      dispatch({
        type: 'TOGGLE_TASK_STATUS',
        payload: { id, completed: false },
      });
    }
  };
};

// Acción para marcar tarea como incompleta
export const markTaskAsNotCompleted = (id) => {
  return async (dispatch, getState) => {
    const task = getState().tasks.tasks.find((task) => task.id === id);

    // Realiza el update optimista (sin esperar al servidor)
    dispatch({
      type: 'TOGGLE_TASK_STATUS',
      payload: { id, completed: false },
    });

    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${id}/incomplete`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const data = await response.json();

      // Aquí no necesitamos hacer nada, ya que ya hemos hecho el cambio optimista
    } catch (error) {
      console.error('Error marking task as incomplete:', error);

      // Si el update falla, revertimos el cambio optimista
      dispatch({
        type: 'TOGGLE_TASK_STATUS',
        payload: { id, completed: true },
      });
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
