import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addTask } from './TaskActions';
import './TaskForm.css';

const TaskForm = () => {
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: '',
  });
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!newTask.title) {
      setError('Task title is required');
      return;
    }
    
    if (!newTask.deadline) {
      setError('Deadline is required');
      return;
    }

    // Clear any previous errors
    setError('');

    const taskToAdd = { 
      ...newTask, 
      completed: false,
      id: Date.now() // Simple unique ID generation
    };

    dispatch(addTask(taskToAdd));
    setNewTask({ title: '', description: '', deadline: '' });
  };

  return (
    <div className="task-form-container">
      <form className="task-form" onSubmit={handleSubmit}>
        {error && <div className="task-form-error-message">{error}</div>}
        
        <input
          className={`task-input ${error && !newTask.title ? 'task-input-error' : ''}`}
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          placeholder="Enter task title"
          required
        />
        
        <input
          className="task-input"
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          placeholder="Enter task description (optional)"
        />
        
        <input
          className={`task-input ${error && !newTask.deadline ? 'task-input-error' : ''}`}
          type="date"
          value={newTask.deadline}
          onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
          required
        />
        
        <button 
          type="submit" 
          className="task-submit-button"
        >
          Add Task
        </button>
      </form>
    </div>
  );
};

export default TaskForm;