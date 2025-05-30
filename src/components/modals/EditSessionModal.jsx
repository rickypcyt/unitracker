import React, { useState, useEffect } from 'react';
import { X, Plus, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import TaskForm from '../tools/TaskForm';

const EditSessionModal = ({ isOpen, onClose, sessionId }) => {
  const [activeTasks, setActiveTasks] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [lastAddedTaskId, setLastAddedTaskId] = useState(null);
  const [sessionTitle, setSessionTitle] = useState('');
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
        setSessionTitle(session.title || 'Untitled Session');
      }
    } catch (error) {
      console.error('Error in fetchSessionDetails:', error);
    }
  };

  const moveTask = async (task, toActive) => {
    try {
      if (toActive) {
        // Primero verificamos si ya existe el enlace
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
          const { error } = await supabase
            .from('session_tasks')
            .insert({
              session_id: sessionId,
              task_id: task.id,
              completed_at: new Date().toISOString()
            });

          if (error) {
            console.error('Error adding task to session:', error);
            return;
          }
        }

        setAvailableTasks(prev => prev.filter(t => t.id !== task.id));
        setActiveTasks(prev => [...prev, task]);

      } else {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[99999] backdrop-blur-xl">
      <div 
        className="bg-neutral-900 rounded-lg p-6 w-full max-w-4xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">
              Edit Session{sessionTitle && <>: <span className="text-accent-primary">{sessionTitle}</span></>}
            </h2>
          </div>
          <button
            className="text-neutral-400 hover:text-white"
            onClick={onClose}
          >
            <X size={24} />
          </button>
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
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/80"
          >
            Save Changes
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

export default EditSessionModal; 