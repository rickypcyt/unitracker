import { Check, CheckCircle2, Edit2, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { format, formatDistanceToNow, getTime, parse } from 'date-fns';
import { useDeleteTaskSuccess, useFetchTasks, useTasks, useToggleTaskStatus, useUpdateTaskSuccess } from '@/store/appStore';

import BaseModal from '@/modals/BaseModal';
import DeleteCompletedModal from '@/modals/DeleteTasksPop';
import { TaskService } from '@/services/TaskService';
import { toast } from 'react-toastify';
import { useAuth } from '@/hooks/useAuth';
import useDemoMode from '@/utils/useDemoMode';
import type { Task } from '@/schemas/task';

interface ManageCompletedTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
}
const ManageCompletedTasksModal: React.FC<ManageCompletedTasksModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    tasks
  } = useTasks();
  const { isLoggedIn } = useAuth();
  const { isDemo } = useDemoMode();
  const updateTaskSuccess = useUpdateTaskSuccess();
  const deleteTaskSuccess = useDeleteTaskSuccess();
  const toggleTaskStatus = useToggleTaskStatus();
  const fetchTasksAction = useFetchTasks();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Group completed tasks by month (most recent first)
  const completedTasks = tasks.filter((t: Task) => t.completed);
  const groupedByMonth: {
    [month: string]: Task[];
  } = {};
  completedTasks.forEach(task => {
    const month = task.completed_at ? format(new Date(task.completed_at), 'MMMM yyyy') : 'Unknown';
    if (!groupedByMonth[month]) groupedByMonth[month] = [];
    (groupedByMonth[month] as Task[]).push(task);
  });
  const months = Object.keys(groupedByMonth).sort((a, b) => getTime(parse(b, 'MMMM yyyy', new Date())) - getTime(parse(a, 'MMMM yyyy', new Date())));

  const sortedTasksOfMonth = (month: string) =>
    (groupedByMonth[month] || []).slice().sort((a, b) => {
      const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      return dateB - dateA;
    });

  const handleDeleteTask = (task: Task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const confirmDeleteTask = () => {
    if (!taskToDelete) return;
    const id = taskToDelete.id;
    deleteTaskSuccess(id);
    setShowDeleteModal(false);
    setTaskToDelete(null);
    if (!isLoggedIn) return;
    TaskService.deleteTask(id).catch(error => {
      console.error('Error deleting task:', error);
      toast.error('Could not delete task');
      fetchTasksAction();
    });
  };

  // Move a completed task back to pending
  const restoreTask = (task: Task) => {
    toggleTaskStatus(task.id, false);
    if (!isLoggedIn) return;
    TaskService.toggleComplete(task.id, false).catch(error => {
      console.error('Error restoring task:', error);
      toast.error('Could not restore task');
      toggleTaskStatus(task.id, true);
    });
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title || '');
  };

  const commitEditing = () => {
    const task = completedTasks.find(t => t.id === editingTaskId);
    const trimmed = editingTitle.trim();
    setEditingTaskId(null);
    if (!task || !trimmed || trimmed === task.title) return;
    const updated = { ...task, title: trimmed };
    updateTaskSuccess(updated);
    if (!isLoggedIn) return;
    TaskService.updateTask(task.id, { title: trimmed }).catch(error => {
      console.error('Error renaming task:', error);
      toast.error('Could not rename task');
      updateTaskSuccess(task);
    });
  };

  if (!isOpen) return null;
  const isDemoOrLoggedOut = !isLoggedIn || isDemo;
  return <>
      <BaseModal isOpen={isOpen} onClose={onClose} title="" maxWidth="max-w-2xl" padding="none" showHeader={false}>
        <div className="flex max-h-[80vh] flex-col p-5 sm:p-6">
          <div className="relative mb-4 flex flex-shrink-0 flex-col items-center">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Completed Tasks
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              {completedTasks.length} task{completedTasks.length === 1 ? '' : 's'} completed
            </p>
            <button onClick={onClose} className="absolute right-0 top-0 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label="Close">
              <X size={24} />
            </button>
          </div>

          {months.length === 0 ? <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-[var(--accent-primary)/10] rounded-full flex items-center justify-center mb-4">
                <Check size={24} className="text-[var(--accent-primary)]" />
              </div>
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No completed tasks</h3>
              <p className="text-[var(--text-secondary)]">
                Completed tasks will appear here
              </p>
            </div> : <div className="flex-1 overflow-y-auto pr-1">
              {months.map(month => <section key={month} className="mb-5 last:mb-0">
                  <header className="mb-1 flex items-center justify-between border-b border-[var(--border-primary)] pb-1.5">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                      {month}
                    </h3>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {(groupedByMonth[month] || []).length} task{(groupedByMonth[month] || []).length === 1 ? '' : 's'}
                    </span>
                  </header>
                  <ul className="divide-y divide-[var(--border-primary)]/50">
                    {sortedTasksOfMonth(month).map(task => <li key={task.id} className="group flex items-center gap-3 px-1 py-2.5">
                        <button
                          onClick={() => restoreTask(task)}
                          className="flex-shrink-0 text-emerald-500 hover:text-[var(--accent-primary)] transition-colors"
                          title="Move back to pending"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                        <div className="min-w-0 flex-1">
                          {editingTaskId === task.id ? <input
                              type="text"
                              value={editingTitle}
                              onChange={e => setEditingTitle(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') commitEditing();
                                else if (e.key === 'Escape') setEditingTaskId(null);
                              }}
                              onBlur={commitEditing}
                              autoFocus
                              className="w-full border-b-2 border-[var(--accent-primary)] bg-transparent text-sm font-medium text-[var(--text-primary)] focus:outline-none"
                            /> : <p className="truncate text-sm font-medium text-[var(--text-primary)] line-through decoration-[var(--text-secondary)]/50">
                              {task.title}
                            </p>}
                          <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                            {task.assignment ? `${task.assignment} · ` : ''}
                            Completed {task.completed_at ? formatDistanceToNow(new Date(task.completed_at), { addSuffix: true }) : 'recently'}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => startEditing(task)}
                            className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
                            title="Rename task"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task)}
                            className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete task"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </li>)}
                  </ul>
                </section>)}
            </div>}

          {isDemoOrLoggedOut && months.length > 0 && (
            <p className="mt-3 flex-shrink-0 text-center text-xs text-[var(--text-secondary)]">
              {isDemo ? 'Demo mode — changes are not saved' : 'Log in to save changes'}
            </p>
          )}
        </div>
      </BaseModal>

      {showDeleteModal && taskToDelete && <DeleteCompletedModal onClose={() => {
      setShowDeleteModal(false);
      setTaskToDelete(null);
    }} onConfirm={confirmDeleteTask} message={`Are you sure you want to delete the task "${taskToDelete.title}"? This action cannot be undone.`} confirmButtonText="Delete Task" />}
    </>;
};
export default ManageCompletedTasksModal;
