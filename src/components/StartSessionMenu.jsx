import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Play, Pause, Cloud, CloudRain, Waves, X } from 'lucide-react';
import { updateTask } from '../redux/TaskActions';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import * as Tone from 'tone';

const StartSessionMenu = ({ isOpen = false, onClose = () => {} }) => {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.tasks);
  const user = useSelector((state) => state.auth.user);

  const [selectedTask, setSelectedTask] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTools, setActiveTools] = useState({
    pomodoro: false,
    brownNoise: false,
    rainNoise: false,
    oceanNoise: false
  });

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedTask('');
      setIsPlaying(false);
      setActiveTools({
        pomodoro: false,
        brownNoise: false,
        rainNoise: false,
        oceanNoise: false
      });
    }
  }, [isOpen]);

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
    if (!user) {
      toast.error('Please log in to start a session');
      return;
    }

    if (!selectedTask) {
      toast.error('Please select a task first');
      return;
    }

    try {
      // Start Tone.js AudioContext
      await Tone.start();
      console.log('AudioContext started');

      // Convert selectedTask to number for comparison
      const taskId = parseInt(selectedTask);
      const taskToUpdate = tasks.find(t => t.id === taskId);
      if (!taskToUpdate) {
        toast.error('Selected task not found');
        return;
      }

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

      // Start selected tools
      if (activeTools.pomodoro) {
        // Dispatch an action to start the Pomodoro timer
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

      setIsPlaying(true);
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
        await dispatch(updateTask({
          ...activeTask,
          activetask: false
        }));
      }

      // Stop all tools
      window.dispatchEvent(new CustomEvent('stopPomodoro'));
      window.dispatchEvent(new CustomEvent('stopBrownNoise'));
      window.dispatchEvent(new CustomEvent('stopRainNoise'));
      window.dispatchEvent(new CustomEvent('stopOceanWaves'));

      setIsPlaying(false);
      setSelectedTask('');
      setActiveTools({
        pomodoro: false,
        brownNoise: false,
        rainNoise: false,
        oceanNoise: false
      });
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

  const userTasks = user ? tasks.filter(task => task.user_id === user.id && !task.completed) : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm"
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
          {!user ? (
            <div className="text-center py-8">
              <p className="text-text-secondary text-lg mb-4">Please log in to start a session</p>
              <button
                onClick={onClose}
                className="textbutton"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-base font-medium text-text-secondary mb-2">
                  Select Task
                </label>
                <select
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  className="textinput"
                  disabled={isPlaying}
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
                <label className="block text-base font-medium text-text-secondary mb-2">
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
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg transition-colors duration-200 ${
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

              <div className="flex justify-center mt-6">
                {!isPlaying ? (
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
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StartSessionMenu; 