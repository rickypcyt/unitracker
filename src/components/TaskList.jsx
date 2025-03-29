import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTaskStatus, deleteTask, fetchTasks, updateTask } from '../redux/TaskActions';
import { CheckCircle2, Circle, Calendar, Trash2, ChevronDown, ChevronUp, ClipboardCheck, Download, X, Edit2, Save, Info, Play } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { motion } from 'framer-motion';
import moment from 'moment';

const TaskList = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.tasks);
  const [user, setUser] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showTaskMenu, setShowTaskMenu] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, task: null });

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

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (isEditing) {
          setIsEditing(false);
          setEditedTask(null);
        } else {
          handleCloseTaskDetails();
        }
      }
    };

    if (selectedTask) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [selectedTask, isEditing]);

  const handleToggleCompletion = (task) => {
    dispatch(toggleTaskStatus(task.id, !task.completed));
  };

  const toggleCompletedTasks = () => {
    setShowCompleted(!showCompleted);
  };

  const handleTaskDoubleClick = (task) => {
    setSelectedTask(task);
  };

  const handleCloseTaskDetails = () => {
    setSelectedTask(null);
    setIsEditing(false);
    setEditedTask(null);
  };

  const handleOverlayClick = (e) => {
    // Only close if clicking the overlay itself, not its children
    if (e.target === e.currentTarget) {
      if (isEditing) {
        setIsEditing(false);
        setEditedTask(null);
      } else {
        handleCloseTaskDetails();
      }
    }
  };

  const handleStartEditing = () => {
    if (!selectedTask) return;

    setEditedTask({
      id: selectedTask.id,
      title: selectedTask.title,
      description: selectedTask.description || '',
      deadline: selectedTask.deadline,
      completed: selectedTask.completed,
      difficulty: selectedTask.difficulty,
      assignment: selectedTask.assignment || '',
      activetask: selectedTask.activetask || false,
      user_id: selectedTask.user_id
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      await dispatch(updateTask(editedTask));
      setSelectedTask(editedTask);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleEditChange = (field, value) => {
    setEditedTask(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContextMenu = (e, task) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      task: task
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, task: null });
  };

  const handleSetActiveTask = (task) => {
    const updatedTask = { ...task, activetask: true };
    dispatch(updateTask(updatedTask));
    handleCloseContextMenu();
  };

  // Add click outside listener for context menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu.show) {
        handleCloseContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.show]);

  if (!user) {
    return (
      <div className="maincard">
        <h2 className="text-2xl font-bold mb-6">Your Tasks</h2>
        <div className="plslogin">
          Please log in to view your tasks
        </div>
      </div>
    );
  }

  const userTasks = tasks.filter(task => task.user_id === user.id);
  const completedTasks = userTasks.filter(task => task.completed);
  const incompleteTasks = userTasks.filter(task => !task.completed);

  return (
    <div className="maincard relative">
      <div className="flex flex-col gap-2 mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><ClipboardCheck size={24} />Your Tasks</h2>
        {selectedAssignment && (
          <span className="text-base text-gray-400">{selectedAssignment}</span>
        )}
      </div>

      {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
        <div className="plslogin">
          You have no tasks at the moment.
        </div>
      ) : (
        <>
          {/* Incomplete Tasks */}
          {incompleteTasks.length > 0 && (
            <div className="space-y-4 mb-4">
              {incompleteTasks.map((task) => (
                <div
                  key={task.id}
                  className={`tasks cursor-pointer ${task.activetask ? 'border-green-500 border-2' : ''}`}
                  onDoubleClick={() => handleTaskDoubleClick(task)}
                  onContextMenu={(e) => handleContextMenu(e, task)}
                >
                  {/* Sección izquierda: Checkbox + Título + Descripción */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleToggleCompletion(task)}
                        className="bg-transparent border-none cursor-pointer flex items-center focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 rounded-full group"
                        aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="text-accent-primary" size={24} />
                        ) : (
                          <Circle className={`${task.difficulty === 'easy' ? 'text-green-500' :
                            task.difficulty === 'medium' ? 'text-blue-500' :
                              'text-red-500'
                            }`} size={24} />
                        )}
                      </button>
                      <span
                        className={`ml-4 font-medium text-lg transition-colors duration-200 overflow-hidden text-ellipsis line-clamp-2 ${task.completed ? 'line-through text-text-secondary' : 'text-text-primary'
                          }`}
                        title={task.title}
                      >
                        {task.title}
                      </span>
                    </div>
                    {task.description && (
                      <div
                        className="ml-12 mt-1 text-base text-text-secondary line-clamp-2 group relative"
                        title={task.description}
                      >
                        {task.description}
                      </div>
                    )}
                    {task.assignment && (
                      <div
                        className="ml-12 mt-1 text-base text-text-secondary line-clamp-2 group relative"
                        title={task.assignment}
                      >
                        {task.assignment}
                      </div>
                    )}
                  </div>

                  {/* Sección derecha: Fecha + Eliminar */}
                  <div className="flex items-center flex-shrink-0 ml-4">
                    <div className="flex items-center mr-4">
                      <Calendar size={14} className="text-text-secondary" />
                      <span className="ml-2 text-base text-text-secondary">
                        {new Date(task.deadline).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <button
                      onClick={() => dispatch(deleteTask(task.id))}
                      className="text-red-500 transition-all duration-200 hover:text-red-600 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 rounded-full p-1"
                      aria-label="Delete task"
                    >
                      <Trash2 size={16} />
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
                className="infomenu mb-3"
                onClick={toggleCompletedTasks}
              >
                <span>Completed Tasks ({completedTasks.length})</span>
                {showCompleted ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              <div className={`space-y-4 mt-2 overflow-hidden transition-all duration-300 ${showCompleted ? 'visible' : 'hidden'}`}>
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`tasks cursor-pointer ${task.activetask ? 'border-green-500 border-2' : ''}`}
                    onDoubleClick={() => handleTaskDoubleClick(task)}
                  >
                    {/* Sección izquierda: Checkbox + Título + Descripción */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleToggleCompletion(task)}
                          className="bg-transparent border-none cursor-pointer flex items-center focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 rounded-full group"
                          aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                        >
                          {task.completed ? (
                            <CheckCircle2 className="text-accent-primary" size={24} />
                          ) : (
                            <Circle className={`${task.difficulty === 'easy' ? 'text-green-500' :
                              task.difficulty === 'medium' ? 'text-blue-500' :
                                'text-red-500'
                              }`} size={24} />
                          )}
                        </button>
                        <span
                          className={`ml-4 font-medium text-base transition-colors duration-200 overflow-hidden text-ellipsis line-clamp-2 ${task.completed ? 'line-through text-text-secondary' : 'text-text-primary'
                            }`}
                          title={task.title}
                        >
                          {task.title}
                        </span>
                      </div>
                      {task.description && (
                        <div
                          className="ml-12 mt-1 text-base text-text-secondary line-clamp-2 group relative"
                          title={task.description}
                        >
                          {task.description}
                        </div>
                      )}
                    </div>

                    {/* Sección derecha: Fecha + Eliminar */}
                    <div className="flex items-center flex-shrink-0 ml-4">
                      <div className="flex items-center mr-4">
                        <Calendar size={14} className="text-text-secondary" />
                        <span className="ml-2 text-base text-text-secondary">
                          {new Date(task.deadline).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <button
                        onClick={() => dispatch(deleteTask(task.id))}
                        className="text-red-500 transition-all duration-200 hover:text-red-600 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 rounded-full p-1"
                        aria-label="Delete task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task Details Modal */}
          {selectedTask && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm"
              onClick={handleOverlayClick}
            >
              <div className="maincard max-w-2xl w-full mx-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-center flex-1">
                    Task Details
                  </h3>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <button
                        onClick={handleStartEditing}
                        className="text-accent-primary hover:text-accent-deep transition-colors duration-200 flex items-center gap-2"
                      >
                        <Edit2 size={20} />
                        Edit
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveEdit}
                        className="text-green-500 hover:text-green-600 transition-colors duration-200 flex items-center gap-2"
                      >
                        <Save size={20} />
                        Save
                      </button>
                    )}
                    <button
                      className="text-gray-400 hover:text-white transition duration-200"
                      onClick={handleCloseTaskDetails}
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-text-primary mb-2">Title</h4>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedTask.title}
                        onChange={(e) => handleEditChange('title', e.target.value)}
                        className="textinput w-full"
                      />
                    ) : (
                      <p className="text-text-secondary">{selectedTask.title}</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-text-primary mb-2">Description</h4>
                    {isEditing ? (
                      <textarea
                        value={editedTask.description || ''}
                        onChange={(e) => handleEditChange('description', e.target.value)}
                        className="textinput w-full"
                        rows="4"
                      />
                    ) : (
                      <p className="text-text-secondary whitespace-pre-wrap">{selectedTask.description || 'No description'}</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-text-primary mb-2">Status</h4>
                    <p className="text-text-secondary">
                      {selectedTask.completed ? 'Completed' : 'Pending'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-text-primary mb-2">Difficulty</h4>
                    {isEditing ? (
                      <select
                        value={editedTask.difficulty}
                        onChange={(e) => handleEditChange('difficulty', e.target.value)}
                        className="textinput w-full"
                      >
                        <option value="easy" className="text-green-500">Easy</option>
                        <option value="medium" className="text-blue-500">Medium</option>
                        <option value="hard" className="text-red-500">Hard</option>
                      </select>
                    ) : (
                      <p className={`text-text-secondary ${selectedTask.difficulty === 'easy' ? 'text-green-500' :
                        selectedTask.difficulty === 'medium' ? 'text-blue-500' :
                          'text-red-500'
                        }`}>
                        {selectedTask.difficulty.charAt(0).toUpperCase() + selectedTask.difficulty.slice(1)}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-text-primary mb-2">Assignment</h4>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedTask.assignment || ''}
                        onChange={(e) => handleEditChange('assignment', e.target.value)}
                        className="textinput w-full"
                        placeholder="Enter assignment name"
                      />
                    ) : (
                      <p className="text-text-secondary">
                        {selectedTask.assignment || 'No assignment'}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-text-primary mb-2">Deadline</h4>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editedTask.deadline}
                        onChange={(e) => handleEditChange('deadline', e.target.value)}
                        className="textinput w-full"
                      />
                    ) : (
                      <p className="text-text-secondary">
                        {new Date(selectedTask.deadline).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-text-primary mb-2">Created At</h4>
                    <p className="text-text-secondary">
                      {moment(selectedTask.created_at).format('MMMM D, YYYY h:mm A')}
                    </p>
                  </div>

                  <div className="flex justify-end gap-4 mt-6">
                    <button
                      onClick={() => dispatch(deleteTask(selectedTask.id))}
                      className="text-red-500 hover:text-red-600 transition-colors duration-200 flex items-center gap-2"
                    >
                      <Trash2 size={20} />
                      Delete Task
                    </button>
                    <button
                      onClick={() => handleToggleCompletion(selectedTask)}
                      className={`transition-colors duration-200 flex items-center gap-2 ${selectedTask.completed
                        ? 'text-accent-primary hover:text-accent-deep'
                        : 'text-green-500 hover:text-green-600'
                        }`}
                    >
                      {selectedTask.completed ? (
                        <>
                          <Circle size={20} />
                          Mark as Incomplete
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={20} />
                          Mark as Complete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Context Menu */}
          {contextMenu.show && (
            <div
              className="fixed bg-neutral-900 p-2 rounded-lg shadow-lg z-50 border border-neutral-800"
              style={{
                left: contextMenu.x,
                top: contextMenu.y,
              }}
            >
              <div className="space-y-1">
                <button
                  onClick={() => {
                    handleTaskDoubleClick(contextMenu.task);
                    handleCloseContextMenu();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 rounded-md flex items-center gap-2"
                >
                  <Info size={16} />
                  Task Info
                </button>
                <button
                  onClick={() => handleSetActiveTask(contextMenu.task)}
                  className="w-full px-4 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 rounded-md flex items-center gap-2"
                >
                  <Play size={16} />
                  Set as Active Task
                </button>
                <button
                  onClick={() => {
                    dispatch(deleteTask(contextMenu.task.id));
                    handleCloseContextMenu();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-neutral-800 rounded-md flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete Task
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TaskList;
