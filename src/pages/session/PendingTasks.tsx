import { CalendarDays, CheckCircle2, ChevronDown, ChevronRight, Circle, EyeOff, Layers, ListTodo, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { addWeeks, differenceInDays, endOfWeek, format, isBefore, isToday, isTomorrow, isValid, parseISO, startOfDay } from 'date-fns';
import { track } from '@vercel/analytics';
import { useAuth } from '@/hooks/auth/useAuth';
import { useLocalStorage } from '@/hooks/common/useLocalStorage';
import { useSessionTaskActions } from '@/hooks/session/useSessionTaskActions';
import { useFetchTasks, useTasks, useWorkspace } from '@/store/appStore';
import { getDemoTasks } from '@/utils/demoData';
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

type BucketId = 'overdue' | 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek' | 'later' | 'none';

const BUCKETS: { id: BucketId; label: string; tone: string }[] = [
  { id: 'overdue', label: 'Overdue', tone: 'text-red-400' },
  { id: 'today', label: 'Today', tone: 'text-green-500' },
  { id: 'tomorrow', label: 'Tomorrow', tone: 'text-[var(--accent-primary)]' },
  { id: 'thisWeek', label: 'This week', tone: 'text-[var(--accent-primary)]' },
  { id: 'nextWeek', label: 'Next week', tone: 'text-[var(--accent-primary)]' },
  { id: 'later', label: 'Later', tone: 'text-[var(--text-secondary)]' },
  { id: 'none', label: 'No date', tone: 'text-[var(--text-secondary)]' },
];

const PendingTasks = ({ fillHeight = false }: { fillHeight?: boolean }) => {
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
  const [groupBy, setGroupBy] = useLocalStorage<'date' | 'workspace'>('session.pendingTasks.groupBy', 'date');
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

  // Date mode: Overdue / Today / Tomorrow / This week / Next week / Later / No date
  const dateBuckets = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const endThisWeek = endOfWeek(now, { weekStartsOn: 1 });
    const endNextWeek = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
    const map = new Map<BucketId, Task[]>();
    pending.forEach(task => {
      const due = getDueDate(task);
      let id: BucketId;
      if (!due) id = 'none';
      else if (isBefore(startOfDay(due), todayStart)) id = 'overdue';
      else if (isToday(due)) id = 'today';
      else if (isTomorrow(due)) id = 'tomorrow';
      else if (due <= endThisWeek) id = 'thisWeek';
      else if (due <= endNextWeek) id = 'nextWeek';
      else id = 'later';
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(task);
    });
    return BUCKETS.filter(bucket => map.has(bucket.id)).map(bucket => ({ ...bucket, tasks: map.get(bucket.id)! }));
  }, [pending]);

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

  // One task row. In date mode it also shows which assignment / workspace the task belongs to.
  const renderTask = (task: Task, showContext = false) => {
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
          <div className="mt-1 flex flex-wrap items-center gap-1">
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
            {showContext && task.assignment && (
              <span className="inline-flex min-w-0 max-w-[10rem] items-center rounded-md bg-[var(--accent-primary)]/10 px-1.5 py-0.5 text-xs font-medium text-[var(--accent-primary)]" title={task.assignment}>
                <span className="truncate">{task.assignment}</span>
              </span>
            )}
            {showContext && showWorkspace && task.workspace_id && workspaceNames.get(task.workspace_id) && (
              <span className="inline-flex min-w-0 max-w-[9rem] items-center gap-1 rounded-md bg-[var(--bg-secondary)] px-1.5 py-0.5 text-xs font-medium text-[var(--text-secondary)]" title={workspaceNames.get(task.workspace_id)}>
                <Layers size={11} className="shrink-0" />
                <span className="truncate">{workspaceNames.get(task.workspace_id)}</span>
              </span>
            )}
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
  };

  return (
    <section aria-labelledby="pending-tasks-title" className={`w-full h-full min-h-0 ${fillHeight ? 'max-h-[700px] xl:max-h-none' : 'max-h-[700px]'} overflow-hidden flex flex-col rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-4`}>
      <div className="flex flex-nowrap items-center justify-between gap-2 sm:gap-3 mb-4 pb-3 border-b border-[var(--border-primary)]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10">
            <ListTodo size={18} className="text-[var(--accent-primary)]" />
          </div>
          <h3 id="pending-tasks-title" className="truncate text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">{t('session.pendingTasks.title')}</h3>
          <span className="shrink-0 text-xs font-semibold rounded-full px-2 py-0.5 bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">{pending.length}</span>
        </div>
        <div role="tablist" aria-label={t('session.pendingTasks.groupBy', { defaultValue: 'Group by' })} className="flex shrink-0 items-center gap-0.5 rounded-lg bg-[var(--bg-secondary)] p-0.5">
          {([
            ['date', t('session.pendingTasks.byDate', { defaultValue: 'Date' })],
            ['workspace', showWorkspace ? t('session.pendingTasks.byWorkspace', { defaultValue: 'Workspace' }) : t('session.pendingTasks.byCourse', { defaultValue: 'Course' })],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={groupBy === value}
              onClick={() => setGroupBy(value)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                groupBy === value ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)]'
              }`}
            >
              {label}
            </button>
          ))}
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
        <div className="hide-scrollbar flex-1 min-h-0 overflow-y-auto flex flex-col gap-3">
          {groupBy === 'date' ? dateBuckets.map(bucket => {
            const bucketKey = `dt:${bucket.id}`;
            const bucketCollapsed = collapsed.includes(bucketKey);
            return (
              <div key={bucket.id} className="flex shrink-0 flex-col gap-2">
                <button
                  type="button"
                  onClick={() => toggleCollapsed(bucketKey)}
                  aria-expanded={!bucketCollapsed}
                  className="flex h-7 w-full items-center gap-2 px-1.5 text-left"
                >
                  {bucketCollapsed ? <ChevronRight size={14} className="shrink-0 text-[var(--text-secondary)]" /> : <ChevronDown size={14} className="shrink-0 text-[var(--text-secondary)]" />}
                  <span className={`truncate text-xs font-bold uppercase tracking-wider ${bucket.tone}`}>
                    {t(`session.pendingTasks.bucket.${bucket.id}`, { defaultValue: bucket.label })}
                  </span>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--text-secondary)]">{bucket.tasks.length}</span>
                  <span className="h-px flex-1 bg-[var(--border-primary)]" aria-hidden="true" />
                </button>
                <ul className={`flex flex-col space-y-1.5 ${bucketCollapsed ? 'hidden' : ''}`}>
                  {bucket.tasks.map(task => renderTask(task, true))}
                </ul>
              </div>
            );
          }) : sections.map(section => (
            <div key={section.id} className={showWorkspace ? 'flex shrink-0 flex-col gap-2 rounded-xl border-2 border-[var(--border-primary)] p-2' : 'flex shrink-0 flex-col gap-3'}>
              {showWorkspace && (
                <button
                  type="button"
                  onClick={() => toggleCollapsed(`ws:${section.id}`)}
                  aria-expanded={!collapsed.includes(`ws:${section.id}`)}
                  className="flex h-8 w-full items-center gap-2 px-1.5 text-left"
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
            <div key={assignment} className={`flex flex-col gap-2 ${showWorkspace ? 'pb-1' : ''}`}>
              {/* Assignment Header */}
              <button
                type="button"
                onClick={() => toggleCollapsed(assignmentKey)}
                aria-expanded={!assignmentCollapsed}
                className="flex h-7 w-full items-center gap-2 px-1.5 text-left"
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
                {tasks.map(task => renderTask(task))}
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
