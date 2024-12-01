import React from 'react';
import { useSelector } from 'react-redux';

const Achievements = () => {
  // Accede al estado de tasks desde Redux
  const tasks = useSelector(state => state.tasks.tasks);

  // Comprobamos si tasks es un array antes de usar .filter()
  if (!Array.isArray(tasks)) {
    return <div>Error: tasks is not an array!</div>;
  }

  // Filtrar las tareas (solo si tasks es un array)
  const filteredTasks = tasks.filter(task => task.completed);

  return (
    <div>
      {filteredTasks.length === 0 ? (
        <p>No tasks completed yet.</p>
      ) : (
        <ul>
          {filteredTasks.map((task, index) => (
            <li key={index}>{task.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Achievements;
