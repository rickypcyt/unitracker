import { AlertCircle, CheckCircle, Clock, Loader2, Target, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Task } from '@/pages/tasks/task';
import TaskForm from '@/pages/tasks/TaskForm';
import { supabase } from '@/utils/supabaseClient';
import { toast } from 'react-hot-toast';

interface FinishSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (selectedTasks: string[]) => void;
  sessionId: string;
  onSessionDetailsUpdated?: () => void;
}

interface SessionStats {
  duration: string;
  tasksCompleted: number;
  pomodorosCompleted: number;
  startedAt: string;
}

const FinishSessionModal: React.FC<FinishSessionModalProps> = ({ isOpen, onClose, onFinish, sessionId, onSessionDetailsUpdated }) => {
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [lastAddedTaskId, setLastAddedTaskId] = useState<string | null>(null);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTaskSelector, setShowTaskSelector] = useState(false);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchSessionDetails();
      fetchSessionTasks();
      fetchSessionStats();
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    if (lastAddedTaskId) {
      setSelectedTasks(prev => [...prev, lastAddedTaskId]);
      setLastAddedTaskId(null);
      fetchSessionTasks();
    }
  }, [lastAddedTaskId]);

  const fetchSessionStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: session, error } = await supabase
        .from('study_laps')
        .select('duration, pomodoros_completed, tasks_completed, started_at')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching session stats:', error);
        setError('Failed to load session statistics');
        return;
      }

      if (session) {
        // Use the same authoritative daily count as Pomodoro hover
        let pomodorosToday = 0;
        try {
          const today = new Date().toISOString().split('T')[0];
          pomodorosToday = parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || '0', 10) || 0;
        } catch {}

        setSessionStats({
          duration: session.duration || '00:00:00',
          tasksCompleted: session.tasks_completed || 0,
          pomodorosCompleted: pomodorosToday,
          startedAt: session.started_at
        });
      }
    } catch (error) {
      console.error('Error in fetchSessionStats:', error);
      setError('Failed to load session statistics');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleTaskFormClose = (newTaskId?: string) => {
    setShowTaskForm(false);
    if (newTaskId) {
      setLastAddedTaskId(newTaskId);
    }
  };

  const handleAddTaskToFinished = (task: Task) => {
    // Add task to active tasks
    setActiveTasks(prev => [...prev, task]);
    setAvailableTasks(prev => prev.filter(t => t.id !== task.id));
    
    // Add to session_tasks table
    supabase
      .from('session_tasks')
      .insert({
        session_id: sessionId,
        task_id: task.id,
        started_at: new Date().toISOString()
      })
      .then(({ error }) => {
        if (error) {
          console.error('Error adding task to session:', error);
        }
      });
  };

  const handleRemoveTaskFromFinished = (task: Task) => {
    // Remove from active tasks
    setActiveTasks(prev => prev.filter(t => t.id !== task.id));
    setAvailableTasks(prev => [...prev, task]);
    
    // Remove from selected tasks if it was selected
    setSelectedTasks(prev => prev.filter(id => id !== task.id));
    
    // Remove from session_tasks table
    supabase
      .from('session_tasks')
      .delete()
      .eq('session_id', sessionId)
      .eq('task_id', task.id)
      .then(({ error }) => {
        if (error) {
          console.error('Error removing task from session:', error);
        }
      });
  };

  const formatDuration = (totalSeconds: number): string => {
    const roundedSeconds = Math.round(totalSeconds);
    const hours = Math.floor(roundedSeconds / 3600);
    const minutes = Math.floor((roundedSeconds % 3600) / 60);
    const seconds = roundedSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const getDurationFromTimer = (): string => {
    // Try to get current duration from StudyTimer state
    try {
      const savedState = localStorage.getItem('studyTimerState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.time && typeof parsed.time === 'number') {
          return formatDuration(parsed.time);
        }
      }
    } catch (e) {
      console.warn('Could not get duration from timer:', e);
    }
    return sessionStats?.duration || '00:00:00';
  };

  const handleFinish = async () => {
    try {
      setIsFinishing(true);
      setError(null);
      
      const endTime = new Date();
      
      // Get current duration from timer or use session stats
      const currentDuration = getDurationFromTimer();
      
      // Update session with proper duration format and task completion
      // Use the DAILY count as the authoritative value for pomodoros_completed
      let finalDailyPomos = 0;
      try {
        const today = new Date().toISOString().split('T')[0];
        finalDailyPomos = parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || '0', 10) || 0;
      } catch {}

      console.log('[FinishSessionModal] Attempting to finish session', {
        sessionId,
        currentDuration,
        tasksCompleted: selectedTasks.length,
        finalDailyPomos,
        endedAt: endTime.toISOString(),
      });

      const { error: updateError } = await supabase
        .from('study_laps')
        .update({
          duration: currentDuration,
          ended_at: endTime.toISOString(),
          description: sessionDescription.trim() || null,
          tasks_completed: selectedTasks.length,
          pomodoros_completed: finalDailyPomos
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('[FinishSessionModal] Error updating study_laps:', updateError);
        throw updateError;
      } else {
        console.log('[FinishSessionModal] ✅ study_laps updated successfully');
      }

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
      console.log('[FinishSessionModal] ✅ session_tasks updated for all active tasks');

      // Update task activetask status (set all to false)
      const { error: tasksUpdateError } = await supabase
        .from('tasks')
        .update({ 
          activetask: false,
          completed: true,
          completed_at: new Date().toISOString()
        })
        .in('id', activeTasks.map(t => t.id));

      if (tasksUpdateError) throw tasksUpdateError;

      if (onSessionDetailsUpdated) {
        onSessionDetailsUpdated();
      }

      console.log('[FinishSessionModal] ✅ Finish flow completed, closing modal');
      onFinish(selectedTasks);
      onClose();
    } catch (error) {
      console.error('Error finishing session:', error);
      setError('Failed to finish session. Please try again.');
      toast.error('Failed to finish session');
    } finally {
      setIsFinishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/60 dark:bg-black/70 flex items-center justify-center z-[10001] backdrop-blur-sm p-4">
      <div className="bg-[var(--bg-primary)] rounded-lg p-6 w-full max-w-3xl border-2 border-[var(--border-primary)] shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Finish Session</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Session Statistics */}
        <div className="mb-6 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Target size={18} />
            Session Statistics
          </h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="animate-spin text-[var(--accent-primary)]" size={20} />
              <span className="ml-2 text-[var(--text-secondary)]">Loading session data...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-red-500 py-2">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          ) : sessionStats ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-blue-500 mb-1">
                  <Clock size={16} />
                  <span className="text-2xl font-bold">{getDurationFromTimer()}</span>
                </div>
                <div className="text-sm text-[var(--text-secondary)]">Duration</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-green-500 mb-1">
                  <CheckCircle size={16} />
                  <span className="text-2xl font-bold">{selectedTasks.length}</span>
                </div>
                <div className="text-sm text-[var(--text-secondary)]">Tasks Completed</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-[var(--accent-primary)] mb-1">
                  <Target size={16} />
                  <span className="text-2xl font-bold">{sessionStats.pomodorosCompleted}</span>
                </div>
                <div className="text-sm text-[var(--text-secondary)]">Pomodoros Completed</div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mb-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="sessionTitle" className="block text-base font-medium text-[var(--text-secondary)] mb-2">
                Session Title
              </label>
              <input
                type="text"
                id="sessionTitle"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                placeholder="Session title"
                disabled
              />
            </div>

            <div>
              <label htmlFor="sessionDescription" className="block text-base font-medium text-[var(--text-secondary)] mb-2">
                Session Notes
              </label>
              <textarea
                id="sessionDescription"
                value={sessionDescription}
                onChange={(e) => setSessionDescription(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  rows={3}
                placeholder="Add notes about this session..."
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-[var(--text-primary)] flex items-center gap-2">
              <CheckCircle size={18} />
              Tasks Completed This Session
            </h3>
            <button
              onClick={() => setShowTaskSelector(true)}
              className="px-3 py-1 text-sm border border-[var(--accent-primary)] text-[var(--accent-primary)] rounded-lg hover:bg-[var(--accent-primary)]/10 transition-colors flex items-center gap-1"
            >
              <CheckCircle size={14} />
              Add Finished Tasks
            </button>
          </div>
          
          {activeTasks.length === 0 ? (
            <div className="text-center text-gray-400 py-6 text-lg font-medium bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
              No tasks were completed in this session.
              <div className="text-sm mt-2">
                Click "Add Finished Tasks" to mark tasks as completed.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {activeTasks.map(task => (
                <div 
                  key={task.id} 
                  className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]"
                >
                  <input
                    type="checkbox"
                    id={`task-${task.id}`}
                    checked={selectedTasks.includes(task.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTasks(prev => [...prev, task.id]);
                      } else {
                        setSelectedTasks(prev => prev.filter(id => id !== task.id));
                      }
                    }}
                    className="w-4 h-4 text-[var(--accent-primary)] border-[var(--border-primary)] rounded focus:ring-[var(--accent-primary)]"
                  />
                  <label 
                    htmlFor={`task-${task.id}`}
                    className="flex-1 text-[var(--text-primary)] cursor-pointer"
                  >
                    {task.title}
                  </label>
                  <button
                    onClick={() => handleRemoveTaskFromFinished(task)}
                    className="text-red-500 hover:text-red-400 transition-colors"
                    title="Remove from finished tasks"
                  >
                    <X size={16} />
                  </button>
                  <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-primary)] px-2 py-1 rounded">
                    {selectedTasks.includes(task.id) ? 'Marked as completed' : 'Not completed'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Task Selector Modal */}
        {showTaskSelector && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-primary)] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-[var(--border-primary)]">
              <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center sticky top-0 bg-[var(--bg-primary)] z-10">
                <h2 className="text-xl font-semibold">Add Finished Tasks</h2>
                <button 
                  onClick={() => setShowTaskSelector(false)}
                  className="p-1 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4">
                {availableTasks.length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-secondary)]">
                    No available tasks to add.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableTasks.map(task => (
                      <div 
                        key={task.id} 
                        className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)]/80 transition-colors"
                      >
                        <span className="flex-1 text-[var(--text-primary)]">{task.title}</span>
                        <button
                          onClick={() => handleAddTaskToFinished(task)}
                          className="px-3 py-1 text-sm bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary)]/90 transition-colors"
                        >
                          Add to Finished
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-[var(--border-primary)] flex justify-end">
                <button
                  onClick={() => setShowTaskSelector(false)}
                  className="px-4 py-2 border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isFinishing}
            className="cancel-button border-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleFinish}
            disabled={isFinishing || isLoading}
            className="px-4 py-2 border-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 border border-[var(--accent-primary)] bg-transparent text-[var(--accent-primary)] shadow-none hover:bg-transparent hover:text-[var(--accent-primary)] focus:bg-transparent focus:text-[var(--accent-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFinishing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Finishing...
              </>
            ) : (
              <span>Finish Session</span>
            )}
          </button>
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          onClose={handleTaskFormClose}
          onTaskCreated={(newTaskId: string) => {
            fetchSessionTasks();
            setSelectedTasks(prev => [...prev, newTaskId]);
          }}
        />
      )}
    </div>
  );
};

export default FinishSessionModal; 