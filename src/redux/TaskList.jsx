import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTaskStatus, deleteTask, fetchTasks } from './TaskActions';
import { CheckCircle2, Circle, Calendar, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const TaskList = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.tasks);
  const [user, setUser] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  // Obtener usuario y cargar tareas al montar el componente
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        dispatch(fetchTasks());
      }
    };
    loadData();
  }, [dispatch]);

  const handleToggleCompletion = (task) => {
    dispatch(toggleTaskStatus(task.id, !task.completed));
  };

  const toggleCompletedTasks = () => {
    setShowCompleted(!showCompleted);
  };

  if (!user) {
    return (
      <div className="relative max-w-full mx-auto my-8 bg-secondary border border-border-primary rounded-2xl p-6 shadow-lg  mr-2 ml-2">
      <h2 className="text-2xl font-bold mb-6">Your Tasks</h2>
      <div className="text-center text-text-secondary text-xl p-12 bg-bg-tertiary rounded-xl mb-4">
        Please log in to view your tasks
      </div>
      </div>
    );
  }

  const userTasks = tasks.filter(task => task.user_id === user.id);
  const completedTasks = userTasks.filter(task => task.completed);
  const incompleteTasks = userTasks.filter(task => !task.completed);

  return (
    <div className="relative max-w-full mx-auto my-8 bg-secondary border border-border-primary rounded-2xl p-6 shadow-lg  mr-2 ml-2">
      <h2 className="text-2xl font-bold mb-6">Your Tasks</h2>

      {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
        <div className="text-center text-text-secondary text-xl p-12 bg-bg-tertiary rounded-xl mb-4">
          Create your first task!
        </div>
      ) : (
        <>
          {/* Incomplete Tasks */}
          {incompleteTasks.length > 0 && (
            <div className="space-y-4 mb-4">
              {incompleteTasks.map((task) => (
                <div
                  key={task.id}
                  className="group flex justify-between items-center p-4 bg-bg-tertiary border border-border-primary rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:bg-bg-surface"
                >
                  {/* Sección izquierda: Checkbox + Título */}
                  <div className="flex items-center flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleCompletion(task)}
                      className="bg-transparent border-none cursor-pointer flex items-center focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 rounded-full"
                      aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="text-accent-primary" size={24} />
                      ) : (
                        <Circle className="text-text-secondary" size={24} />
                      )}
                    </button>
                    <span
                      className={`ml-4 font-medium text-lg transition-colors duration-200 overflow-hidden text-ellipsis whitespace-nowrap ${
                        task.completed ? 'line-through text-text-secondary' : 'text-text-primary'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  {/* Sección central: Descripción */}
                  {task.description && (
                    <div className="flex-1 mx-4 text-sm text-text-secondary truncate text-center">
                      <span className="font-semibold">Description:</span> {task.description}
                    </div>
                  )}

                  {/* Sección derecha: Fecha + Eliminar */}
                  <div className="flex items-center flex-shrink-0 ml-4">
                    <div className="flex items-center mr-4">
                      <Calendar size={16} className="text-text-secondary" />
                      <span className="ml-2 text-sm text-text-secondary">
                        {new Date(task.deadline).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <button
                      onClick={() => dispatch(deleteTask(task.id))}
                      className="text-accent-secondary transition-all duration-200 hover:text-accent-primary hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 rounded-full p-1"
                      aria-label="Delete task"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div>
              <button
                className="flex items-center justify-between w-full py-2 px-3 bg-bg-surface rounded-lg text-left font-semibold hover:bg-bg-tertiary transition-colors duration-200"
                onClick={toggleCompletedTasks}
              >
                <span>Completed Tasks ({completedTasks.length})</span>
                {showCompleted ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              <div className={`space-y-4 mt-2 overflow-hidden transition-all duration-300 ${showCompleted ? 'visible' : 'hidden'}`}>
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group flex justify-between items-center p-4 bg-bg-tertiary border border-border-primary rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:bg-bg-surface"
                  >
                    {/* Sección izquierda: Checkbox + Título */}
                    <div className="flex items-center flex-1 min-w-0">
                      <button
                        onClick={() => handleToggleCompletion(task)}
                        className="bg-transparent border-none cursor-pointer flex items-center focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 rounded-full"
                        aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="text-accent-primary" size={24} />
                        ) : (
                          <Circle className="text-text-secondary" size={24} />
                        )}
                      </button>
                      <span
                        className={`ml-4 font-medium text-lg transition-colors duration-200 overflow-hidden text-ellipsis whitespace-nowrap ${
                          task.completed ? 'line-through text-text-secondary' : 'text-text-primary'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    {/* Sección central: Descripción */}
                    {task.description && (
                      <div className="flex-1 mx-4 text-sm text-text-secondary truncate text-center">
                        <span className="font-semibold">Description:</span> {task.description}
                      </div>
                    )}

                    {/* Sección derecha: Fecha + Eliminar */}
                    <div className="flex items-center flex-shrink-0 ml-4">
                      <div className="flex items-center mr-4">
                        <Calendar size={16} className="text-text-secondary" />
                        <span className="ml-2 text-sm text-text-secondary">
                          {new Date(task.deadline).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <button
                        onClick={() => dispatch(deleteTask(task.id))}
                        className="text-accent-secondary transition-all duration-200 hover:text-accent-primary hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 rounded-full p-1"
                        aria-label="Delete task"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TaskList;
