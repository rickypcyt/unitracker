// tasksActions.js (acciones)
export const SET_TASKS = 'SET_TASKS';
export const ADD_TASK = 'ADD_TASK';
export const TOGGLE_TASK_COMPLETION = 'TOGGLE_TASK_COMPLETION';
export const DELETE_TASK = 'DELETE_TASK';
export const ATTACH_PDF = 'ATTACH_PDF';

// Acción para obtener las tareas desde la base de datos
export const fetchTasks = () => async (dispatch) => {
  try {
    const response = await fetch('http://localhost:5000/api/tasks');
    const data = await response.json();
    dispatch(setTasks(data)); // Despacha la acción para establecer las tareas en el estado
  } catch (error) {
    console.error('Error fetching tasks:', error);
  }
};

// Acción para establecer las tareas
export const setTasks = (tasks) => ({
  type: SET_TASKS,
  payload: tasks,
});

// Acción para agregar una tarea
export const addTask = (task) => ({
  type: ADD_TASK,
  payload: task,
});

// Acción para alternar la tarea entre completada o no completada
export const toggleTaskCompletion = (taskId) => ({
  type: TOGGLE_TASK_COMPLETION,
  payload: taskId,
});

// Acción para eliminar una tarea
export const deleteTask = (taskId) => ({
  type: DELETE_TASK,
  payload: taskId,
});

// Acción para adjuntar un archivo PDF a una tarea
export const attachPDF = (taskId, pdfUrl) => ({
  type: ATTACH_PDF,
  payload: { taskId, pdfUrl },
});
