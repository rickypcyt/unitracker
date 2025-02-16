// src/reducers/taskReducer.js

// Define el estado inicial del reducer
const initialState = {
  tasks: [], // Array para almacenar las tareas
  error: null, // Propiedad para almacenar errores
};

// Define el reducer para manejar las acciones relacionadas con las tareas
const taskReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'FETCH_TASKS':
      return {
        ...state,
        tasks: action.payload, // Actualiza la lista de tareas con los datos recibidos
      };
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload], // Agrega una nueva tarea al array
      };
    case 'TOGGLE_TASK_STATUS':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id
            ? { ...task, completed: action.payload.completed }
            : task
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload),
      };
    case 'TASK_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
};

// Exporta el reducer como exportación por defecto
export default taskReducer;