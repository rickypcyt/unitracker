import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Play, Pause, Cloud, CloudRain, Waves, X } from 'lucide-react';
import { updateTask } from '../redux/TaskActions';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import * as Tone from 'tone';
import { useAuth } from '../hooks/useAuth';

const StartSessionMenu = ({ isOpen = false, onClose = () => {}, setIsPlaying }) => {
  const dispatch = useDispatch();
  const reduxTasks = useSelector((state) => state.tasks.tasks);
  const { user } = useAuth();
  const [localTasks, setLocalTasks] = useState([]);

  const [selectedTask, setSelectedTask] = useState('');
  const [menuIsPlaying, setMenuIsPlaying] = useState(false);
  const [activeTools, setActiveTools] = useState(() => {
    // Load saved tools from localStorage or use defaults
    const savedTools = localStorage.getItem('activeTools');
    return savedTools ? JSON.parse(savedTools) : {
      pomodoro: true,
      brownNoise: true,
      rainNoise: true,
      oceanNoise: true
    };
  });

  // Load local tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('localTasks');
    if (savedTasks) {
      setLocalTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Listen for changes in localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'localTasks') {
        const newTasks = e.newValue ? JSON.parse(e.newValue) : [];
        setLocalTasks(newTasks);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localTasksUpdated', () => {
      const savedTasks = localStorage.getItem('localTasks');
      if (savedTasks) {
        setLocalTasks(JSON.parse(savedTasks));
      }
    });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localTasksUpdated', handleStorageChange);
    };
  }, []);

  // Get the appropriate tasks based on user status
  const tasks = user ? reduxTasks : localTasks;
  const userTasks = user ? tasks.filter(task => task.user_id === user.id && !task.completed) : tasks.filter(task => !task.completed);

  // Update menuIsPlaying when tasks change
  useEffect(() => {
    setMenuIsPlaying(tasks.some(task => task.activetask));
  }, [tasks]);

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedTask('');
      // Don't reset menuIsPlaying or activeTools when closing
    } else {
      // Load saved tools when opening the menu
      const savedTools = localStorage.getItem('activeTools');
      if (savedTools) {
        setActiveTools(JSON.parse(savedTools));
      }
    }
  }, [isOpen]);

  // Save active tools to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('activeTools', JSON.stringify(activeTools));
  }, [activeTools]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleStartSession = async () => {
    try {
      // Start Tone.js AudioContext
      await Tone.start();
      console.log('AudioContext started');

      // If a task is selected, update it to be active
      if (selectedTask) {
        const taskId = parseInt(selectedTask);
        const taskToUpdate = tasks.find(t => t.id === taskId);
        if (taskToUpdate) {
          if (user) {
            // Handle remote storage update
            // Update the selected task to be active
            await dispatch(updateTask({
              id: taskToUpdate.id,
              title: taskToUpdate.title,
              description: taskToUpdate.description || '',
              deadline: taskToUpdate.deadline,
              completed: taskToUpdate.completed,
              difficulty: taskToUpdate.difficulty,
              assignment: taskToUpdate.assignment || '',
              activetask: true,
              user_id: taskToUpdate.user_id
            }));

            // Deactivate any other active tasks
            const otherTasks = tasks.filter(t => t.id !== taskId && t.activetask);
            for (const task of otherTasks) {
              await dispatch(updateTask({
                id: task.id,
                title: task.title,
                description: task.description || '',
                deadline: task.deadline,
                completed: task.completed,
                difficulty: task.difficulty,
                assignment: task.assignment || '',
                activetask: false,
                user_id: task.user_id
              }));
            }
          } else {
            // Handle local storage update
            const updatedTasks = localTasks.map(t => ({
              ...t,
              activetask: t.id === taskId
            }));
            localStorage.setItem('localTasks', JSON.stringify(updatedTasks));
            setLocalTasks(updatedTasks);
          }
        }
      }

      // Start selected tools
      if (activeTools.pomodoro) {
        window.dispatchEvent(new CustomEvent('startPomodoro'));
      }

      if (activeTools.brownNoise) {
        window.dispatchEvent(new CustomEvent('startBrownNoise'));
      }

      if (activeTools.rainNoise) {
        window.dispatchEvent(new CustomEvent('startRainNoise'));
      }

      if (activeTools.oceanNoise) {
        window.dispatchEvent(new CustomEvent('startOceanWaves'));
      }

      // Start StudyTimer
      window.dispatchEvent(new CustomEvent('startStudyTimer'));
      setIsPlaying(true);
      setMenuIsPlaying(true);
      toast.success('Session started successfully');
      onClose();
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start session');
    }
  };

  const handleStopSession = async () => {
    try {
      // Deactivate the current active task
      const activeTask = tasks.find(t => t.activetask);
      if (activeTask) {
        if (user) {
          // Handle remote storage update
          await dispatch(updateTask({
            ...activeTask,
            activetask: false
          }));
        } else {
          // Handle local storage update
          const updatedTasks = localTasks.map(t => ({
            ...t,
            activetask: false
          }));
          localStorage.setItem('localTasks', JSON.stringify(updatedTasks));
          setLocalTasks(updatedTasks);
        }
      }

      // Stop all tools
      window.dispatchEvent(new CustomEvent('stopPomodoro'));
      window.dispatchEvent(new CustomEvent('stopBrownNoise'));
      window.dispatchEvent(new CustomEvent('stopRainNoise'));
      window.dispatchEvent(new CustomEvent('stopOceanWaves'));
      window.dispatchEvent(new CustomEvent('stopStudyTimer'));

      setIsPlaying(false);
      setMenuIsPlaying(false);
      setSelectedTask('');
      // Don't reset activeTools when stopping session
      toast.success('Session stopped successfully');
      onClose();
    } catch (error) {
      console.error('Error stopping session:', error);
      toast.error('Failed to stop session');
    }
  };

  const toggleTool = (tool) => {
    setActiveTools(prev => ({
      ...prev,
      [tool]: !prev[tool]
    }));
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[99999] backdrop-blur-xl"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="maincard max-w-2xl w-full mx-4"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Start Session</h2>
          <button
            className="text-gray-400 hover:text-white transition duration-200"
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-lg font-medium text-text-secondary mb-2">
              Select Task
            </label>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="textinput"
              disabled={menuIsPlaying}
            >
              <option value="">Choose a task...</option>
              {userTasks.map(task => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-lg font-medium text-text-secondary mb-2">
              Tools
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => toggleTool('pomodoro')}
                disabled={menuIsPlaying}
                className={`flex items-center justify-center gap-2 p-2 rounded-lg transition-colors duration-200 ${
                  activeTools.pomodoro ? 'bg-accent-primary text-white' : 'bg-neutral-800 text-text-secondary hover:bg-neutral-700'
                } ${menuIsPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Play size={16} />
                Pomodoro
              </button>
              <button
                onClick={() => toggleTool('brownNoise')}
                disabled={menuIsPlaying}
                className={`flex items-center justify-center gap-2 p-2 rounded-lg transition-colors duration-200 ${
                  activeTools.brownNoise ? 'bg-accent-primary text-white' : 'bg-neutral-800 text-text-secondary hover:bg-neutral-700'
                } ${menuIsPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Cloud size={16} />
                Brown Noise
              </button>
              <button
                onClick={() => toggleTool('rainNoise')}
                disabled={menuIsPlaying}
                className={`flex items-center justify-center gap-2 p-2 rounded-lg transition-colors duration-200 ${
                  activeTools.rainNoise ? 'bg-accent-primary text-white' : 'bg-neutral-800 text-text-secondary hover:bg-neutral-700'
                } ${menuIsPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <CloudRain size={16} />
                Rain Noise
              </button>
              <button
                onClick={() => toggleTool('oceanNoise')}
                disabled={menuIsPlaying}
                className={`flex items-center justify-center gap-2 p-2 rounded-lg transition-colors duration-200 ${
                  activeTools.oceanNoise ? 'bg-accent-primary text-white' : 'bg-neutral-800 text-text-secondary hover:bg-neutral-700'
                } ${menuIsPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Waves size={16} />
                Ocean Waves
              </button>
            </div>
          </div>

          <div className="flex justify-center mt-6">
            {!menuIsPlaying ? (
              <button
                onClick={handleStartSession}
                className="textbutton"
              >
                <Play size={20} />
                Start Session
              </button>
            ) : (
              <button
                onClick={handleStopSession}
                className="textbutton bg-red-600 hover:bg-red-700"
              >
                <Pause size={20} />
                Stop Session
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StartSessionMenu; 