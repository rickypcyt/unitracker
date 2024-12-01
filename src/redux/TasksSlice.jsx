import { createSlice } from '@reduxjs/toolkit';

// Helper function to load tasks from localStorage
const loadTasksFromLocalStorage = () => {
  const storedTasks = localStorage.getItem('tasks');
  return storedTasks ? JSON.parse(storedTasks) : [];
};

// Helper function to save tasks to localStorage
const saveTasksToLocalStorage = (tasks) => {
  localStorage.setItem('tasks', JSON.stringify(tasks));
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: loadTasksFromLocalStorage(), // Initialize state from localStorage
  reducers: {
    addTask: (state, action) => {
      const { title, deadline, notes } = action.payload;

      if (!title || !deadline) {
        console.error("Task must have a title and deadline.");
        return state;
      }

      const newTask = {
        id: state.length > 0 ? Math.max(...state.map(task => task.id)) + 1 : 1,
        title,
        deadline,
        notes: notes || '',
        completed: false,
        pdf: null,
      };

      state.push(newTask); // Add task to the state
      saveTasksToLocalStorage(state); // Save updated state to localStorage
    },
    deleteTask: (state, action) => {
      const updatedState = state.filter((task) => task.id !== action.payload);
      saveTasksToLocalStorage(updatedState); // Save updated state to localStorage
      return updatedState;
    },
    toggleTaskCompletion: (state, action) => {
      const task = state.find(task => task.id === action.payload);
      if (task) {
        task.completed = !task.completed;
        saveTasksToLocalStorage(state); // Save updated state to localStorage
      }
    },
    updateTask: (state, action) => {
      const index = state.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        state[index] = { ...state[index], ...action.payload.updates };
        saveTasksToLocalStorage(state); // Save updated state to localStorage
      }
    }
  }
});

export const {
  addTask,
  deleteTask,
  toggleTaskCompletion,
  updateTask
} = tasksSlice.actions;

export default tasksSlice.reducer;
