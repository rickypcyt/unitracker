import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Play, Pause, Cloud, CloudRain, Waves, X } from 'lucide-react';
import { updateTask } from '../../redux/TaskActions';
import { setCalendarVisibility } from '../../redux/uiSlice';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import * as Tone from 'tone';
import { useAuth } from '../../hooks/useAuth';
import { useTaskManager } from '../../hooks/useTaskManager';

const StartSessionMenu = ({ isOpen = false, onClose = () => {}, setIsPlaying }) => {
  const dispatch = useDispatch();
  const { user, tasks, localTasks } = useTaskManager();
  const [selectedTask, setSelectedTask] = useState('');
  const [menuIsPlaying, setMenuIsPlaying] = useState(() => {
    // Load saved state from localStorage or use default
    const savedState = localStorage.getItem('menuState');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      return parsed.menuIsPlaying;
    }
    return false;
  });
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

  // Save menu state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('menuState', JSON.stringify({ menuIsPlaying }));
  }, [menuIsPlaying]);

  // Define tasks based on user authentication
  const allTasks = user ? tasks : localTasks;

  // Update menuIsPlaying when tasks change
  useEffect(() => {
    setMenuIsPlaying(allTasks.some(task => task.activetask));
  }, [allTasks]);

  // Listen for study timer state changes
  useEffect(() => {
    const handleStudyTimerStateChange = (event) => {
      setMenuIsPlaying(event.detail.isRunning);
    };

    window.addEventListener('studyTimerStateChanged', handleStudyTimerStateChange);
    return () => {
      window.removeEventListener('studyTimerStateChanged', handleStudyTimerStateChange);
    };
  }, []);

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

  // Add effect to handle calendar visibility when modal is shown/hidden
  useEffect(() => {
    if (isOpen) {
      dispatch(setCalendarVisibility(false));
    } else {
      dispatch(setCalendarVisibility(true));
    }
  }, [isOpen, dispatch]);

  const handleStartSession = async () => {
    try {
      // Start Tone.js AudioContext
      await Tone.start();
      console.log('AudioContext started');

      // If a task is selected, update it to be active
      if (selectedTask) {
        const taskId = parseInt(selectedTask);
        const taskToUpdate = allTasks.find(t => t.id === taskId);
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
            const otherTasks = allTasks.filter(t => t.id !== taskId && t.activetask);
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
            localStorage.setItem('localTasks', JSON.stringify(updatedTasks));
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
      const activeTask = allTasks.find(t => t.activetask);
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
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[99999] backdrop-blur-xl"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-neutral-900 rounded-lg p-6 w-full max-w-4xl mx-4 transform transition-transform duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {menuIsPlaying ? "Edit Session" : "Start Session"}
          </h2>
          <button
            className="text-neutral-400 hover:text-white"
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-neutral-400">
            {menuIsPlaying 
              ? "Configure your current session settings and tools."
              : "Select a task and configure your session tools before starting."}
          </p>
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
              {allTasks.map(task => (
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
                className={`flex items-center justify-center gap-2 p-2 rounded-lg transition-colors duration-200 ${
                  activeTools.pomodoro ? 'bg-accent-primary text-white' : 'bg-neutral-800 text-text-secondary hover:bg-neutral-700'
                }`}
              >
                <Play size={16} />
                Pomodoro
              </button>
              <button
                onClick={() => toggleTool('brownNoise')}
                className={`flex items-center justify-center gap-2 p-2 rounded-lg text-base transition-colors duration-200 ${
                  activeTools.brownNoise ? 'bg-accent-primary text-white' : 'bg-neutral-800 text-text-secondary hover:bg-neutral-700'
                }`}
              >
                <Cloud size={16} />
                Brown Noise
              </button>
              <button
                onClick={() => toggleTool('rainNoise')}
                className={`flex items-center justify-center gap-2 p-2 rounded-lg transition-colors duration-200 ${
                  activeTools.rainNoise ? 'bg-accent-primary text-white' : 'bg-neutral-800 text-text-secondary hover:bg-neutral-700'
                }`}
              >
                <CloudRain size={16} />
                Rain Noise
              </button>
              <button
                onClick={() => toggleTool('oceanNoise')}
                className={`flex items-center justify-center gap-2 p-2 rounded-lg transition-colors duration-200 ${
                  activeTools.oceanNoise ? 'bg-accent-primary text-white' : 'bg-neutral-800 text-text-secondary hover:bg-neutral-700'
                }`}
              >
                <Waves size={16} />
                Ocean Waves
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600"
            >
              Okay
            </button>
            {!menuIsPlaying && (
              <button
                onClick={handleStartSession}
                className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/80"
              >
                Start Session
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartSessionMenu; 