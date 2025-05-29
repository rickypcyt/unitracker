import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';

import { X, Plus, Check } from 'lucide-react';
import TaskForm from '../tools/TaskForm';

const StartSessionModal = ({ isOpen, onClose, onStart }) => {
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [tasks, setTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [lastAddedTaskId, setLastAddedTaskId] = useState(null);
  const [titleError, setTitleError] = useState(false);
  const [syncPomo, setSyncPomo] = useState(() => {
    return localStorage.getItem("syncPomoWithTimer") === "true";
  });

  useEffect(() => {
    if (isOpen) {
      fetchTasks();
      setSessionTitle('');
      setSessionDescription('');
      setSelectedTasks([]);
      setTitleError(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (lastAddedTaskId) {
      setSelectedTasks(prev => [...prev, lastAddedTaskId]);
      setLastAddedTaskId(null);
      fetchTasks();
    }
  }, [lastAddedTaskId]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('completed', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      setTasks(data);
    } catch (error) {
      console.error('Error in fetchTasks:', error);
    }
  };

  const handleTaskToggle = (taskId) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

  const handleTaskFormClose = (newTaskId) => {
    setShowTaskForm(false);
    if (newTaskId) {
      setLastAddedTaskId(newTaskId);
    }
  };

  const handleStart = async () => {
    if (!sessionTitle.trim()) {
      setTitleError(true);
      return;
    }

    setTitleError(false);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Get today's date for session number calculation
      const today = new Date().toISOString().split("T")[0];
      const { data: latestSession, error: latestSessionError } = await supabase
        .from('study_laps')
        .select('session_number')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .order('session_number', { ascending: false })
        .limit(1)
        .single();

      if (latestSessionError && latestSessionError.code !== 'PGRST116') throw latestSessionError;

      // Calculate next session number
      const nextSessionNumber = latestSession ? Number(latestSession.session_number) + 1 : 1;

      const { data: session, error: sessionError } = await supabase
        .from('study_laps')
        .insert([{
          user_id: user.id,
          started_at: new Date().toISOString(),
          tasks_completed: 0,
          name: sessionTitle.trim(),
          description: sessionDescription.trim(),
          session_number: nextSessionNumber,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;

      if (selectedTasks.length > 0) {
        // Insert links into session_tasks table
        const { error: sessionTasksError } = await supabase
          .from('session_tasks')
          .insert(
            selectedTasks.map(taskId => ({
              session_id: session.id,
              task_id: taskId,
              completed_at: null // Tasks are not completed when session starts
            }))
          );

        if (sessionTasksError) throw sessionTasksError;

        // Update activetask status for selected tasks
        const { error: updateTasksError } = await supabase
          .from('tasks')
          .update({ activetask: true })
          .in('id', selectedTasks);

        if (updateTasksError) {
          console.error('Error updating tasks activetask status:', updateTasksError);
          // Decide how to handle this error - maybe still proceed or roll back session creation?
          // For now, we'll just log it.
        }
      }

      onStart({
        sessionId: session.id,
        tasks: selectedTasks,
        title: sessionTitle.trim()
      });
      onClose();
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const toggleSync = () => {
    const newSyncState = !syncPomo;
    setSyncPomo(newSyncState);
    localStorage.setItem("syncPomoWithTimer", newSyncState.toString());
    window.dispatchEvent(new CustomEvent("syncPomoStateChanged", { detail: { isSynced: newSyncState } }));
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
          <div>
            <div className="mb-4">
              <label className="block text-base font-medium text-neutral-400 mb-2">
                Session Title
              </label>
              {titleError && (
                <p className="text-red-500 text-md mb-1">Please insert session title</p>
              )}
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => { setSessionTitle(e.target.value); setTitleError(false); }}
                placeholder="Enter session title"
                className={`w-full px-3 py-2 bg-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 ${titleError ? 'border border-red-500' : 'focus:ring-accent-primary'}`}
              />
            </div>

            <div className="mb-4">
              <label className="block text-base font-medium text-neutral-400 mb-2">
                Description
              </label>
              <textarea
                value={sessionDescription}
                onChange={(e) => setSessionDescription(e.target.value)}
                placeholder="Enter session description"
                rows={3}
                className="w-full px-3 py-2 bg-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>

            <div className="mb-4">
              <p className="text-neutral-400 mb-2">
                Sync with Pomodoro
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSync}
                  className={`p-1 rounded-full transition-colors ${
                    syncPomo ? "text-accent-primary" : "text-neutral-400"
                  }`}
                  aria-label={syncPomo ? "Disable Pomodoro sync" : "Enable Pomodoro sync"}
                >
                  {syncPomo ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 12l2 2 6-6" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  )}
                </button>
                <span className="text-neutral-400">Sync Study Timer with Pomodoro</span>
              </div>
            </div>
          </div>

          {/* Right Column - Task Selection */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Select Tasks</h3>
              <button
                onClick={() => setShowTaskForm(true)}
                className="flex items-center gap-1 text-accent-primary hover:text-accent-primary/80"
              >
                <Plus size={20} />
                New Task
              </button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedTasks.includes(task.id)
                      ? 'bg-accent-primary/20 border border-accent-primary'
                      : 'bg-neutral-800 hover:bg-neutral-700'
                  }`}
                  onClick={() => handleTaskToggle(task.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-neutral-400 mt-1">
                          {task.description}
                        </div>
                      )}
                    </div>
                    {selectedTasks.includes(task.id) && (
                      <Check size={20} className="text-accent-primary" />
                    )}
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-center text-neutral-500 py-4">
                  No tasks available
                </div>
              )}
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
              onTaskCreated={(newTaskId) => {
                fetchTasks();
                setSelectedTasks(prev => [...prev, newTaskId]);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StartSessionModal; 