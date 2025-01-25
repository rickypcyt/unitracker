// src/reducers/taskReducer.js

// Define el estado inicial del reducer
const initialState = {
  tasks: [], // Array para almacenar las tareas
  error: null, // Propiedad para almacenar errores
};

// Define el reducer para manejar las acciones relacionadas con las tareas
const taskReducer = (state = initialState, action) => {
  switch (action.type) {
    // Caso para obtener las tareas desde el servidor
    case 'FETCH_TASKS':
      return {
        ...state,
        tasks: action.payload, // Actualiza la lista de tareas con los datos recibidos
      };

    // Caso para agregar una nueva tarea
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload], // Agrega una nueva tarea al array
      };

    // Caso para cambiar el estado de completado de una tarea
    case 'TOGGLE_TASK_STATUS':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id
            ? { ...task, completed: action.payload.completed } // Actualiza el estado de completado
            : task
        ),
      };

    // Caso para eliminar una tarea por su ID
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload), // Elimina la tarea por ID
      };

    // Caso para manejar errores
    case 'TASK_ERROR':
      return {
        ...state,
        error: action.payload, // Almacena el mensaje de error
      };

    // Caso por defecto: retorna el estado actual sin cambios
    default:
      return state;
  }
};

// Exporta el reducer como exportación por defecto
export default taskReducer;