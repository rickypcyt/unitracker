import { createSlice } from '@reduxjs/toolkit';

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],  // Estado inicial de las tareas
  },
  reducers: {
    setTasks: (state, action) => {
      state.tasks = action.payload;  // Establece las tareas desde la base de datos
    },
    addTask: (state, action) => {
      state.tasks.push(action.payload);  // Agrega una nueva tarea
    },
    toggleTaskCompletion: (state, action) => {
      const task = state.tasks.find((task) => task.id === action.payload);
      if (task) {
        task.completed = !task.completed;  // Cambia el estado de completado de la tarea
      }
    },
    deleteTask: (state, action) => {
      state.tasks = state.tasks.filter((task) => task.id !== action.payload);  // Elimina la tarea
    },
  },
});

export const { setTasks, addTask, toggleTaskCompletion, deleteTask } = tasksSlice.actions;

export default tasksSlice.reducer;
