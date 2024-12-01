// src/components/TaskList.jsx
import React from 'react';
import { Box, Button, Stack, Text } from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTaskStatus, deleteTask } from './TaskActions';
import "./TaskList.css"

const TaskList = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.tasks);
  return (
    <div className="task-list-container">
      {tasks.length === 0 ? (
        <div className="task-list-empty">No tasks available</div>
      ) : (
        <div>
          {tasks.map((task) => (
            <div className="task-item">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => dispatch(toggleTaskStatus(task.id))}
              className="task-checkbox"
            />
            <span className={`task-text ${task.completed ? 'task-text-completed' : ''}`}>
              {task.title}
            </span>
            <button 
              className="task-button task-button-delete"
              onClick={() => dispatch(deleteTask(task.id))}
            >
              Delete
            </button>
          </div>
          
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;
