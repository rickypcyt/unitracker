import { setSyncCountdownWithTimer, setSyncPomodoroWithTimer } from '@/store/slices/uiSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

import type { RootState } from '@/store/store';
import { Task } from '@/pages/tasks/task';
import TaskForm from '@/pages/tasks/TaskForm';
import TaskSelectionPanel from '@/pages/tasks/TaskSelectionPanel';
import { X } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';

interface EditSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onSessionDetailsUpdated?: () => void;
}

const EditSessionModal = ({ isOpen, onClose, sessionId, onSessionDetailsUpdated }: EditSessionModalProps) => {
  const dispatch = useDispatch();
  const syncPomodoroWithTimer = useSelector((state: RootState) => state.ui.syncPomodoroWithTimer);
  const syncCountdownWithTimer = useSelector((state: RootState) => state.ui.syncCountdownWithTimer);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [lastAddedTaskId, setLastAddedTaskId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [syncPomo, setSyncPomo] = useState(syncPomodoroWithTimer);
  const [syncCountdown, setSyncCountdown] = useState(syncCountdownWithTimer);

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

  const fetchSessionDetails = async (id: string) => {
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

  const handleTaskMove = async (task: Task, toActive: boolean) => {
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

  const handleTaskFormClose = (newTaskId?: string) => {
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

      // Guardar sincronización en Redux y localStorage
      dispatch(setSyncPomodoroWithTimer(syncPomo));
      dispatch(setSyncCountdownWithTimer(syncCountdown));

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
    <div className="fixed inset-0 bg-white/60 dark:bg-black/70 flex justify-center items-center z-[99999] backdrop-blur-xl">
      <div 
        className="bg-[var(--bg-primary)] rounded-lg p-6 w-full max-w-4xl mx-4 shadow-xl border border-[var(--border-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-[var(--text-secondary)]">
              Edit Session{sessionTitle && <>: <span className="text-[var(--accent-primary)]">{sessionTitle}</span></>}
            </h2>
          </div>
          <button
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            onClick={onClose}
          >
            <X size={22} />
          </button>
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
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-colors"
                placeholder="Enter session title"
              />
            </div>

            <div>
              <label htmlFor="sessionDescription" className="block text-base font-medium text-[var(--text-secondary)] mb-2">
                Description (Optional)
              </label>
              <textarea
                id="sessionDescription"
                value={sessionDescription}
                onChange={(e) => setSessionDescription(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-colors"
                rows={3}
                placeholder="Enter session description"
              />
            </div>
          </div>
        </div>



        <TaskSelectionPanel
          tasks={[...activeTasks, ...availableTasks]}
          selectedTasks={activeTasks.map(task => task.id)}
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
            className="cancel-button border-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            className="px-4 border-2 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 undefined border border-[var(--accent-primary)] bg-transparent text-[var(--accent-primary)] shadow-none hover:bg-transparent hover:text-[var(--accent-primary)] focus:bg-transparent focus:text-[var(--accent-primary)]"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          onClose={handleTaskFormClose as (newTaskId?: string) => void}
        />
      )}
    </div>
  );
};

export default EditSessionModal; 