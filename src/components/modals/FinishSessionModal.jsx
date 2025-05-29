import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { X, Plus, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import TaskForm from '../tools/TaskForm';

const FinishSessionModal = ({ isOpen, onClose, onFinish, sessionId }) => {
  const [activeTasks, setActiveTasks] = useState([]); // Stores task objects
  const [availableTasks, setAvailableTasks] = useState([]); // Stores task objects
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [lastAddedTaskId, setLastAddedTaskId] = useState(null);
  const [sessionTitle, setSessionTitle] = useState(''); // State for session title

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchSessionTasks();
      fetchSessionDetails(sessionId); // Fetch session details
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    if (lastAddedTaskId) {
      // After adding a new task, refetch all tasks to update lists
      fetchSessionTasks();
      setLastAddedTaskId(null);
    }
  }, [lastAddedTaskId]);

  const fetchSessionTasks = async () => {
    try {
      // Get all uncompleted tasks
      const { data: allTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('completed', false)
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        return;
      }

      // Get tasks currently associated with this session
      const { data: sessionTaskLinks, error: sessionLinksError } = await supabase
        .from('session_tasks')
        .select('task_id')
        .eq('session_id', sessionId);

      if (sessionLinksError) {
        console.error('Error fetching session task links:', sessionLinksError);
        // Continue even if links fail, just won't have pre-selected tasks
      }

      const sessionTaskIds = sessionTaskLinks ? sessionTaskLinks.map(link => link.task_id) : [];

      // Separate tasks into active and available based on session links
      const active = allTasks.filter(task => sessionTaskIds.includes(task.id));
      const available = allTasks.filter(task => !sessionTaskIds.includes(task.id));

      setActiveTasks(active);
      setAvailableTasks(available);

    } catch (error) {
      console.error('Error in fetchSessionTasks:', error);
    }
  };

  const fetchSessionDetails = async (id) => {
    try {
      const { data: session, error } = await supabase
        .from('sessions')
        .select('title') // Select the title
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching session details:', error);
        return;
      }

      if (session) {
        setSessionTitle(session.title || 'Untitled Session'); // Set the title
      }
    } catch (error) {
      console.error('Error in fetchSessionDetails:', error);
    }
  };

  const moveTask = async (task, toActive) => {
    try {
      if (toActive) {
        // Check if the session_task link already exists
        const { data: existingLink, error: fetchError } = await supabase
          .from('session_tasks')
          .select('session_id')
          .eq('session_id', sessionId)
          .eq('task_id', task.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Error checking for existing session task link:', fetchError);
          return;
        }

        if (!existingLink) {
          // Add task to session_tasks table only if it doesn't exist
          const { error } = await supabase
            .from('session_tasks')
            .insert([{
              session_id: sessionId,
              task_id: task.id,
              completed_at: new Date().toISOString() // Set completed_at to now when task is moved to active
            }]);

          if (error) { console.error('Error adding task to session:', error); return; }
        }

        // Move task from available to active in state
        setAvailableTasks(prev => prev.filter(t => t.id !== task.id));
        setActiveTasks(prev => [...prev, task]);

      } else {
        // Remove task from session_tasks table
        const { error } = await supabase
          .from('session_tasks')
          .delete()
          .eq('session_id', sessionId)
          .eq('task_id', task.id);

        if (error) { console.error('Error removing task from session:', error); return; }

        // Move task from active to available in state
        setActiveTasks(prev => prev.filter(t => t.id !== task.id));
        setAvailableTasks(prev => [...prev, task]);
      }
    } catch (error) {
      console.error('Error moving task:', error);
    }
  };

  const handleTaskFormClose = (newTaskId) => {
    setShowTaskForm(false);
    if (newTaskId) {
      setLastAddedTaskId(newTaskId);
    }
  };

  const handleFinish = () => {
    // Pass only the IDs of the active tasks to the parent onFinish handler
    onFinish(activeTasks.map(task => task.id));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-lg p-6 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Complete Session{sessionTitle && <>: <span className="text-accent-primary">{sessionTitle}</span></>}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-neutral-400">
            Review and modify the tasks you completed during this session. Move tasks between columns to mark them as completed or not.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Active Tasks */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Active Tasks</h3>
              <span className="text-md text-neutral-400">
                {activeTasks.length} tasks
              </span>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {activeTasks.map(task => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg bg-accent-primary/20 border border-accent-primary"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-md text-neutral-400 mt-1">
                          {task.description}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => moveTask(task, false)}
                      className="p-1 hover:bg-neutral-700 rounded-full transition-colors"
                      title="Move to Available Tasks"
                    >
                      <ArrowLeft size={20} className="text-neutral-400" />
                    </button>
                  </div>
                </div>
              ))}
              {activeTasks.length === 0 && (
                <div className="text-center text-neutral-500 py-4">
                  No active tasks
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Available Tasks */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Available Tasks</h3>
              <button
                onClick={() => setShowTaskForm(true)}
                className="flex items-center gap-1 text-accent-primary hover:text-accent-primary/80"
              >
                <Plus size={20} />
                New Task
              </button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {availableTasks.map(task => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 cursor-pointer"
                  onClick={() => moveTask(task, true)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-md text-neutral-400 mt-1">
                          {task.description}
                        </div>
                      )}
                    </div>
                    <ArrowRight size={20} className="text-neutral-400" />
                  </div>
                </div>
              ))}
              {availableTasks.length === 0 && (
                <div className="text-center text-neutral-500 py-4">
                  No available tasks
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
            onClick={onClose}
            className="px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600"
          >
            Okay
          </button>
          <button
            onClick={handleFinish}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/80"
          >
            Finish Session
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

export default FinishSessionModal; 