import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTaskStatus, deleteTask } from './TaskActions';
import { CheckCircle2, Circle, Calendar, Trash2 } from 'lucide-react';

const TaskList = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.tasks);

  const handleToggleCompletion = (task) => {
    dispatch(toggleTaskStatus(task.id, !task.completed));
  };

  return (
    <div className="relative max-w-full mx-auto my-8 bg-secondary border border-border-primary rounded-2xl p-6 shadow-lg transition-all duration-300 ease-in-out hover:translate-y-[-0.2rem] hover:shadow-xl mr-1 ml-1">
      <h2 className="text-2xl font-bold mb-6">Your Tasks</h2>
      {tasks.length === 0 ? (
        <div className="text-center text-text-secondary text-xl p-12 bg-bg-tertiary rounded-xl mb-4">
          No tasks available. Start by adding a new task!
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="group flex justify-between items-center p-4 bg-bg-tertiary border border-border-primary rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:bg-bg-surface"
            >
              {/* Left Section: Checkbox + Title */}
              <div className="flex items-center flex-1 min-w-0">
                <button
                  onClick={() => handleToggleCompletion(task)}
                  className="bg-transparent border-none cursor-pointer flex items-center focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 rounded-full"
                >
                  {task.completed ? (
                    <CheckCircle2 className="text-accent-primary" size={24} />
                  ) : (
                    <Circle className="text-text-secondary" size={24} />
                  )}
                </button>
                <span
                  className={`ml-4 font-medium text-lg transition-colors duration-200 overflow-hidden text-ellipsis whitespace-nowrap ${
                    task.completed
                      ? 'line-through text-text-secondary'
                      : 'text-text-primary'
                  }`}
                >
                  {task.title}
                </span>
              </div>

              {/* Middle Section: Description */}
              {task.description && (
                <div className="flex-1 mx-4 text-sm text-text-secondary truncate text-center">
                  <span className="font-semibold">Task Description:</span> {task.description}
                </div>
              )}

              {/* Right Section: Date + Delete */}
              <div className="flex items-center flex-shrink-0 ml-4">
                <div className="flex items-center mr-4">
                  <Calendar size={16} className="text-text-secondary" />
                  <span className="ml-2 text-sm text-text-secondary">
                    {new Date(task.deadline).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => dispatch(deleteTask(task.id))}
                  className="text-accent-secondary transition-all duration-200 hover:text-accent-primary hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 rounded-full p-1"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;
