import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { X, Plus } from 'lucide-react';
import TaskForm from '../tools/TaskForm';

const StartSessionModal = ({ isOpen, onClose, onStart }) => {
  const [tasks, setTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [lastAddedTaskId, setLastAddedTaskId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchTasks();
    }
  }, [isOpen]);

  useEffect(() => {
    if (lastAddedTaskId) {
      setSelectedTasks(prev => [...prev, lastAddedTaskId]);
      setLastAddedTaskId(null);
    }
  }, [lastAddedTaskId]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('completed', false)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setTasks(data);
    }
  };

  const handleTaskSelect = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleStart = () => {
    onStart({
      title: sessionTitle,
      description: sessionDescription,
      taskIds: selectedTasks
    });
    onClose();
  };

  const handleTaskFormClose = (newTaskId) => {
    setShowTaskForm(false);
    if (newTaskId) {
      setLastAddedTaskId(newTaskId);
      fetchTasks();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-lg p-6 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Start New Session</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Session Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">
                Session Title
              </label>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                placeholder="Enter session title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">
                Session Description
              </label>
              <textarea
                value={sessionDescription}
                onChange={(e) => setSessionDescription(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                placeholder="Enter session description"
                rows={8}
              />
            </div>
          </div>

          {/* Right Column - Tasks */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-neutral-400">
                Tasks
              </label>
              <button
                onClick={() => setShowTaskForm(true)}
                className="text-accent-primary hover:text-accent-primary/80 flex items-center gap-1"
              >
                <Plus size={16} />
                Add Task
              </button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedTasks.includes(task.id)
                      ? 'bg-accent-primary/20 border border-accent-primary'
                      : 'bg-neutral-800 hover:bg-neutral-700'
                  }`}
                  onClick={() => handleTaskSelect(task.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-neutral-400">{task.description}</div>
                      )}
                    </div>
                    {task.assignment && (
                      <div className="ml-4 px-2 py-1 bg-neutral-700/50 rounded text-sm text-neutral-300">
                        {task.assignment}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
            onClick={handleStart}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/80"
          >
            Start Session
          </button>
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-neutral-900 rounded-lg p-6 w-full max-w-md">
            <TaskForm
              onClose={handleTaskFormClose}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StartSessionModal; 