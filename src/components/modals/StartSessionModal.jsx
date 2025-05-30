import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';

import { X, Plus, Check } from 'lucide-react';
import TaskForm from '../tools/TaskForm';
import TaskSelectionPanel from '../tools/TaskSelectionPanel';

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
  const [startPomodoro, setStartPomodoro] = useState(false);

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
      console.log('Fetching latest session for date:', today);
      
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
      console.log('Creating new session with number:', nextSessionNumber);

      // Check if a session with this title already exists today
      const { data: existingSession, error: checkError } = await supabase
        .from('study_laps')
        .select('id')
        .eq('name', sessionTitle.trim())
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking for existing session:', checkError);
      }

      if (existingSession) {
        console.warn('Session with this title already exists today:', existingSession);
        return;
      }

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
      console.log('Successfully created new session:', session.id);

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
        }
      }

      // If startPomodoro is true, dispatch the startPomodoro event
      if (startPomodoro) {
        window.dispatchEvent(new CustomEvent("startPomodoro"));
        window.dispatchEvent(new CustomEvent("pomodoroStartedWithSession"));
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

        <div className="mb-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="sessionTitle" className="block text-sm font-medium text-neutral-300 mb-1">
                Session Title
              </label>
              <input
                type="text"
                id="sessionTitle"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className={`w-full px-3 py-2 bg-neutral-800 border ${
                  titleError ? 'border-red-500' : 'border-neutral-700'
                } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary`}
                placeholder="Enter session title"
              />
              {titleError && (
                <p className="mt-1 text-sm text-red-500">Please enter a session title</p>
              )}
            </div>

            <div>
              <label htmlFor="sessionDescription" className="block text-sm font-medium text-neutral-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="sessionDescription"
                value={sessionDescription}
                onChange={(e) => setSessionDescription(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                rows="3"
                placeholder="Enter session description"
              />
            </div>
          </div>
        </div>

        <TaskSelectionPanel
          activeTasks={tasks.filter(task => selectedTasks.includes(task.id))}
          availableTasks={tasks.filter(task => !selectedTasks.includes(task.id))}
          onTaskSelect={handleTaskToggle}
          onAddTask={() => setShowTaskForm(true)}
          mode="select"
          selectedTasks={selectedTasks}
          showNewTaskButton={true}
        />

        <div className="mt-6 flex justify-end gap-2">
          <div className="flex items-center gap-2 mr-auto">
            <label className="flex items-center gap-2 text-neutral-400 cursor-pointer">
              <input
                type="checkbox"
                checked={startPomodoro}
                onChange={(e) => setStartPomodoro(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-accent-primary focus:ring-accent-primary"
              />
              <span>Start Pomodoro Timer</span>
            </label>
          </div>
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