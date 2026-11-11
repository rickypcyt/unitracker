import { ArrowRight, CalendarDays, CheckCircle2, Circle, EyeOff, ListTodo, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { format, isBefore, isToday, isValid, parseISO, startOfDay } from 'date-fns';
import { track } from '@vercel/analytics';
import { useAuth } from '@/hooks/auth/useAuth';
import { useLocalStorage } from '@/hooks/common/useLocalStorage';
import { useSessionTaskActions } from '@/hooks/session/useSessionTaskActions';
import { useNavigation } from '@/navigation/NavigationContext';
import { useFetchTasks, useTasks, useWorkspace } from '@/store/appStore';
import { demoTasks } from '@/utils/demoData';
import ActionTooltip from '@/components/ui/ActionTooltip';
import type { Task } from '@/schemas/task';
import { useTranslation } from 'react-i18next';

const getDueDate = (task: Task) => {
  const value = task.deadline || task.due_date;
  const date = value ? parseISO(value) : null;
  return date && isValid(date) ? date : null;
};

export const getPendingTasks = (tasks: Task[]) => tasks
  .filter(task => !task.completed && task.status !== 'completed')
  .sort((a, b) => (getDueDate(a)?.getTime() ?? Infinity) - (getDueDate(b)?.getTime() ?? Infinity)
    || a.title.localeCompare(b.title));

const PendingTasks = () => {
  const { isLoggedIn, isAuthLoading, user } = useAuth();
  const { t } = useTranslation();
  const { busy, editTask, toggleTask, requestDelete, modals } = useSessionTaskActions('pending');
  const [ignoredByUser, setIgnoredByUser] = useLocalStorage<Record<string, string[]>>('session.pendingTasks.ignored', {});
  const userKey = user?.id || 'demo';
  const ignored = Array.isArray(ignoredByUser?.[userKey]) ? ignoredByUser[userKey]! : [];
  const { tasks, loading, error } = useTasks();
  const { currentWorkspace } = useWorkspace();
  const fetchTasks = useFetchTasks();
  const { navigateTo } = useNavigation();
  const workspacePending = useMemo(() => getPendingTasks((isLoggedIn ? tasks : demoTasks).filter(task =>
    currentWorkspace ? currentWorkspace.isAll || currentWorkspace.id === 'all' || task.workspace_id === currentWorkspace.id : !task.workspace_id
  )), [isLoggedIn, tasks, currentWorkspace]);
  const pending = workspacePending.filter(task => !ignored.includes(task.id));
  const hiddenCount = workspacePending.length - pending.length;

  const ignoreTask = (task: Task) => {
    setIgnoredByUser(previous => ({ ...previous, [userKey]: [...ignored, task.id] }));
    track('session_pending_task_ignore');
  };

  const restoreIgnored = () => {
    const ids = new Set(workspacePending.map(task => task.id));
    setIgnoredByUser(previous => ({ ...previous, [userKey]: ignored.filter(id => !ids.has(id)) }));
    track('session_pending_task_restore');
  };

  useEffect(() => {
    if (isLoggedIn && !isAuthLoading) void fetchTasks(undefined, true);
  }, [isLoggedIn, isAuthLoading, fetchTasks, currentWorkspace?.id]);

  const openTasks = () => {
    track('session_pending_tasks_open');
    navigateTo('tasks');
  };

  return (
    <section aria-labelledby="pending-tasks-title" className="w-full h-full flex flex-col rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-4">
      <div className="flex flex-nowrap items-center justify-between gap-2 sm:gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10">
            <ListTodo size={18} className="text-[var(--accent-primary)]" />
          </div>
          <h3 id="pending-tasks-title" className="truncate text-base sm:text-lg font-semibold text-[var(--text-primary)]">{t('session.pendingTasks.title')}</h3>
          <span className="shrink-0 text-xs font-medium rounded-full px-2 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">{pending.length}</span>
        </div>
        <div className="ml-auto flex flex-row-reverse sm:flex-row items-center gap-2 shrink-0">
          <ActionTooltip content={t('session.pendingTasks.newTaskTooltip')}>
            <button onClick={() => editTask(null)} aria-label={t('session.pendingTasks.newTask')} className="min-h-11 min-w-11 flex items-center justify-center gap-1.5 rounded-lg px-2 sm:px-3 text-sm font-semibold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20">
              <Plus size={18} /><span className="hidden sm:inline">{t('session.pendingTasks.newTask')}</span>
            </button>
          </ActionTooltip>
          <ActionTooltip content={t('session.pendingTasks.viewTasksTooltip')}>
            <button onClick={openTasks} aria-label={t('session.pendingTasks.viewTasks')} className="min-h-11 flex items-center gap-1 text-sm text-[var(--accent-primary)] shrink-0">
              <span className="hidden sm:inline">{t('session.pendingTasks.viewTasks')}</span><ArrowRight size={18} />
            </button>
          </ActionTooltip>
        </div>
      </div>
      {hiddenCount > 0 && (
        <ActionTooltip content={t('session.pendingTasks.restoreIgnoredTooltip')}>
          <button onClick={restoreIgnored} className="mb-3 min-h-11 text-xs text-[var(--accent-primary)]">{t('session.pendingTasks.restoreIgnored', { count: hiddenCount })}</button>
        </ActionTooltip>
      )}
      {isLoggedIn && error && (
        <div role="alert" className="flex items-center justify-between gap-2 text-sm text-[var(--text-secondary)] mb-3">
          <span>{t('session.pendingTasks.error')}</span>
          <ActionTooltip content={t('session.pendingTasks.retryTooltip')}>
            <button onClick={() => void fetchTasks(undefined, true)} aria-label={t('session.pendingTasks.retry')} className="p-3 shrink-0"><RefreshCw size={16} /></button>
          </ActionTooltip>
        </div>
      )}
      {isAuthLoading || (isLoggedIn && loading && pending.length === 0) ? (
        <p role="status" className="flex-1 py-6 flex items-center justify-center text-sm text-[var(--text-secondary)]">{t('session.pendingTasks.loading')}</p>
      ) : pending.length === 0 ? (
        <div className="flex-1 py-6 flex flex-col items-center justify-center gap-2 text-[var(--text-secondary)]">
          <CheckCircle2 size={24} className="text-[var(--accent-primary)]" />
          <p className="text-sm">{hiddenCount ? t('session.pendingTasks.allIgnored') : t('session.pendingTasks.allCaughtUp')}</p>
        </div>
      ) : (
        <ul className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col space-y-2">
          {pending.map(task => {
            const due = getDueDate(task);
            const overdue = due && isBefore(startOfDay(due), startOfDay(new Date()));
            return (
              <li key={task.id} className="grow shrink-0 flex items-center gap-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]/40 px-1 py-2">
                <ActionTooltip content={t('session.pendingTasks.completeTooltip')}>
                  <button onClick={() => void toggleTask(task)} disabled={busy !== null} aria-label={t('session.pendingTasks.completeAria', { title: task.title })} className="shrink-0 min-h-9 min-w-9 flex items-center justify-center text-[var(--accent-primary)] disabled:opacity-50"><Circle size={18} /></button>
                </ActionTooltip>
                <div className="min-w-0 flex-1">
                  {task.assignment && (
                    <span className="block mb-1 text-xs font-semibold leading-tight text-[var(--accent-primary)] capitalize truncate">{task.assignment}</span>
                  )}
                  <ActionTooltip content={t('session.pendingTasks.editTooltip')}>
                    <button onClick={() => editTask(task)} className="block w-full text-sm font-medium text-left text-[var(--text-primary)] break-words">{task.title}</button>
                  </ActionTooltip>
                  <div className="mt-0.5 flex items-center gap-1">
                    <span className={`flex items-center gap-1.5 text-xs ${overdue ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>
                      <CalendarDays size={13} />
                      {due ? `${overdue ? `${t('common.overdue')} · ` : ''}${isToday(due) ? t('common.today') : format(due, 'MMM d, yyyy')}` : t('common.noDueDate')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center shrink-0">
                  <ActionTooltip content={t('session.pendingTasks.modifyTooltip')}>
                    <button onClick={() => editTask(task)} disabled={busy !== null} aria-label={t('session.pendingTasks.editAria', { title: task.title })} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] disabled:opacity-50"><Pencil size={16} /></button>
                  </ActionTooltip>
                  <ActionTooltip content={t('session.pendingTasks.ignoreTooltip')}>
                    <button onClick={() => ignoreTask(task)} disabled={busy !== null} aria-label={t('session.pendingTasks.ignoreAria', { title: task.title })} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] disabled:opacity-50"><EyeOff size={16} /></button>
                  </ActionTooltip>
                  <ActionTooltip content={t('session.pendingTasks.deleteTooltip')}>
                    <button onClick={() => requestDelete(task)} disabled={busy !== null} aria-label={t('session.pendingTasks.deleteAria', { title: task.title })} className="p-1.5 text-red-400 disabled:opacity-50"><Trash2 size={16} /></button>
                  </ActionTooltip>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {modals}
    </section>
  );
};

export default PendingTasks;
