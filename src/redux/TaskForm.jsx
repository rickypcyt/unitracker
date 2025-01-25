import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addTask } from "./TaskActions"; // Ensure you have addTask in your actions file
import "./TaskForm.css";

const TaskForm = () => {
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    deadline: "",
  });

  const [error, setError] = useState("");

  const dispatch = useDispatch();

  // TaskForm.js - Modifica handleSubmit
const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  const taskToAdd = {
    title: newTask.title,
    description: newTask.description,
    deadline: newTask.deadline,
    completed: false,
  };

  try {
    // Envía solo la acción de Redux
    await dispatch(addTask(taskToAdd)); // ¡No uses fetch aquí!
    setNewTask({ title: "", description: "", deadline: "" }); 
  } catch (error) {
    setError(error.message);
  }
};

const handleSetToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Los meses son 0-based
  const day = String(today.getDate()).padStart(2, '0');
  const todayString = `${year}-${month}-${day}`;
  
  setNewTask({ ...newTask, deadline: todayString });
};

const handleSetTomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1); // Add 1 day to get tomorrow's date
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(tomorrow.getDate()).padStart(2, '0');
  const tomorrowString = `${year}-${month}-${day}`;
  
  setNewTask({ ...newTask, deadline: tomorrowString });
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
      
      <div className="task-date-group">
      <button
          type="button"
          className="today-button"
          onClick={handleSetToday}
        >
          Today
        </button>
        <input
          className={`task-input ${
            error && !newTask.deadline ? "task-input-error" : ""
          }`}
          type="date"
          value={newTask.deadline}
          onChange={(e) =>
            setNewTask({ ...newTask, deadline: e.target.value })
          }
        />
        <button
          type="button"
          className="tomorrow-button"
          onClick={handleSetTomorrow}
        >
          Tomorrow
        </button>
      </div>

      <button type="submit" className="task-submit-button">
        Add Task
      </button>
    </form>
  </div>
);
};

export default TaskForm;