import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from './TasksSlice'; // Asegúrate de que la ruta y el nombre del slice sean correctos

const store = configureStore({
  reducer: {
    tasks: tasksReducer, // Tienes que asegurarte de que `tasksReducer` esté correctamente importado
  },
});

export { store }; // Asegúrate de exportar `store` correctamente

