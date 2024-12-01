import { createSlice } from '@reduxjs/toolkit';

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: [
    {
      id: 1,
      title: 'Complete React Project',
      deadline: '2024-12-05',
      notes: 'Implement all features for Uni Tracker',
      completed: false,
      pdf: null
    },
    {
      id: 2,
      title: 'Redux State Management',
      deadline: '2024-12-10',
      notes: 'Implement local storage and advanced state management',
      completed: false,
      pdf: null
    },
    {
      id: 3,
      title: 'UI/UX Improvements',
      deadline: '2024-12-15',
      notes: 'Enhance user interface and experience',
      completed: false,
      pdf: null
    },
  ],
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

      state.push(newTask);
    },
    deleteTask: (state, action) => {
      return state.filter((task) => task.id !== action.payload);
    },
    toggleTaskCompletion: (state, action) => {
      const task = state.find(task => task.id === action.payload);
      if (task) {
        task.completed = !task.completed;
      }
    },
    updateTask: (state, action) => {
      const index = state.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        state[index] = { ...state[index], ...action.payload.updates };
      }
    },
    attachPDF: (state, action) => {
      const { taskId, pdfUrl } = action.payload;
      const task = state.find(task => task.id === taskId);
      if (task) {
        task.pdf = pdfUrl;
      }
    }
  }
});

export const {
  addTask,
  deleteTask,
  updateTask,
  toggleTaskCompletion,
  attachPDF
} = tasksSlice.actions;

export default tasksSlice.reducer;