// src/actions/taskActions.js

// Action to fetch tasks from the server
export const fetchTasks = () => {
  return async (dispatch) => {
    try {
      // Fetch tasks from the server
      const response = await fetch('http://localhost:5000/api/tasks');
      const data = await response.json();
      // Dispatch the FETCH_TASKS action with the fetched tasks
      dispatch({ type: 'FETCH_TASKS', payload: data });
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };
};

// Action to add a new task
export const addTask = (task) => {
  return async (dispatch) => {
    try {
      // Make a POST request to the backend to create the task
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(task),
      });
      const data = await response.json();

      // If the task was created successfully, dispatch the ADD_TASK action
      dispatch({
        type: "ADD_TASK",
        payload: data,
      });

      return data; // Return the data for further processing
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };
};

// Action to add tags to an existing task (this action seems incomplete)
export const addTags = (tags) => {
  return async (dispatch) => {
    try {
      // Make a POST request to the backend to update the tags
      const response = await fetch("/api/addTags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags }), // Pass only the tags
      });
      const data = await response.json();

      // Update the Redux state if necessary
      dispatch({
        type: "ADD_TAGS",
        payload: data,
      });

      return data;
    } catch (error) {
      console.error("Error adding tags:", error);
    }
  };
};

// Action to mark a task as completed
export const markTaskAsCompleted = (id) => {
  return async (dispatch, getState) => {
    // Find the task in the current state
    const task = getState().tasks.tasks.find((task) => task.id === id);

    // Perform an optimistic update (without waiting for the server response)
    dispatch({
      type: 'TOGGLE_TASK_STATUS',
      payload: { id, completed: true },
    });

    try {
      // Make a PUT request to the server to mark the task as completed
      const response = await fetch(`http://localhost:5000/api/tasks/${id}/complete`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const data = await response.json();

      // No need to do anything here since we've already made the optimistic update
    } catch (error) {
      console.error('Error marking task as completed:', error);

      // If the update fails, revert the optimistic update
      dispatch({
        type: 'TOGGLE_TASK_STATUS',
        payload: { id, completed: false },
      });
    }
  };
};

// Action to mark a task as not completed
export const markTaskAsNotCompleted = (id) => {
  return async (dispatch, getState) => {
    // Find the task in the current state
    const task = getState().tasks.tasks.find((task) => task.id === id);

    // Perform an optimistic update (without waiting for the server response)
    dispatch({
      type: 'TOGGLE_TASK_STATUS',
      payload: { id, completed: false },
    });

    try {
      // Make a PUT request to the server to mark the task as not completed
      const response = await fetch(`http://localhost:5000/api/tasks/${id}/incomplete`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const data = await response.json();

      // No need to do anything here since we've already made the optimistic update
    } catch (error) {
      console.error('Error marking task as incomplete:', error);

      // If the update fails, revert the optimistic update
      dispatch({
        type: 'TOGGLE_TASK_STATUS',
        payload: { id, completed: true },
      });
    }
  };
};

// Action to delete a task
export const deleteTask = (id) => {
  return async (dispatch) => {
    try {
      // Make a DELETE request to the server to delete the task
      await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'DELETE',
      });
      // Dispatch the DELETE_TASK action with the task ID
      dispatch({ type: 'DELETE_TASK', payload: id });
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };
};
