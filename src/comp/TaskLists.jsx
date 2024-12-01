import React, { useEffect, useState } from 'react';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await fetch('http://localhost:5000/api/tasks');
      const data = await response.json();
      setTasks(data);
    };

    fetchTasks();
  }, []);

  return (
    <div>
      <h2>Tareas</h2>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <strong>{task.title}</strong> - {task.description} (Fecha límite: {task.deadline})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;
