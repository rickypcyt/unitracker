import { ArrowLeft, ArrowRight, Plus, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import TaskForm from '../tools/TaskForm';
import TaskSelectionPanel from '../tools/TaskSelectionPanel';
import { supabase } from '../../config/supabaseClient';

const EditSessionModal = ({ isOpen, onClose, sessionId, onSessionDetailsUpdated }) => {
  const [activeTasks, setActiveTasks] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [lastAddedTaskId, setLastAddedTaskId] = useState(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [titleError, setTitleError] = useState(false);
  const [syncPomo, setSyncPomo] = useState(() => {
    return localStorage.getItem("syncPomoWithTimer") === "true";
  });

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchSessionTasks();
      fetchSessionDetails(sessionId);
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    if (lastAddedTaskId) {
      fetchSessionTasks();
      setLastAddedTaskId(null);
    }
  }, [lastAddedTaskId]);

  const fetchSessionTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch all tasks for the user
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
        return;
      }

      // Separate tasks based on activetask status
      const active = userTasks.filter(task => task.activetask);
      const available = userTasks.filter(task => !task.activetask);

      setActiveTasks(active);
      setAvailableTasks(available);
    } catch (error) {
      console.error('Error in fetchSessionTasks:', error);
      setActiveTasks([]);
      setAvailableTasks([]);
    }
  };

  const fetchSessionDetails = async (id) => {
    try {
      const { data: session, error } = await supabase
        .from('study_laps')
        .select('name')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching session details:', error);
        return;
      }

      if (session) {
        setSessionTitle(session.name || 'Untitled Session');
      }
    } catch (error) {
      console.error('Error in fetchSessionDetails:', error);
    }
  };

  const handleTaskMove = async (task, toActive) => {
    try {
      // Update the task in the database
      const { error } = await supabase
        .from('tasks')
        .update({ activetask: toActive })
        .eq('id', task.id);

      if (error) throw error;

      // Update local state
      if (toActive) {
        // Move from available to active
        setActiveTasks(prev => [...prev, { ...task, activetask: true }]);
        setAvailableTasks(prev => prev.filter(t => t.id !== task.id));
      } else {
        // Move from active to available
        setAvailableTasks(prev => [...prev, { ...task, activetask: false }]);
        setActiveTasks(prev => prev.filter(t => t.id !== task.id));
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      // Optionally show an error message to the user
    }
  };

  const handleTaskFormClose = (newTaskId) => {
    setShowTaskForm(false);
    if (newTaskId) {
      setLastAddedTaskId(newTaskId);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const { error } = await supabase
        .from('study_laps')
        .update({
          name: sessionTitle,
          description: sessionDescription
        })
        .eq('id', sessionId);

      if (error) throw error;

      if (onSessionDetailsUpdated) {
        onSessionDetailsUpdated();
      }

      onClose();
    } catch (error) {
      console.error('Error updating session:', error);
      // Optionally show a toast or error message here
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[99999] backdrop-blur-xl">
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 shadow-xl border border-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-neutral-900">
              Edit Session{sessionTitle && <>: <span className="text-[var(--accent-primary)]">{sessionTitle}</span></>}
            </h2>
          </div>
          <button
            className="text-neutral-500 hover:text-neutral-900"
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="sessionTitle" className="block text-sm font-medium text-neutral-900 mb-2">
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
              <label htmlFor="sessionDescription" className="block text-sm font-medium text-neutral-900 mb-2">
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
          activeTasks={activeTasks}
          availableTasks={availableTasks}
          onMoveTask={handleTaskMove}
          onAddTask={() => setShowTaskForm(true)}
          mode="move"
          showNewTaskButton={true}
          activeTitle="Active Tasks"
          availableTitle="Available Tasks"
        />

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary)]/80"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          onClose={handleTaskFormClose}
        />
      )}
    </div>
  );
};

export default EditSessionModal; 