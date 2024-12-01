import { createSlice } from '@reduxjs/toolkit';

export const tasksSlice = createSlice({
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
        return state; // Exit without modifying state
      }
    
      const newTask = {
        id: state.length ? state[state.length - 1].id + 1 : 1, // Ensure unique ID
        title,
        deadline,
        notes: notes || '',
        completed: false,
        pdf: null,
      };
    
      state.push(newTask);
    },
    removeTask: (state, action) => {
      return state.filter((task) => task.id !== action.payload);
    },
    updateTask: (state, action) => {
      const index = state.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        state[index] = { ...state[index], ...action.payload.updates };
      }
    },
    toggleTaskCompletion: (state, action) => {
      const task = state.find(task => task.id === action.payload);
      if (task) {
        task.completed = !task.completed;
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
  removeTask, 
  updateTask, 
  toggleTaskCompletion, 
  attachPDF 
} = tasksSlice.actions;

export default tasksSlice.reducer;


