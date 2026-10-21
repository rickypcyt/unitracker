import { useState } from 'react';
import { toast } from 'react-toastify';
import { track } from '@vercel/analytics';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore, useFetchTasks } from '@/store/appStore';
import { TaskService } from '@/services/TaskService';
import TaskFormManager from '@/pages/tasks/TaskFormManager';
import DeleteCompletedModal from '@/modals/DeleteTasksPop';
import LoginPromptModal from '@/modals/LoginPromptModal';
import type { Task } from '@/schemas/task';

export const useSessionTaskActions = (source: 'calendar' | 'pending' | 'floating', onOpen?: () => void) => {
  const { isLoggedIn } = useAuth();
  const fetchTasks = useFetchTasks();
  const [editing, setEditing] = useState<{ task: Task | null; date: string | null } | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [loginPrompt, setLoginPrompt] = useState(false);

  const editTask = (task: Task | null, date: string | null = null) => {
    if (!isLoggedIn) return setLoginPrompt(true);
    setEditing({ task, date });
    track(`session_${source}_task_edit`, { mode: task ? 'edit' : 'create' });
    onOpen?.();
  };

  const requestDelete = (task: Task) => {
    if (!isLoggedIn) return setLoginPrompt(true);
    setDeleting(task);
    onOpen?.();
  };

  const toggleTask = async (task: Task) => {
    if (!isLoggedIn) return setLoginPrompt(true);
    if (busy) return;
    setBusy(task.id);
    const completed = !task.completed;
    const updates = { completed, completed_at: completed ? new Date().toISOString() : null, status: completed ? 'completed' : 'todo' };
    useAppStore.getState().updateTask(task.id, updates);
    try {
      const saved = await TaskService.updateTask(task.id, updates);
      useAppStore.getState().updateTask(task.id, saved);
      track(`session_${source}_task_toggle`, { completed });
    } catch {
      useAppStore.getState().updateTask(task.id, { ...task, status: task.status ?? (task.completed ? 'completed' : 'todo') });
      toast.error('Could not update task. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const deleteTask = async () => {
    if (!deleting || busy || !isLoggedIn) return;
    setBusy(deleting.id);
    try {
      await TaskService.deleteTask(deleting.id);
      useAppStore.getState().deleteTask(deleting.id);
      setDeleting(null);
      track(`session_${source}_task_delete`);
    } catch {
      toast.error('Could not delete task. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const closeEditor = () => {
    setEditing(null);
    void fetchTasks(undefined, true);
  };

  const modals = <>
    {editing && <TaskFormManager initialTask={editing.task} initialDeadline={editing.date} onClose={closeEditor} onTaskCreated={closeEditor} />}
    {deleting && <DeleteCompletedModal message={`Delete “${deleting.title}”?`} confirmButtonText={busy ? 'Deleting…' : 'Delete task'} onClose={() => { if (!busy) setDeleting(null); }} onConfirm={() => void deleteTask()} />}
    {loginPrompt && <LoginPromptModal isOpen={true} onClose={() => setLoginPrompt(false)} />}
  </>;

  return { busy, editTask, toggleTask, requestDelete, modals };
};
