// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import taskReducer from './TaskReducer';

const store = configureStore({
  reducer: {
    tasks: taskReducer,
  },
});

export { store }; // Asegúrate de exportar `store` correctamente