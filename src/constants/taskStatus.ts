export type TaskStatusId =
  | 'draft'
  | 'planned'
  | 'scheduled'
  | 'available'
  | 'in_progress'
  | 'paused'
  | 'blocked'
  | 'completed'
  | 'archived';

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
    id: 'draft',
    label: 'Draft',
    textColor: 'text-gray-400',
    bgColor: 'bg-gray-400',
    borderColor: 'border-gray-400',
    icon: 'FileEdit',
  },
  {
    id: 'planned',
    label: 'Planned',
    textColor: 'text-purple-400',
    bgColor: 'bg-purple-400',
    borderColor: 'border-purple-400',
    icon: 'ClipboardList',
  },
  {
    id: 'scheduled',
    label: 'Scheduled',
    textColor: 'text-indigo-400',
    bgColor: 'bg-indigo-400',
    borderColor: 'border-indigo-400',
    icon: 'Calendar',
  },
  {
    id: 'available',
    label: 'Available',
    textColor: 'text-cyan-400',
    bgColor: 'bg-cyan-400',
    borderColor: 'border-cyan-400',
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
    id: 'paused',
    label: 'Paused',
    textColor: 'text-blue-500',
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-500',
    icon: 'Pause',
  },
  {
    id: 'blocked',
    label: 'Blocked',
    textColor: 'text-red-500',
    bgColor: 'bg-red-500',
    borderColor: 'border-red-500',
    icon: 'AlertCircle',
  },
  {
    id: 'completed',
    label: 'Completed',
    textColor: 'text-green-500',
    bgColor: 'bg-green-500',
    borderColor: 'border-green-500',
    icon: 'CheckCircle2',
  },
  {
    id: 'archived',
    label: 'Archived',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-600',
    borderColor: 'border-gray-600',
    icon: 'Archive',
  },
];

export const TASK_STATUS_MAP: Record<TaskStatusId, TaskStatusConfig> =
  TASK_STATUSES.reduce((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, {} as Record<TaskStatusId, TaskStatusConfig>);

const LEGACY_STATUS_MAP: Record<string, TaskStatusId> = {
  not_started: 'draft',
  'not-started': 'draft',
  on_hold: 'paused',
  'on-hold': 'paused',
  active: 'in_progress',
  in_progress: 'in_progress',
  'in-progress': 'in_progress',
  completed: 'completed',
  done: 'completed',
};

export function normalizeTaskStatus(status: string | undefined | null): TaskStatusId {
  if (!status) return 'draft';
  const lower = status.toLowerCase();
  if (lower in LEGACY_STATUS_MAP) return LEGACY_STATUS_MAP[lower] ?? 'draft';
  if (TASK_STATUSES.some(s => s.id === lower)) return lower as TaskStatusId;
  return 'draft';
}

export function getTaskStatusConfig(status: string | undefined | null): TaskStatusConfig {
  const normalized = normalizeTaskStatus(status);
  return TASK_STATUS_MAP[normalized] ?? TASK_STATUS_MAP['draft'];
}

export const ACTIVE_STATUSES: TaskStatusId[] = ['in_progress'];
export const TODO_STATUSES: TaskStatusId[] = ['draft', 'planned', 'available'];
export const BLOCKED_STATUSES: TaskStatusId[] = ['blocked', 'paused'];
export const DONE_STATUSES: TaskStatusId[] = ['completed', 'archived'];

export function isTaskActive(status: string | undefined | null): boolean {
  return ACTIVE_STATUSES.includes(normalizeTaskStatus(status));
}

export function isTaskDone(status: string | undefined | null): boolean {
  return DONE_STATUSES.includes(normalizeTaskStatus(status));
}

export function isTaskBlocked(status: string | undefined | null): boolean {
  return BLOCKED_STATUSES.includes(normalizeTaskStatus(status));
}
