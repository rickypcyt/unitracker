import { CalendarDays, CheckCircle2, ChevronDown, ChevronRight, Circle, EyeOff, Layers, ListTodo, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { format, isBefore, isToday, isValid, parseISO, startOfDay, differenceInDays } from 'date-fns';
import { track } from '@vercel/analytics';
import { useAuth } from '@/hooks/auth/useAuth';
import { useLocalStorage } from '@/hooks/common/useLocalStorage';
import { useSessionTaskActions } from '@/hooks/session/useSessionTaskActions';
import { useFetchTasks, useTasks, useWorkspace } from '@/store/appStore';
import { getDemoTasks } from '@/utils/demoData';
import ActionTooltip from '@/components/ui/ActionTooltip';
import type { Task } from '@/schemas/task';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const getDueDate = (task: Task) => {
  const value = task.deadline || task.due_date;
  const date = value ? parseISO(value) : null;
  return date && isValid(date) ? date : null;
};

export const getPendingTasks = (tasks: Task[]) => tasks
  .filter(task => !task.completed && task.status !== 'completed')
  .sort((a, b) => (getDueDate(a)?.getTime() ?? Infinity) - (getDueDate(b)?.getTime() ?? Infinity)
    || a.title.localeCompare(b.title));

const groupByAssignment = (tasks: Task[]) => {
  const groups = new Map<string, Task[]>();
  tasks.forEach(task => {
    const assignment = task.assignment || 'Unassigned';
    if (!groups.has(assignment)) {
      groups.set(assignment, []);
    }
    groups.get(assignment)!.push(task);
  });
  return Array.from(groups.entries());
};

const PendingTasks = () => {
  const { isLoggedIn, isAuthLoading, user } = useAuth();
  const { t } = useTranslation();
  const { busy, editTask, toggleTask, requestDelete, modals } = useSessionTaskActions('pending');
  const [ignoredByUser, setIgnoredByUser] = useLocalStorage<Record<string, string[]>>('session.pendingTasks.ignored', {});
  const userKey = user?.id || 'demo';
  const ignored = Array.isArray(ignoredByUser?.[userKey]) ? ignoredByUser[userKey]! : [];
  const { tasks, loading, error } = useTasks();
  const { currentWorkspace, workspaces } = useWorkspace();
  const [collapsedByUser, setCollapsedByUser] = useLocalStorage<Record<string, string[]>>('session.pendingTasks.collapsed', {});
  const collapsed = Array.isArray(collapsedByUser?.[userKey]) ? collapsedByUser[userKey]! : [];
  const toggleCollapsed = (key: string) => {
    setCollapsedByUser(previous => {
      const current = Array.isArray(previous?.[userKey]) ? previous[userKey]! : [];
      return { ...previous, [userKey]: current.includes(key) ? current.filter(k => k !== key) : [...current, key] };
    });
  };
  const showWorkspace =!!currentWorkspace && (currentWorkspace.isAll || currentWorkspace.id === 'all');
  const workspaceNames = useMemo(() => new Map((workspaces || []).map((w: any) => [w.id, w.name as string])), [workspaces]);
  const fetchTasks = useFetchTasks();
  const workspacePending = useMemo(() => getPendingTasks((isLoggedIn ? tasks : getDemoTasks()).filter(task =>
    currentWorkspace ? currentWorkspace.isAll || currentWorkspace.id === 'all' || task.workspace_id === currentWorkspace.id : !task.workspace_id
  )), [isLoggedIn, tasks, currentWorkspace]);
  const pending = workspacePending.filter(task => !ignored.includes(task.id));
  const hiddenCount = workspacePending.length - pending.length;
  const sections = useMemo(() => {
    if (!showWorkspace) return [{ id: 'current', name: '', tasks: pending }];
    const map = new Map<string, Task[]>();
    pending.forEach(task => {
      const key = task.workspace_id || 'none';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    });
    return Array.from(map.entries()).map(([id, list]) => ({
      id,
      name: workspaceNames.get(id) || t('session.pendingTasks.noWorkspace', { defaultValue: 'No workspace' }),
      tasks: list,
    }));
  }, [pending, showWorkspace, workspaceNames, t]);

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

  return (
    <section aria-labelledby="pending-tasks-title" className="w-full h-full min-h-0 max-h-[700px] overflow-hidden flex flex-col rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-4">
      <div className="flex flex-nowrap items-center justify-between gap-2 sm:gap-3 mb-4 pb-3 border-b border-[var(--border-primary)]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10">
            <ListTodo size={18} className="text-[var(--accent-primary)]" />
          </div>
          <h3 id="pending-tasks-title" className="truncate text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">{t('session.pendingTasks.title')}</h3>
          <span className="shrink-0 text-xs font-semibold rounded-full px-2 py-0.5 bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">{pending.length}</span>
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
        <div className="hide-scrollbar flex-1 min-h-0 overflow-y-auto flex flex-col space-y-3" style={{
          padding: '0 0 0.5rem 0',
        }}>
          {sections.map(section => (
            <div key={section.id} className={showWorkspace ? 'flex flex-col space-y-3 rounded-xl border-2 border-[var(--border-primary)] p-3' : 'flex flex-col space-y-3'}>
              {showWorkspace && (
                <button
                  type="button"
                  onClick={() => toggleCollapsed(`ws:${section.id}`)}
                  aria-expanded={!collapsed.includes(`ws:${section.id}`)}
                  className="flex w-full items-center gap-2 text-left"
                >
                  {collapsed.includes(`ws:${section.id}`) ? <ChevronRight size={16} className="shrink-0 text-[var(--text-secondary)]" /> : <ChevronDown size={16} className="shrink-0 text-[var(--text-secondary)]" />}
                  <Layers size={16} className="shrink-0 text-[var(--accent-primary)]" />
                  <h4 className="truncate text-sm font-bold text-[var(--text-primary)]">{section.name}</h4>
                  <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">{section.tasks.length}</span>
                </button>
              )}
              {!(showWorkspace && collapsed.includes(`ws:${section.id}`)) && groupByAssignment(section.tasks).map(([assignment, tasks]) => {
                const assignmentKey = `as:${section.id}:${assignment}`;
                const assignmentCollapsed = collapsed.includes(assignmentKey);
                return (
            <div key={assignment} className="flex flex-col">
              {/* Assignment Header */}
              <button
                type="button"
                onClick={() => toggleCollapsed(assignmentKey)}
                aria-expanded={!assignmentCollapsed}
                className={`flex w-full items-center gap-2 px-1 text-left ${assignmentCollapsed ? '' : 'mb-2'}`}
              >
                {assignmentCollapsed ? <ChevronRight size={14} className="shrink-0 text-[var(--text-secondary)]" /> : <ChevronDown size={14} className="shrink-0 text-[var(--text-secondary)]" />}
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] truncate">
                  {assignment}
                </span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--text-secondary)]">{tasks.length}</span>
                <span className="h-px flex-1 bg-[var(--border-primary)]" aria-hidden="true" />
              </button>
              {/* Tasks List */}
              <ul className={`flex flex-col space-y-1.5 ${assignmentCollapsed ? 'hidden' : ''}`}>
                {tasks.map(task => {
                  const due = getDueDate(task);
                  const overdue = due && isBefore(startOfDay(due), startOfDay(new Date()));
                  return (
                    <li key={task.id} className={`shrink-0 flex items-center gap-1.5 rounded-xl border px-2 py-2.5 ${overdue ? 'border-red-500/40 bg-red-500/5' : 'border-[var(--border-primary)] bg-[var(--bg-secondary)]/40'}`}>
                      <ActionTooltip content={t('session.pendingTasks.completeTooltip')}>
                        <button onClick={() => void toggleTask(task)} disabled={busy !== null} aria-label={t('session.pendingTasks.completeAria', { title: task.title })} className="shrink-0 min-h-9 min-w-9 flex items-center justify-center text-[var(--accent-primary)] disabled:opacity-50"><Circle size={22} strokeWidth={2.2} /></button>
                      </ActionTooltip>
                      <div className="min-w-0 flex-1">
                        <ActionTooltip content={t('session.pendingTasks.editTooltip')}>
                          <button onClick={() => editTask(task)} className="block w-full text-base font-semibold leading-snug text-left text-[var(--text-primary)] break-words">{task.title}</button>
                        </ActionTooltip>
                        <div className="mt-1 flex items-center gap-1">
                          <span className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium ${overdue ? 'bg-red-500/10 text-red-400' : due && isToday(due) ? 'bg-green-500/10 text-green-500' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                            <CalendarDays size={13} />
                            {due ? (() => {
                              if (isToday(due)) return t('common.today');
                              if (overdue) {
                                const daysAgo = differenceInDays(new Date(), due);
                                return t('session.pendingTasks.daysAgo', { count: daysAgo });
                              }
                              return format(due, 'EEEE, MMM d, yyyy');
                            })() : t('common.noDueDate')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center shrink-0">
                        <ActionTooltip content={t('session.pendingTasks.modifyTooltip')}>
                          <button onClick={() => editTask(task)} disabled={busy !== null} aria-label={t('session.pendingTasks.editAria', { title: task.title })} className="p-1.5 text-[var(--text-secondary)] disabled:opacity-50"><Pencil size={16} /></button>
                        </ActionTooltip>
                        <ActionTooltip content={t('session.pendingTasks.ignoreTooltip')}>
                          <button onClick={() => ignoreTask(task)} disabled={busy !== null} aria-label={t('session.pendingTasks.ignoreAria', { title: task.title })} className="p-1.5 text-[var(--text-secondary)] disabled:opacity-50"><EyeOff size={16} /></button>
                        </ActionTooltip>
                        <ActionTooltip content={t('session.pendingTasks.deleteTooltip')}>
                          <button onClick={() => requestDelete(task)} disabled={busy !== null} aria-label={t('session.pendingTasks.deleteAria', { title: task.title })} className="p-1.5 text-red-400 disabled:opacity-50"><Trash2 size={16} /></button>
                        </ActionTooltip>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {modals}
    </section>
  );
};

export default PendingTasks;
