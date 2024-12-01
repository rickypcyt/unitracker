import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addTask } from "./TaskActions"; // Ensure you have addTask in your actions file
import "./TaskForm.css";

// TaskForm component to handle adding new tasks
const TaskForm = () => {
  // State to manage the new task details
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    deadline: "",
    tags: [], // Single tag as text
  });

  // State to manage error messages
  const [error, setError] = useState("");

  // State to manage the tag input
  const [tagInput, setTagInput] = useState("");

  // Get the dispatch function from the Redux store
  const dispatch = useDispatch();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!newTask.title) {
      setError("Task title is required");
      return;
    }

    if (!newTask.deadline) {
      setError("Deadline is required");
      return;
    }

    // Clear previous errors
    setError("");

    // Create the task object to add
    const taskToAdd = {
      title: newTask.title,
      description: newTask.description,
      deadline: newTask.deadline,
      completed: false,
      tags: newTask.tags, // Single tag as text
    };

    // Send a POST request to the server (port 5000)
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskToAdd),
      });

      const data = await response.json(); // Process the response as JSON

      if (response.ok) {
        console.log('Task added:', data);
        // Here you can add code to update the state or display the new task
        dispatch(addTask(taskToAdd)); // Dispatch the addTask action to update the Redux state
      } else {
        console.error('Error adding task:', data.message);
        setError(data.message); // Display the error if any
      }
    } catch (error) {
      console.error('Error making the request:', error);
      setError('There was an error adding the task');
    }

    // Clear the form fields and tag input
    setNewTask({ title: "", description: "", deadline: "", tags: "" });
    setTagInput("");
  };

  // Handle tag input change
  const handleTagChange = (e) => {
    setTagInput(e.target.value); // Update the tag input
  };

  // Handle adding a tag on Enter key press
  const handleAddTag = (e) => {
    if (e.key === "Enter" && tagInput.trim() !== "") {
      // Assign the tag directly since it's a single tag
      setNewTask({
        ...newTask,
        tags: tagInput.trim(),
      });
      setTagInput(""); // Clear the tag input
    }
  };

  // Handle removing the tag
  const handleTagRemove = () => {
    setNewTask({
      ...newTask,
      tags: "", // Clear the tag
    });
  };

  return (
    <div className="task-form-container">
      <form className="task-form" onSubmit={handleSubmit}>
        {error && (
          <div className="task-form-error-message">{error}</div>
        )}

        <div className="task-input-group">
          <input
            className={`task-input ${
              error && !newTask.title ? "task-input-error" : ""
            }`}
            value={newTask.title}
            onChange={(e) =>
              setNewTask({ ...newTask, title: e.target.value })
            }
            placeholder="Enter task title"
            required
          />
        </div>

        <input
          className="task-input"
          value={newTask.description}
          onChange={(e) =>
            setNewTask({ ...newTask, description: e.target.value })
          }
          placeholder="Enter task description (optional)"
        />

        {/* Tag input field */}
        <div className="task-tag-input-group">
          <input
            className="task-tag-input"
            type="text"
            value={tagInput}
            onChange={handleTagChange}
            onKeyDown={handleAddTag}
            placeholder="Add a tag (press Enter)"
          />
        </div>

        <input
          className={`task-input ${
            error && !newTask.deadline ? "task-input-error" : ""
          }`}
          type="date"
          value={newTask.deadline}
          onChange={(e) =>
            setNewTask({ ...newTask, deadline: e.target.value })
          }
          required
        />

        {/* Display the added tag */}
        {newTask.tags && (
          <div className="task-tags">
            <span className="task-tag">
              {newTask.tags}
              <button type="button" onClick={handleTagRemove}>
                &times;
              </button>
            </span>
          </div>
        )}

        <button type="submit" className="task-submit-button">
          Add Task
        </button>
      </form>
    </div>
  );
};

// Export the TaskForm component as the default export
export default TaskForm;
