// src/reducers/taskReducer.js

// Define the initial state of the tasks reducer
const initialState = {
  tasks: [], // An empty array to store tasks
};

// Define the taskReducer function to handle different actions
const taskReducer = (state = initialState, action) => {
  // Use a switch statement to handle different action types
  switch (action.type) {
    // Case for fetching tasks from the server or other data source
    case 'FETCH_TASKS':
      // Return a new state with the tasks updated to the payload received
      return { ...state, tasks: action.payload };

    // Case for adding a new task (this implementation seems incorrect, see note below)
    case 'ADD_TASK':
      // This implementation is incorrect because it tries to map over the state object directly.
      // Instead, it should push the new task into the tasks array.
      // Here is the corrected version:
      // return { ...state, tasks: [...state.tasks, action.payload] };
      return {
        ...state,
        tasks: [...state.tasks, action.payload], // Agrega la nueva tarea al array de tareas
      };

    // Case for toggling the completion status of a task
    case 'TOGGLE_TASK_STATUS':
      // Return a new state with the tasks array updated to reflect the changed task status
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id
            ? { ...task, completed: !task.completed } // Toggle the completion status
            : task
        ),
      };

    // Case for deleting a task by its ID
    case 'DELETE_TASK':
      // Return a new state with the tasks array filtered to exclude the task with the matching ID
      return { ...state, tasks: state.tasks.filter((task) => task.id !== action.payload) };

    // Default case to handle unknown action types
    default:
      // Return the current state unchanged if the action type is not recognized
      return state;
  }
};

// Export the taskReducer function as the default export
export default taskReducer;
