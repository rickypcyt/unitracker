export type TaskStatusId =
  | 'todo'
  | 'in_progress'
  | 'on_hold'
  | 'completed';

export interface TaskStatusConfig {
  id: TaskStatusId;
  label: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

export const TASK_STATUSES: TaskStatusConfig[] = [
  {
    id: 'todo',
    label: 'To Do',
    textColor: 'text-gray-400',
    bgColor: 'bg-gray-400',
    borderColor: 'border-gray-400',
    icon: 'Circle',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    textColor: 'text-yellow-500',
    bgColor: 'bg-yellow-500',
    borderColor: 'border-yellow-500',
    icon: 'Loader',
  },
  {
    id: 'on_hold',
    label: 'On Hold',
    textColor: 'text-blue-500',
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-500',
    icon: 'Pause',
  },
  {
    id: 'completed',
    label: 'Done',
    textColor: 'text-green-500',
    bgColor: 'bg-green-500',
    borderColor: 'border-green-500',
    icon: 'CheckCircle2',
  },
];

export const TASK_STATUS_MAP: Record<TaskStatusId, TaskStatusConfig> =
  TASK_STATUSES.reduce((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, {} as Record<TaskStatusId, TaskStatusConfig>);

const LEGACY_STATUS_MAP: Record<string, TaskStatusId> = {
  draft: 'todo',
  planned: 'todo',
  scheduled: 'todo',
  available: 'todo',
  not_started: 'todo',
  'not-started': 'todo',
  in_progress: 'in_progress',
  'in-progress': 'in_progress',
  active: 'in_progress',
  paused: 'on_hold',
  on_hold: 'on_hold',
  'on-hold': 'on_hold',
  blocked: 'on_hold',
  completed: 'completed',
  done: 'completed',
  archived: 'completed',
};

export function normalizeTaskStatus(status: string | undefined | null): TaskStatusId {
  if (!status) return 'todo';
  const lower = status.toLowerCase();
  if (lower in LEGACY_STATUS_MAP) return LEGACY_STATUS_MAP[lower] ?? 'todo';
  if (TASK_STATUSES.some(s => s.id === lower)) return lower as TaskStatusId;
  return 'todo';
}

export function getTaskStatusConfig(status: string | undefined | null): TaskStatusConfig {
  const normalized = normalizeTaskStatus(status);
  return TASK_STATUS_MAP[normalized] ?? TASK_STATUS_MAP['todo'];
}

export const ACTIVE_STATUSES: TaskStatusId[] = ['in_progress'];
export const TODO_STATUSES: TaskStatusId[] = ['todo'];
export const BLOCKED_STATUSES: TaskStatusId[] = ['on_hold'];
export const DONE_STATUSES: TaskStatusId[] = ['completed'];

export function isTaskActive(status: string | undefined | null): boolean {
  return ACTIVE_STATUSES.includes(normalizeTaskStatus(status));
}

export function isTaskDone(status: string | undefined | null): boolean {
  return DONE_STATUSES.includes(normalizeTaskStatus(status));
}

export function isTaskBlocked(status: string | undefined | null): boolean {
  return BLOCKED_STATUSES.includes(normalizeTaskStatus(status));
}
