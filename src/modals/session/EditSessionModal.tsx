import { AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useUi, useUiActions } from '@/store/appStore';

import BaseModal from '@/modals/shared/BaseModal';
import { Task } from '@/pages/tasks/task';
import TaskForm from '@/pages/tasks/TaskForm';
import { supabase } from '@/utils/supabaseClient';

interface EditSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onSessionDetailsUpdated?: () => void;
}

const EditSessionModal: React.FC<EditSessionModalProps> = ({ isOpen, onClose, sessionId, onSessionDetailsUpdated }) => {
  const { syncPomodoroWithTimer, syncCountdownWithTimer } = useUi();
  const { setSyncPomodoroWithTimer, setSyncCountdownWithTimer } = useUiActions();
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [lastAddedTaskId, setLastAddedTaskId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [syncPomo, setSyncPomo] = useState(syncPomodoroWithTimer);
  const [syncCountdown, setSyncCountdown] = useState(syncCountdownWithTimer);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchSessionTasks();
      fetchSessionDetails(sessionId);
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    setSyncPomo(syncPomodoroWithTimer);
    setSyncCountdown(syncCountdownWithTimer);
  }, [syncPomodoroWithTimer, syncCountdownWithTimer, isOpen]);

  useEffect(() => {
    if (lastAddedTaskId) {
      fetchSessionTasks();
      setLastAddedTaskId(null);
    }
  }, [lastAddedTaskId]);

  const fetchSessionTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
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
        setError('Failed to load tasks');
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
      setError('Failed to load tasks');
      setActiveTasks([]);
      setAvailableTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSessionDetails = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: session, error } = await supabase
        .from('study_laps')
        .select('name, description')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching session details:', error);
        setError('Failed to load session details');
        return;
      }

      if (session) {
        setSessionTitle(session.name || 'Untitled Session');
        setSessionDescription(session.description || '');
      }
    } catch (error) {
      console.error('Error in fetchSessionDetails:', error);
      setError('Failed to load session details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTaskToActive = (task: Task) => {
    // Add task to active tasks
    setActiveTasks(prev => [...prev, task]);
    setAvailableTasks(prev => prev.filter(t => t.id !== task.id));
    
    // Update task in database
    supabase
      .from('tasks')
      .update({ activetask: true })
      .eq('id', task.id)
      .then(({ error }) => {
        if (error) {
          console.error('Error adding task to active:', error);
          // Revert on error
          setActiveTasks(prev => prev.filter(t => t.id !== task.id));
          setAvailableTasks(prev => [...prev, task]);
        }
      });
  };

  const handleRemoveTaskFromActive = (task: Task) => {
    // Remove from active tasks
    setActiveTasks(prev => prev.filter(t => t.id !== task.id));
    setAvailableTasks(prev => [...prev, task]);
    
    // Update task in database
    supabase
      .from('tasks')
      .update({ activetask: false })
      .eq('id', task.id)
      .then(({ error }) => {
        if (error) {
          console.error('Error removing task from active:', error);
          // Revert on error
          setActiveTasks(prev => [...prev, task]);
          setAvailableTasks(prev => prev.filter(t => t.id !== task.id));
        }
      });
  };

  const handleTaskFormClose = (newTaskId?: string) => {
    setShowTaskForm(false);
    if (newTaskId) {
      setLastAddedTaskId(newTaskId);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      const { error } = await supabase
        .from('study_laps')
        .update({
          name: sessionTitle,
          description: sessionDescription
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Guardar sincronización en Redux y localStorage
      setSyncPomodoroWithTimer(syncPomo);
      setSyncCountdownWithTimer(syncCountdown);

      if (onSessionDetailsUpdated) {
        onSessionDetailsUpdated();
      }

      onClose();
    } catch (error) {
      console.error('Error updating session:', error);
      setError('Failed to update session');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
    <BaseModal isOpen={isOpen} onClose={onClose} title="Edit Session" closeOnEsc={false} closeOnOverlayClick={false} maxWidth="max-w-3xl">
        {/* Error State */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Session Details Form */}
        <div className="mb-6">
          <div className="mb-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="sessionTitle" className="block text-base font-medium text-(--text-secondary) mb-2">
                  Session Title
                </label>
                <input
                  type="text"
                  id="sessionTitle"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-(--bg-secondary) border-2 border-(--border-primary) rounded-lg text-(--text-primary) focus:outline-none transition-colors"
                  placeholder="Enter session title"
                />
              </div>

              <div>
                <label htmlFor="sessionDescription" className="block text-base font-medium text-(--text-secondary) mb-2">
                  Session Notes (Optional)
                </label>
                <textarea
                  id="sessionDescription"
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-(--bg-secondary) border-2 border-(--border-primary) rounded-lg text-(--text-primary) focus:outline-none transition-colors"
                  rows={3}
                  placeholder="Add notes about this session..."
                />
              </div>
            </div>
          </div>


        {/* Active Tasks Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-(--text-primary) flex items-center gap-2">
                <CheckCircle size={18} />
                Active Tasks for This Session
              </h3>
              <button
                onClick={() => setShowTaskSelector(true)}
                className="px-3 py-1 text-sm border-2 border-(--accent-primary) text-(--accent-primary) rounded-lg hover:bg-(--accent-primary)/10 transition-colors flex items-center gap-1"
              >
                <CheckCircle size={14} />
                Add Tasks
              </button>
            </div>
            
            {activeTasks.length === 0 ? (
              <div className="text-center text-gray-400 py-6 text-lg font-medium bg-(--bg-secondary) rounded-lg border-2 border-(--border-primary)">
                No active tasks in this session.
                <div className="text-sm mt-2">
                  Click "Add Tasks" to add tasks to this session.
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {activeTasks.map(task => (
                  <div 
                    key={task.id} 
                    className="flex items-center gap-3 p-3 bg-(--bg-secondary) rounded-lg border-2 border-(--border-primary)"
                  >
                    <div className="w-4 h-4 rounded-full bg-(--accent-primary) flex items-center justify-center">
                      <CheckCircle size={12} className="text-white" />
                    </div>
                    <span className="flex-1 text-(--text-primary)">
                      {task.title}
                    </span>
                    <button
                      onClick={() => handleRemoveTaskFromActive(task)}
                      className="text-red-500 hover:text-red-400 transition-colors"
                      title="Remove from active tasks"
                    >
                      <X size={16} />
                    </button>
                    <span className="text-xs text-(--text-secondary) bg-(--bg-primary) px-2 py-1 rounded">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        {/* Task Selector Modal */}
        {showTaskSelector && (
          <BaseModal isOpen onClose={() => setShowTaskSelector(false)} title="Add Tasks to Session" closeOnOverlayClick={false} maxWidth="max-w-2xl" maxHeight="max-h-[80vh]">
              <div className="p-4">
                {availableTasks.length === 0 ? (
                  <div className="text-center py-8 text-(--text-secondary)">
                    No available tasks to add.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableTasks.map(task => (
                      <div 
                        key={task.id} 
                        className="flex items-center gap-3 p-3 bg-(--bg-secondary) rounded-lg border-2 border-(--border-primary) hover:bg-(--bg-secondary)/80 transition-colors"
                      >
                        <span className="flex-1 text-(--text-primary)">{task.title}</span>
                        <button
                          onClick={() => handleAddTaskToActive(task)}
                          className="px-3 py-1 text-sm border-2 border-(--accent-primary) text-(--accent-primary) bg-transparent rounded-lg hover:bg-(--accent-primary)/10 transition-colors"
                        >
                          Add to Session
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-(--border-primary) flex justify-between items-center">
                <button
                  onClick={() => {
                    setShowTaskSelector(false);
                    setShowTaskForm(true);
                  }}
                  className="px-3 py-1 text-sm border-2 border-(--accent-primary) text-(--accent-primary) rounded-lg hover:bg-(--accent-primary)/10 transition-colors flex items-center gap-1"
                >
                  <CheckCircle size={14} />
                  New Task
                </button>
                <button
                  onClick={() => setShowTaskSelector(false)}
                  className="px-4 py-2 border-2 border-(--border-primary) rounded-lg hover:bg-(--bg-secondary) transition-colors"
                >
                  Done
                </button>
              </div>
        </BaseModal>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="cancel-button border-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={isSaving || isLoading}
            className="px-4 py-2 border-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 border-2 border-(--accent-primary) bg-transparent text-(--accent-primary) shadow-none hover:bg-transparent hover:text-(--accent-primary) focus:bg-transparent focus:text-(--accent-primary) disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </BaseModal>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          onClose={handleTaskFormClose}
          onTaskCreated={(newTaskId: string) => {
            fetchSessionTasks();
            setLastAddedTaskId(newTaskId);
          }}
        />
      )}
    </>
  );
};

export default EditSessionModal; 