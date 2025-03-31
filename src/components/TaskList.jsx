import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTaskStatus, deleteTask, fetchTasks, updateTask } from '../redux/TaskActions';
import { CheckCircle2, Circle, Calendar, Trash2, ChevronDown, ChevronUp, ClipboardCheck, Download, X, Edit2, Save, Info, Play, ArrowUpDown } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { motion } from 'framer-motion';
import moment from 'moment';
import { toast } from 'react-toastify';

const TaskItem = ({ task, onToggleCompletion, onDelete, onDoubleClick, onContextMenu }) => (
  <div
    className="tasks cursor-pointer relative"
    onDoubleClick={() => onDoubleClick(task)}
    onContextMenu={(e) => onContextMenu(e, task)}
  >
    {/* Delete button - Top right corner */}
    <div className="absolute top-2 right-2">
      <button
        onClick={() => onDelete(task.id)}
        className="text-red-500 transition-all duration-200 hover:text-red-600 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-opacity-50 rounded-full p-1"
        aria-label="Delete task"
      >
        <Trash2 size={16} />
      </button>
    </div>

    <div className="flex flex-col gap-2">
      {/* First row: Checkbox and Title */}
      <div className="flex items-center">
        <button
          onClick={() => onToggleCompletion(task)}
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
        <button
          onClick={() => onDoubleClick(task)}
          className="flex items-center focus:outline-none"
        >
          <span
            className={`ml-2 font-medium text-lg transition-colors duration-200 overflow-hidden text-ellipsis line-clamp-2 ${task.completed ? 'line-through text-text-secondary' : 'text-text-primary'
            }`}
            title={task.title}
          >
            {task.title}
          </span>
        </button>
      </div>

      {/* Second row: Description or empty space for consistent layout */}
      <div
        className="ml-1 text-lg text-text-secondary line-clamp-2 group relative min-h-[0.5rem]"
        title={task.description}
      >
        {task.description || ' '}
      </div>

      {/* Assignment and Date in same line */}
      <div className="flex items-center ml-1 gap-4">
        <span className="text-lg text-text-secondary">
          {task.assignment || 'No assignment'}
        </span>
        <div className="flex items-center">
          <Calendar size={16} className="text-text-secondary" />
          <span className="ml-2 text-lg text-text-secondary">
            {new Date(task.deadline).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>
    </div>
  </div>
);

const TaskList = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.tasks);
  const [user, setUser] = useState(null);
  const [localTasks, setLocalTasks] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showIncomplete, setShowIncomplete] = useState(true);
  const [showTaskMenu, setShowTaskMenu] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, task: null });
  const [sortBy, setSortBy] = useState('default');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Load local tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('localTasks');
    if (savedTasks) {
      setLocalTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Save local tasks to localStorage whenever they change
  useEffect(() => {
    if (!user) {
      localStorage.setItem('localTasks', JSON.stringify(localTasks));
    }
  }, [localTasks, user]);

  // Obtener usuario y cargar tareas al montar el componente
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        dispatch(fetchTasks());
      } else {
        // Cargar tareas locales si no hay usuario
        const savedTasks = localStorage.getItem('localTasks');
        if (savedTasks) {
          setLocalTasks(JSON.parse(savedTasks));
        }
      }
    };
    loadData();

    // Escuchar cambios en localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'localTasks') {
        const newTasks = e.newValue ? JSON.parse(e.newValue) : [];
        setLocalTasks(newTasks);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Escuchar evento personalizado para actualización local
    const handleLocalUpdate = () => {
      const savedTasks = localStorage.getItem('localTasks');
      if (savedTasks) {
        setLocalTasks(JSON.parse(savedTasks));
      }
    };

    window.addEventListener('localTasksUpdated', handleLocalUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localTasksUpdated', handleLocalUpdate);
    };
  }, [dispatch]);

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          dispatch(fetchTasks());
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, dispatch]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        handleCloseTaskDetails();
      }
    };

    if (selectedTask) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [selectedTask]);

  const handleToggleCompletion = async (task) => {
    if (!user) {
      // Handle local storage update
      setLocalTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === task.id ? { ...t, completed: !t.completed } : t
        )
      );
    } else {
      // Handle remote storage update
      dispatch(toggleTaskStatus(task.id, !task.completed));
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ completed: !task.completed })
          .eq('id', task.id);
        
        if (error) throw error;
      } catch (error) {
        dispatch(toggleTaskStatus(task.id, task.completed));
        console.error('Error updating task:', error);
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!user) {
      // Handle local storage delete
      setLocalTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
    } else {
      // Handle remote storage delete
      dispatch(deleteTask(taskId));
    }
  };

  const handleUpdateTask = async (task) => {
    if (!user) {
      // Handle local storage update
      setLocalTasks(prevTasks => 
        prevTasks.map(t => t.id === task.id ? task : t)
      );
    } else {
      // Handle remote storage update
      try {
        await dispatch(updateTask(task));
        const { error } = await supabase
          .from('tasks')
          .update(task)
          .eq('id', task.id);
        if (error) throw error;
      } catch (error) {
        await dispatch(updateTask(selectedTask));
        console.error('Error updating task:', error);
      }
    }
  };

  const toggleCompletedTasks = () => {
    setShowCompleted(!showCompleted);
  };

  const toggleIncompleteTasks = () => {
    setShowIncomplete(!showIncomplete);
  };

  const handleTaskDoubleClick = (task) => {
    setSelectedTask(task);
    setEditedTask({
      id: task.id,
      title: task.title,
      description: task.description || '',
      deadline: task.deadline,
      completed: task.completed,
      difficulty: task.difficulty,
      assignment: task.assignment || '',
      activetask: task.activetask || false,
      user_id: task.user_id
    });
    setIsEditing(true);
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
      // Optimistic update
      await dispatch(updateTask(editedTask));
      setSelectedTask(editedTask);
      setIsEditing(false);
      handleCloseTaskDetails(); // Close the modal after saving

      const { error } = await supabase
        .from('tasks')
        .update(editedTask)
        .eq('id', editedTask.id);

      if (error) throw error;
    } catch (error) {
      // Revert on error
      await dispatch(updateTask(selectedTask));
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

  const handleSetActiveTask = async (task) => {
    // Optimistic update
    const updatedTask = { ...task, activetask: true };
    dispatch(updateTask(updatedTask));
    handleCloseContextMenu();

    try {
      // Deactivate other active tasks
      const otherActiveTasks = tasks.filter(t => t.id !== task.id && t.activetask);
      await Promise.all(
        otherActiveTasks.map(t => 
          supabase
            .from('tasks')
            .update({ activetask: false })
            .eq('id', t.id)
        )
      );

      // Activate selected task
      const { error } = await supabase
        .from('tasks')
        .update({ activetask: true })
        .eq('id', task.id);

      if (error) throw error;
    } catch (error) {
      // Revert on error
      dispatch(updateTask(task));
      console.error('Error updating active task:', error);
    }
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

  // Add click outside listener for sort menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSortMenu) {
        const sortMenu = document.querySelector('.sort-menu');
        const sortButton = document.querySelector('.sort-button');
        if (sortMenu && !sortMenu.contains(e.target) && !sortButton?.contains(e.target)) {
          setShowSortMenu(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showSortMenu]);

  const sortTasks = (tasks) => {
    switch (sortBy) {
      case 'assignment':
        return [...tasks].sort((a, b) => {
          if (!a.assignment && !b.assignment) return 0;
          if (!a.assignment) return 1;
          if (!b.assignment) return -1;
          return a.assignment.localeCompare(b.assignment);
        });
      case 'deadline':
        return [...tasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      case 'difficulty':
        const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
        return [...tasks].sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
      case 'alphabetical':
        return [...tasks].sort((a, b) => a.title.localeCompare(b.title));
      default:
        return tasks;
    }
  };

  if (!user) {
    const localCompletedTasks = localTasks.filter(task => task.completed);
    const localIncompleteTasks = localTasks.filter(task => !task.completed);

    return (
      <div className="maincard">
        <h2 className="text-2xl font-bold mb-6">Your Tasks (Not syncing)</h2>
        {localIncompleteTasks.length === 0 && localCompletedTasks.length === 0 && (
          <div className="plslogin mb-6">
            You can add tasks but they will be stored locally. If you want to sync your tasks please sign in with your google account
          </div>
        )}

        {localIncompleteTasks.length === 0 && localCompletedTasks.length === 0 ? (
          <div>
          </div>
        ) : (
          <>
            {/* Incomplete Tasks */}
            {localIncompleteTasks.length > 0 && (
              <div className="space-y-4 mb-4">
                <button
                  className="infomenu mb-3"
                  onClick={toggleIncompleteTasks}
                >
                  <span>Incomplete Tasks ({localIncompleteTasks.length})</span>
                  {showIncomplete ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                <div className={`space-y-4 mt-2 overflow-hidden transition-all duration-300 ${showIncomplete ? 'visible' : 'hidden'}`}>
                  {sortTasks(localIncompleteTasks).map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleCompletion={handleToggleCompletion}
                      onDelete={handleDeleteTask}
                      onDoubleClick={handleTaskDoubleClick}
                      onContextMenu={handleContextMenu}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {localCompletedTasks.length > 0 && (
              <div>
                <button
                  className="infomenu mb-3"
                  onClick={toggleCompletedTasks}
                >
                  <span>Completed Tasks ({localCompletedTasks.length})</span>
                  {showCompleted ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                <div className={`space-y-4 mt-2 overflow-hidden transition-all duration-300 ${showCompleted ? 'visible' : 'hidden'}`}>
                  {sortTasks(localCompletedTasks).map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleCompletion={handleToggleCompletion}
                      onDelete={handleDeleteTask}
                      onDoubleClick={handleTaskDoubleClick}
                      onContextMenu={handleContextMenu}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  const userTasks = tasks.filter(task => task.user_id === user.id);
  const completedTasks = userTasks.filter(task => task.completed);
  const incompleteTasks = userTasks.filter(task => !task.completed);

  return (
    <div className="maincard relative">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2"><ClipboardCheck size={24} />Your Tasks</h2>
          <div className="relative">
            <button
              onClick={() => {
                toast.dismiss();
                setShowSortMenu(!showSortMenu);
              }}
              className="sort-button flex items-center gap-2 px-3 py-1.5 bg-neutral-800 text-text-secondary hover:bg-neutral-700 rounded-lg transition-colors duration-200 text-base"
            >
              <ArrowUpDown size={16} />
              Sort by{' '}
              <span className="text-accent-primary">
                {sortBy === 'default' ? 'Default' :
                 sortBy === 'assignment' ? 'Assignment' :
                 sortBy === 'deadline' ? 'Deadline' :
                 sortBy === 'difficulty' ? 'Difficulty' :
                 sortBy === 'alphabetical' ? 'A-Z' : ''}
              </span>
            </button>
            {showSortMenu && (
              <div className="sort-menu absolute right-0 mt-2 w-48 bg-neutral-900 rounded-lg shadow-lg z-10 border border-neutral-800">
                <button
                  onClick={() => {
                    setSortBy('default');
                    setShowSortMenu(false);
                  }}
                  className={`block px-4 py-2 w-full text-left hover:bg-neutral-800 transition-colors duration-200 ${
                    sortBy === 'default' ? 'bg-neutral-800' : ''
                  }`}
                >
                  Default
                </button>
                <button
                  onClick={() => {
                    setSortBy('assignment');
                    setShowSortMenu(false);
                  }}
                  className={`block px-4 py-2 w-full text-left hover:bg-neutral-800 transition-colors duration-200 ${
                    sortBy === 'assignment' ? 'bg-neutral-800' : ''
                  }`}
                >
                  Assignment
                </button>
                <button
                  onClick={() => {
                    setSortBy('deadline');
                    setShowSortMenu(false);
                  }}
                  className={`block px-4 py-2 w-full text-left hover:bg-neutral-800 transition-colors duration-200 ${
                    sortBy === 'deadline' ? 'bg-neutral-800' : ''
                  }`}
                >
                  Deadline
                </button>
                <button
                  onClick={() => {
                    setSortBy('difficulty');
                    setShowSortMenu(false);
                  }}
                  className={`block px-4 py-2 w-full text-left hover:bg-neutral-800 transition-colors duration-200 ${
                    sortBy === 'difficulty' ? 'bg-neutral-800' : ''
                  }`}
                >
                  Difficulty
                </button>
                <button
                  onClick={() => {
                    setSortBy('alphabetical');
                    setShowSortMenu(false);
                  }}
                  className={`block px-4 py-2 w-full text-left hover:bg-neutral-800 transition-colors duration-200 ${
                    sortBy === 'alphabetical' ? 'bg-neutral-800' : ''
                  }`}
                >
                  Alphabetical
                </button>
              </div>
            )}
          </div>
        </div>
        {selectedAssignment && (
          <span className="text-lg text-gray-400">{selectedAssignment}</span>
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
              <button
                className="infomenu mb-3"
                onClick={toggleIncompleteTasks}
              >
                <span>Incomplete Tasks ({incompleteTasks.length})</span>
                {showIncomplete ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              <div className={`space-y-4 mt-2 overflow-hidden transition-all duration-300 ${showIncomplete ? 'visible' : 'hidden'}`}>
                {sortTasks(incompleteTasks).map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleCompletion={handleToggleCompletion}
                    onDelete={handleDeleteTask}
                    onDoubleClick={handleTaskDoubleClick}
                    onContextMenu={handleContextMenu}
                  />
                ))}
              </div>
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
                {sortTasks(completedTasks).map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleCompletion={handleToggleCompletion}
                    onDelete={handleDeleteTask}
                    onDoubleClick={handleTaskDoubleClick}
                    onContextMenu={handleContextMenu}
                  />
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
                    <input
                      type="text"
                      value={editedTask.title}
                      onChange={(e) => handleEditChange('title', e.target.value)}
                      className="textinput w-full"
                    />
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-text-primary mb-2">Description</h4>
                    <textarea
                      value={editedTask.description || ''}
                      onChange={(e) => handleEditChange('description', e.target.value)}
                      className="textinput w-full"
                      rows="4"
                    />
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-text-primary mb-2">Status</h4>
                    <p className="text-text-secondary">
                      {selectedTask.completed ? 'Completed' : 'Pending'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-text-primary mb-2">Difficulty</h4>
                    <select
                      value={editedTask.difficulty}
                      onChange={(e) => handleEditChange('difficulty', e.target.value)}
                      className="textinput w-full"
                    >
                      <option value="easy" className="text-green-500">Easy</option>
                      <option value="medium" className="text-blue-500">Medium</option>
                      <option value="hard" className="text-red-500">Hard</option>
                    </select>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-text-primary mb-2">Assignment</h4>
                    <input
                      type="text"
                      value={editedTask.assignment || ''}
                      onChange={(e) => handleEditChange('assignment', e.target.value)}
                      className="textinput w-full"
                      placeholder="Enter assignment name"
                    />
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-text-primary mb-2">Deadline</h4>
                    <input
                      type="date"
                      value={editedTask.deadline}
                      onChange={(e) => handleEditChange('deadline', e.target.value)}
                      className="textinput w-full"
                    />
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-text-primary mb-2">Created At</h4>
                    <p className="text-text-secondary">
                      {moment(selectedTask.created_at).format('MMMM D, YYYY h:mm A')}
                    </p>
                  </div>

                  <div className="flex justify-end gap-4 mt-6">
                    <button
                      onClick={() => handleDeleteTask(selectedTask.id)}
                      className="text-red-500 hover:text-red-600 transition-colors duration-200 flex items-center gap-2"
                    >
                      <Trash2 size={20} />
                      Delete Task
                    </button>
                    {selectedTask.activetask ? (
                      <button
                        onClick={() => {
                          const updatedTask = { ...selectedTask, activetask: false };
                          dispatch(updateTask(updatedTask));
                          handleCloseTaskDetails();
                        }}
                        className="text-gray-400 hover:text-gray-300 transition-colors duration-200 flex items-center gap-2"
                      >
                        <Play size={20} className="rotate-180" />
                        Deactivate Task
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSetActiveTask(selectedTask)}
                        className="text-gray-400 hover:text-gray-300 transition-colors duration-200 flex items-center gap-2"
                      >
                        <Play size={20} />
                        Set as Active Task
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleCompletion(selectedTask)}
                      className="text-gray-400 hover:text-gray-300 transition-colors duration-200 flex items-center gap-2"
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
                    <button
                      onClick={handleSaveEdit}
                      className="text-green-500 hover:text-green-600 transition-colors duration-200 flex items-center gap-2"
                    >
                      <Save size={20} />
                      Save Changes
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
                {contextMenu.task.activetask ? (
                  <button
                    onClick={() => {
                      const updatedTask = { ...contextMenu.task, activetask: false };
                      dispatch(updateTask(updatedTask));
                      handleCloseContextMenu();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-yellow-500 hover:bg-neutral-800 rounded-md flex items-center gap-2"
                  >
                    <Play size={16} className="rotate-180" />
                    Deactivate Task
                  </button>
                ) : (
                  <button
                    onClick={() => handleSetActiveTask(contextMenu.task)}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 rounded-md flex items-center gap-2"
                  >
                    <Play size={16} />
                    Set as Active Task
                  </button>
                )}
                <button
                  onClick={() => {
                    handleDeleteTask(contextMenu.task.id);
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

          {/* Start Session Modal */}
          {showTaskMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm"
              onClick={() => setShowTaskMenu(false)}
            >
              <div className="maincard max-w-2xl w-full mx-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-center flex-1">
                    Start Session
                  </h3>
                  <button
                    className="text-gray-400 hover:text-white transition duration-200"
                    onClick={() => setShowTaskMenu(false)}
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-text-primary mb-2">Select Task</h4>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                      {tasks.filter(task => !task.completed && task.user_id === user.id).map((task) => (
                        <button
                          key={task.id}
                          onClick={() => {
                            handleSetActiveTask(task);
                            setShowTaskMenu(false);
                          }}
                          className={`w-full p-4 rounded-lg text-left transition-colors duration-200 ${
                            task.activetask
                              ? 'bg-accent-primary bg-opacity-10 border border-accent-primary'
                              : 'hover:bg-neutral-800 border border-neutral-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Circle className={`${
                                task.difficulty === 'easy' ? 'text-green-500' :
                                task.difficulty === 'medium' ? 'text-blue-500' :
                                'text-red-500'
                              }`} size={20} />
                              <span className="font-medium text-text-primary">{task.title}</span>
                            </div>
                            {task.activetask && (
                              <span className="text-accent-primary text-sm">Active</span>
                            )}
                          </div>
                          {task.description && (
                            <p className="mt-2 text-text-secondary text-sm line-clamp-2">{task.description}</p>
                          )}
                          <div className="mt-2 flex items-center gap-4 text-sm text-text-secondary">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>{new Date(task.deadline).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}</span>
                            </div>
                            {task.assignment && (
                              <span>{task.assignment}</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default TaskList;
