import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';

import { X, Plus, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import TaskForm from '../tools/TaskForm';
import { useDispatch } from 'react-redux';
import { toggleTaskStatus } from '../../store/actions/TaskActions';

const FinishSessionModal = ({ isOpen, onClose, onFinish, sessionId }) => {
  const [activeTasks, setActiveTasks] = useState([]); // Stores task objects
  const [availableTasks, setAvailableTasks] = useState([]); // Stores task objects
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [lastAddedTaskId, setLastAddedTaskId] = useState(null);
  const [sessionTitle, setSessionTitle] = useState(''); // State for session title
  const [sessionStartTime, setSessionStartTime] = useState(null); // Track session start time
  const dispatch = useDispatch();

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchSessionDetails();
      fetchSessionTasks(); // Fetch tasks linked to this session
      setSessionStartTime(new Date()); // Set start time when modal opens
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    if (lastAddedTaskId) {
      fetchSessionTasks(); // Refresh after adding a new task
      setLastAddedTaskId(null);
    }
  }, [lastAddedTaskId]);

  const fetchSessionDetails = async () => {
    try {
      const { data: session, error } = await supabase
        .from('study_laps')
        .select('description')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching session details:', error);
        return;
      }

      if (session) {
        setSessionTitle(session.description || 'Untitled Session');
      }
    } catch (error) {
      console.error('Error in fetchSessionDetails:', error);
    }
  };

  const fetchSessionTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch all incomplete tasks for the user
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

  const moveTask = async (task, toActive) => {
    try {
      if (toActive) {
        // Check if the link already exists (shouldn't happen with proper filtering, but safety)
        const { data: existingLink, error: fetchError } = await supabase
          .from('session_tasks')
          .select('*')
          .eq('session_id', sessionId)
          .eq('task_id', task.id)
          .maybeSingle();

        if (fetchError) {
          console.error('Error checking for existing session task link:', fetchError);
          return;
        }

        if (!existingLink) {
          // Move task from available to active in state AND add to session_tasks table
          const { error } = await supabase
            .from('session_tasks')
            .insert({
              session_id: sessionId,
              task_id: task.id,
              completed_at: new Date().toISOString() // Or null, depending on schema intention
            });

          if (error) {
            console.error('Error adding task to session:', error);
            return;
          }
        }

        // Update state after successful DB operation
        setAvailableTasks(prev => prev.filter(t => t.id !== task.id));
        setActiveTasks(prev => [...prev, task]);

      } else {
        // Move task from active to available in state AND remove from session_tasks table
        const { error } = await supabase
          .from('session_tasks')
          .delete()
          .match({
            session_id: sessionId,
            task_id: task.id
          });

        if (error) {
          console.error('Error removing task from session:', error);
          return;
        }

        // Update state after successful DB operation
        setActiveTasks(prev => prev.filter(t => t.id !== task.id));
        setAvailableTasks(prev => [...prev, task]); // Assuming you want it back in available
      }
    } catch (error) {
      console.error('Error moving task:', error);
    }
  };

  const handleTaskFormClose = (newTaskId) => {
    setShowTaskForm(false);
    if (newTaskId) {
      fetchSessionTasks(); // Refresh the list after adding a new task
      setLastAddedTaskId(newTaskId);
    }
  };

  const handleFinish = async () => {
    try {
      // Calculate session duration in minutes
      const endTime = new Date();
      const durationMinutes = Math.round((endTime - sessionStartTime) / (1000 * 60));

      // Update session with duration
      const { error: updateError } = await supabase
        .from('study_laps')
        .update({ duration: durationMinutes })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Error updating session duration:', updateError);
      }

      // Update tasks as completed
      const taskIdsToComplete = activeTasks.map(task => task.id);
      const completionPromises = taskIdsToComplete.map(taskId =>
        dispatch(toggleTaskStatus(taskId, true))
      );

      await Promise.all(completionPromises);
      console.log('Tasks marked as completed');
      onFinish(taskIdsToComplete);
      onClose();
    } catch (error) {
      console.error('Error finishing session:', error);
      onClose();
    }
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
            onClick={handleFinish}
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