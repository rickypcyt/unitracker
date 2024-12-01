import { createSlice } from '@reduxjs/toolkit';

// Estado inicial con un arreglo vacío de tareas
const initialState = {
  tasks: [], // Aquí se almacenarán las tareas
};

// Creación del slice de Redux con acciones para manipular el estado de las tareas
const taskSlice = createSlice({
  name: 'tasks', // Nombre del slice
  initialState,   // Estado inicial que contiene las tareas
  reducers: {
    // Acción para agregar una nueva tarea
    addTask: (state, action) => {
      state.tasks.push(action.payload); // Añadir una nueva tarea al arreglo de tareas
    },

    // Acción para alternar el estado de completado de una tarea
    toggleTaskStatus: (state, action) => {
      const task = state.tasks.find((t) => t.id === action.payload);
      if (task) {
        task.completed = !task.completed; // Alterna entre completado y no completado
      }
    },

    // Acción para marcar una tarea como completada (estado = true)
    markTaskAsCompleted: (state, action) => {
      const task = state.tasks.find((t) => t.id === action.payload);
      if (task) {
        task.completed = true; // Establece la tarea como completada
      }
    },

    // Acción para marcar una tarea como no completada (estado = false)
    markTaskAsNotCompleted: (state, action) => {
      const task = state.tasks.find((t) => t.id === action.payload);
      if (task) {
        task.completed = false; // Establece la tarea como no completada
      }
    },

    // Acción para eliminar una tarea por su ID
    deleteTask: (state, action) => {
      state.tasks = state.tasks.filter((t) => t.id !== action.payload); // Elimina la tarea por ID
    },
  },
});

// Exportamos las acciones para que puedan ser usadas en el componente
export const { 
  addTask, 
  toggleTaskStatus, 
  deleteTask, 
  markTaskAsCompleted, 
  markTaskAsNotCompleted 
} = taskSlice.actions;

// Exportamos el reducer que se usará en la store de Redux
export default taskSlice.reducer;
