import { Check, Square } from 'lucide-react';
import { FormActions, FormInput, FormTextarea } from '@/modals/FormElements';
import { useCallback, useEffect, useState, Dispatch, SetStateAction } from 'react';

import AutocompleteInput from '@/modals/AutocompleteInput';
import BaseModal from '@/modals/BaseModal';
import TaskForm from '@/pages/tasks/TaskForm';
import TaskSelectionPanel from '@/pages/tasks/TaskSelectionPanel';
import UnfinishedSessionsModal from './UnfinishedSessionsModal';
import { supabase } from '@/utils/supabaseClient';
import { useDispatch, useSelector } from 'react-redux';
import { updateLap } from '@/store/LapActions';
import { AppDispatch, RootState } from '@/store/store';

interface StartSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (params: { 
    sessionId?: string; 
    tasks?: string[]; 
    title: string; 
    syncPomo?: boolean; 
    syncCountdown?: boolean 
  }) => void;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignment?: string;
  activetask?: boolean;
}

const StartSessionModal = ({ isOpen, onClose, onStart }: StartSessionModalProps) => {
  const syncPomodoroWithTimer = useSelector((state: RootState) => state.ui.syncPomodoroWithTimer);
  const syncCountdownWithTimer = useSelector((state: RootState) => state.ui.syncCountdownWithTimer);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [lastAddedTaskId, setLastAddedTaskId] = useState<string | null>(null);
  const [titleError, setTitleError] = useState(false);
  const [assignment, setAssignment] = useState('');
  const [assignments, setAssignments] = useState<string[]>([]);
  const [syncPomo, setSyncPomo] = useState(syncPomodoroWithTimer);
  const [syncCountdown, setSyncCountdown] = useState(syncCountdownWithTimer);
  const [hasUnfinishedSessions, setHasUnfinishedSessions] = useState(false);
  const [showUnfinishedSessions, setShowUnfinishedSessions] = useState(false);
  const [isCheckingSessions, setIsCheckingSessions] = useState(true);
  const dispatch = useDispatch<AppDispatch>();

  const fetchSessionTasks = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, []);

  const handleTaskCreated = useCallback(async (newTask: Task) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Add the new task to the tasks list
      setTasks(prev => [newTask, ...prev]);
      
      // If the task is active, add it to selectedTasks
      if (newTask.activetask) {
        setSelectedTasks(prev => [...prev, newTask.id]);
      }
      
      // Update assignments list if needed
      if (newTask.assignment && !assignments.includes(newTask.assignment)) {
        setAssignments(prev => [...prev, newTask.assignment as string].sort() as string[]);
      }
      
      setShowTaskForm(false);
    } catch (error) {
      console.error('Error handling new task:', error);
    }
  }, [assignments]);

  const fetchAssignments = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('assignment')
        .not('assignment', 'is', null)
        .eq('user_id', user.id)
        .order('assignment');

      if (error) throw error;
      
      const uniqueAssignments = Array.from(new Set(data.map((task: { assignment: string }) => task.assignment)));
      setAssignments(uniqueAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  }, []);

  const resetForm = useCallback(() => {
    fetchSessionTasks();
    setSessionTitle('');
    setSessionDescription('');
    setSelectedTasks([]);
    setAssignment('');
    setTitleError(false);
    fetchAssignments();
  }, [fetchSessionTasks, fetchAssignments]);

  const checkUnfinishedSessions = useCallback(async () => {
    if (!isOpen) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('study_laps')
        .select('id')
        .is('end_time', null)
        .eq('user_id', user.id)
        .limit(1);

      if (error) throw error;
      
      setHasUnfinishedSessions(data ? data.length > 0 : false);
      setShowUnfinishedSessions(data ? data.length > 0 : false);
    } catch (error) {
      console.error('Error checking for unfinished sessions:', error);
    } finally {
      setIsCheckingSessions(false);
    }
  }, [isOpen]);

  const handleSessionResumed = useCallback((sessionId: string) => {
    if (sessionId) {
      onStart({ 
        sessionId, 
        title: sessionTitle || 'Untitled Session', 
        syncPomo, 
        syncCountdown 
      });
    } else {
      setShowUnfinishedSessions(false);
    }
  }, [onStart, sessionTitle, syncPomo, syncCountdown]);

  const handleFinishAllSessions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date().toISOString();
      
      const { data: sessions, error: fetchError } = await supabase
        .from('study_laps')
        .select('id, started_at')
        .is('end_time', null)
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;
      
      if (!sessions || sessions.length === 0) {
        setHasUnfinishedSessions(false);
        setShowUnfinishedSessions(false);
        return;
      }
      
      const updates = sessions.map(session => {
        const duration = Math.floor((new Date(now).getTime() - new Date(session.started_at).getTime()) / 1000);
        return dispatch(updateLap(session.id, { 
          end_time: now,
          duration,
          status: 'completed' 
        }));
      });

      await Promise.all(updates);
      setHasUnfinishedSessions(false);
      setShowUnfinishedSessions(false);
    } catch (error) {
      console.error('Error finishing all sessions:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      setIsCheckingSessions(true);
      checkUnfinishedSessions();
    } else {
      setShowUnfinishedSessions(false);
      setHasUnfinishedSessions(false);
      setIsCheckingSessions(false);
    }
  }, [isOpen, checkUnfinishedSessions, resetForm]);

  useEffect(() => {
    setSyncPomo(syncPomodoroWithTimer);
    setSyncCountdown(syncCountdownWithTimer);
  }, [syncPomodoroWithTimer, syncCountdownWithTimer, isOpen]);

  useEffect(() => {
    if (lastAddedTaskId) {
      setSelectedTasks(prev => [...prev, lastAddedTaskId]);
      setLastAddedTaskId(null);
      fetchSessionTasks();
    }
  }, [lastAddedTaskId]);

  const handleMoveTask = (task: Task, toActive: boolean) => {
    setSelectedTasks(prev => {
      if (toActive) {
        // Add task ID to selectedTasks if moving to active column
        if (!prev.includes(task.id)) {
          return [...prev, task.id];
        }
      } else {
        // Remove task ID from selectedTasks if moving to available column
        return prev.filter(id => id !== task.id);
      }
      return prev; // Return previous state if no change
    });
  };

  const handleTaskFormClose = (newTaskId) => {
    const handleTaskAdded = useCallback((newTaskId: string) => {
      setLastAddedTaskId(newTaskId);
    }, []); 
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartSession = () => {
    if (!sessionTitle.trim()) {
      setTitleError(true);
      return;
    }
    
    onStart({
      tasks: selectedTasks,
      title: sessionTitle,
      syncPomo,
      syncCountdown,
    });
    
    onClose();
  };

  const handleStart = async () => {
    if (!sessionTitle.trim()) {
      setTitleError(true);
      return;
    }

    setTitleError(false);

    try {
      if (isSubmitting) return;
      setIsSubmitting(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Get today's date for session number calculation
      const today = new Date().toISOString().split("T")[0];
      console.warn('Fetching latest session for date:', today);

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
      console.warn('Creating new session with number:', nextSessionNumber);

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
        // Reuse existing session: start timer with it and close modal
        onStart({
          sessionId: existingSession.id,
          tasks: selectedTasks,
          title: sessionTitle.trim(),
          syncPomo,
          syncCountdown
        });
        onClose();
        setIsSubmitting(false);
        return;
      }

      // Create the new session
      const { data: session, error: sessionError } = await supabase
        .from('study_laps')
        .insert([{
          user_id: user.id,
          started_at: new Date().toISOString(),
          tasks_completed: 0, // Will be updated on finish
          name: sessionTitle.trim(),
          description: sessionDescription.trim(),
          session_number: nextSessionNumber,
          created_at: new Date().toISOString(),
          session_assignment: assignment || null,
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;
      console.warn('Successfully created new session:', session.id);

      // Link selected tasks to the new session and set activetask to true
      if (selectedTasks.length > 0) {
        // Insert links into session_tasks table
        const { error: sessionTasksError } = await supabase
          .from('session_tasks')
          .insert(
            selectedTasks.map(taskId => ({
              session_id: session.id,
              task_id: taskId,
              completed_at: null // Not completed when session starts
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

      // Pass the created session details back to StudyTimer
      onStart({
        sessionId: session.id,
        tasks: selectedTasks,
        title: sessionTitle.trim(),
        syncPomo,
        syncCountdown
      });

      // Close the modal after successful session start
      onClose();
      setIsSubmitting(false);

    } catch (error) {
      console.error('Error starting session:', error);
      // Optionally show a toast or error message
      setIsSubmitting(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (isOpen) {
      fetchSessionTasks();
      fetchAssignments();
    }
  }, [isOpen, fetchSessionTasks, fetchAssignments]);

  if (!isOpen) return null;

  if (isCheckingSessions) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-[var(--bg-primary)] rounded-xl p-8 max-w-md w-full mx-4 border border-[var(--border-primary)]">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)]"></div>
            <p className="text-[var(--text-primary)]">Checking for unfinished sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (showUnfinishedSessions) {
    return (
      <UnfinishedSessionsModal
        isOpen={showUnfinishedSessions}
        onClose={() => setShowUnfinishedSessions(false)}
        onSessionResumed={handleSessionResumed}
        onFinishAllSessions={handleFinishAllSessions}
      />
    );
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Start Study Session"
      className="max-w-2xl"
    >
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
            <div className="flex-1">
              <label htmlFor="session-title" className="block text-base font-bold text-[var(--text-primary)] mb-2 text-center">
                Title
              </label>
              <FormInput
                id="session-title"
                label="Session Title"
                value={sessionTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSessionTitle(e.target.value)}
                error={titleError ? 'Please enter a session title' : ''}
                required
                placeholder="Enter session title"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="assignment" className="block text-base font-bold text-[var(--text-primary)] mb-2 text-center">
                Assignment (optional)
              </label>
              <AutocompleteInput
                id="assignment"
                value={assignment}
                onChange={setAssignment}
                placeholder="Enter assignment name"
                suggestions={assignments}
              />
            </div>
          </div>
          <label htmlFor="session-description" className="block text-base font-bold text-[var(--text-primary)] mb-2 text-center">
            Description (Optional)
          </label>
          <FormTextarea
            id="session-description"
            label="Description"
            value={sessionDescription}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSessionDescription(e.target.value)}
            error=""
            placeholder="Add a description (optional)"
          />
        </div>
        {/* Controles de sincronización */}
        <div className="flex flex-col gap-1 mt-2 pb-2">
          <button
            type="button"
            onClick={() => setSyncPomo((v) => !v)}
            className="flex items-center justify-between w-full gap-2 px-2 py-1 rounded-lg bg-transparent hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer text-[var(--text-secondary)] text-sm select-none"
          >
            <span>Start pomodoro at the same time</span>
            {syncPomo ? <Check size={20} style={{ color: "var(--accent-primary)" }} /> : <Square size={20} style={{ color: "var(--accent-primary)" }} />}
          </button>
          <button
            type="button"
            onClick={() => setSyncCountdown((v) => !v)}
            className="flex items-center justify-between w-full gap-2 px-2 py-1 rounded-lg bg-transparent hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer text-[var(--text-secondary)] text-sm select-none"
          >
            <span>Start countdown at the same time</span>
            {syncCountdown ? <Check size={20} style={{ color: "var(--accent-primary)" }} /> : <Square size={20} style={{ color: "var(--accent-primary)" }} />}
          </button>
        </div>

        <TaskSelectionPanel
          tasks={tasks}
          selectedTasks={selectedTasks}
          onMoveTask={handleMoveTask}
          showTaskForm={showTaskForm}
          onShowTaskForm={() => setShowTaskForm(true)}
          onHideTaskForm={() => setShowTaskForm(false)}
          onTaskCreated={handleTaskCreated}
          assignments={assignments}
          assignment={assignment}
          onAssignmentChange={setAssignment as Dispatch<SetStateAction<string>>}
          lastAddedTaskId={lastAddedTaskId}
        />

        <FormActions>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 undefined border border-[var(--accent-primary)] bg-transparent text-[var(--accent-primary)] shadow-none hover:bg-transparent hover:text-[var(--accent-primary)] focus:bg-transparent focus:text-[var(--accent-primary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStart}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 undefined border border-[var(--accent-primary)] bg-transparent text-[var(--accent-primary)] shadow-none hover:bg-transparent hover:text-[var(--accent-primary)] focus:bg-transparent focus:text-[var(--accent-primary)]`}
          >
            {isSubmitting ? 'Starting…' : 'Start Session'}
          </button>
        </FormActions>
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
    </BaseModal>
  );
};

export default StartSessionModal; 