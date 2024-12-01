import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Definir el thunk para obtener las tareas
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async () => {
    const response = await fetch('http://localhost:5000/api/tasks'); // Aquí va tu API
    const data = await response.json();
    return data;
  }
);

// Definir un thunk para agregar una tarea
export const addTask = createAsyncThunk(
  'tasks/addTask',
  async (newTask) => {
    const response = await fetch('http://localhost:5000/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask),
    });
    const data = await response.json();
    return data; // Devuelve la nueva tarea agregada
  }
);

// Definir un thunk para actualizar una tarea (completada)
export const toggleTaskCompletion = createAsyncThunk(
  'tasks/toggleTaskCompletion',
  async (taskId) => {
    const response = await fetch(`http://localhost:5000/api/tasks${taskId}/toggle`, {
      method: 'PUT',
    });
    const data = await response.json();
    return data; // Devuelve la tarea actualizada
  }
);

// Definir un thunk para eliminar una tarea
export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId) => {
    const response = await fetch(`http://localhost:5000/api/tasks${taskId}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      return taskId; // Solo devolver el id de la tarea eliminada
    }
    throw new Error('Failed to delete task');
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload); // Añadir la tarea al estado
      })
      .addCase(toggleTaskCompletion.fulfilled, (state, action) => {
        const task = state.tasks.find(task => task.id === action.payload.id);
        if (task) {
          task.completed = action.payload.completed;
        }
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(task => task.id !== action.payload); // Eliminar tarea por id
      });
  },
});

export default tasksSlice.reducer;
