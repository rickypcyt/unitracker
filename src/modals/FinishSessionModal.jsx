import React, { useEffect, useState } from 'react';

import TaskForm from '@/pages/tasks/TaskForm';
import TaskSelectionPanel from '@/pages/tasks/TaskSelectionPanel';
import { X } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';

const FinishSessionModal = ({ isOpen, onClose, onFinish, sessionId, onSessionDetailsUpdated }) => {
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [tasks, setTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [lastAddedTaskId, setLastAddedTaskId] = useState(null);
  const [titleError, setTitleError] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [activeTasks, setActiveTasks] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchSessionDetails();
      fetchSessionTasks();
      setSessionStartTime(new Date());
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    if (lastAddedTaskId) {
      setSelectedTasks(prev => [...prev, lastAddedTaskId]);
      setLastAddedTaskId(null);
      fetchSessionTasks();
    }
  }, [lastAddedTaskId]);

  const fetchSessionDetails = async () => {
    try {
      const { data: session, error } = await supabase
        .from('study_laps')
        .select('name, description, started_at')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching session details:', error);
        return;
      }

      if (session) {
        setSessionTitle(session.name || 'Untitled Session');
        setSessionDescription(session.description || '');
        setSessionStartTime(new Date(session.started_at));
      }
    } catch (error) {
      console.error('Error in fetchSessionDetails:', error);
    }
  };

  const fetchSessionTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch all tasks for the user (not completed)
      const { data: userTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Error fetching user tasks:', tasksError);
        setActiveTasks([]);
        setAvailableTasks([]);
        setSelectedTasks([]);
        return;
      }

      // Fetch session_tasks for this session
      const { data: sessionTasks, error: sessionTasksError } = await supabase
        .from('session_tasks')
        .select('task_id, completed_at')
        .eq('session_id', sessionId);

      if (sessionTasksError) {
        console.error('Error fetching session tasks:', sessionTasksError);
        setActiveTasks(userTasks.filter(t => t.activetask));
        setAvailableTasks(userTasks.filter(t => !t.activetask));
        setSelectedTasks([]);
        return;
      }

      // Mark as selected those tasks that are in session_tasks and completed
      const completedTaskIds = sessionTasks.filter(st => st.completed_at).map(st => st.task_id);

      setActiveTasks(userTasks.filter(t => t.activetask));
      setAvailableTasks(userTasks.filter(t => !t.activetask));
      setSelectedTasks(completedTaskIds);
    } catch (error) {
      console.error('Error in fetchSessionTasks:', error);
      setActiveTasks([]);
      setAvailableTasks([]);
      setSelectedTasks([]);
    }
  };

  const handleMoveTask = (task, toActive) => {
    if (toActive) {
      setActiveTasks(prev => [...prev, task]);
      setAvailableTasks(prev => prev.filter(t => t.id !== task.id));
    } else {
      setAvailableTasks(prev => [...prev, task]);
      setActiveTasks(prev => prev.filter(t => t.id !== task.id));
      setSelectedTasks(prev => prev.filter(id => id !== task.id)); // Unselect if moved to available
    }
  };

  const handleTaskFormClose = (newTaskId) => {
    setShowTaskForm(false);
    if (newTaskId) {
      setLastAddedTaskId(newTaskId);
    }
  };

  const handleFinish = async () => {
    try {
      const endTime = new Date();
      const durationMinutes = Math.round((endTime - sessionStartTime) / (1000 * 60));

      // Update session with duration and number of completed tasks
      const { error: updateError } = await supabase
        .from('study_laps')
        .update({
          duration: durationMinutes,
          description: sessionDescription.trim() || null,
          tasks_completed: selectedTasks.length
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      // Update task completion status in session_tasks
      const updatePromises = activeTasks.map(task => {
        const isCompleted = selectedTasks.includes(task.id);
        return supabase
          .from('session_tasks')
          .update({ completed_at: isCompleted ? new Date().toISOString() : null })
          .eq('session_id', sessionId)
          .eq('task_id', task.id);
      });

      await Promise.all(updatePromises);

      // Update task activetask status (set all to false)
      const { error: tasksUpdateError } = await supabase
        .from('tasks')
        .update({ activetask: false })
        .in('id', activeTasks.map(t => t.id));

      if (tasksUpdateError) throw tasksUpdateError;

      if (onSessionDetailsUpdated) {
        onSessionDetailsUpdated();
      }

      onFinish(selectedTasks);
      onClose();
    } catch (error) {
      console.error('Error finishing session:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-lg p-6 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Finish Session</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="sessionTitle" className="block text-sm font-medium text-neutral-500 mb-2">
                Session Title
              </label>
              <input
                type="text"
                id="sessionTitle"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                placeholder="Session title"
                disabled
              />
            </div>

            <div>
              <label htmlFor="sessionDescription" className="block text-sm font-medium text-neutral-500 mb-2">
                Session Notes
              </label>
              <textarea
                id="sessionDescription"
                value={sessionDescription}
                onChange={(e) => setSessionDescription(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                rows="3"
                placeholder="Add notes about this session..."
              />
            </div>
          </div>
        </div>

        <TaskSelectionPanel
          activeTasks={activeTasks}
          availableTasks={availableTasks}
          onMoveTask={handleMoveTask}
          onAddTask={() => setShowTaskForm(true)}
          mode="move"
          showNewTaskButton={true}
          activeTitle="Active Tasks"
          availableTitle="Available Tasks"
        />

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray hover:text-neutral-500"
          >
            Cancel
          </button>
          <button
            onClick={handleFinish}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary)]/80"
          >
            Finish Session
          </button>
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          onClose={handleTaskFormClose}
          onTaskCreated={(newTaskId) => {
            fetchSessionTasks();
            setSelectedTasks(prev => [...prev, newTaskId]);
          }}
        />
      )}
    </div>
  );
};

export default FinishSessionModal; 