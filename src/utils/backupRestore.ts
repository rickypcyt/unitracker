import type { Task } from '@/types/taskStorage';
import type { Lap } from '@/types/lap';
import type { Workspace } from '@/types/workspace';

// -------------------------
// Types
// -------------------------

export interface BackupData {
  version: string;
  exportedAt: string;
  tasks: Task[];
  laps: Lap[];
  workspaces: Workspace[];
  pomodoroSettings?: Record<string, unknown> | undefined;
  metadata: {
    taskCount: number;
    lapCount: number;
    workspaceCount: number;
  };
}

// -------------------------
// Backup (export all data as JSON)
// -------------------------

export function createBackup(
  tasks: Task[],
  laps: Lap[],
  workspaces: Workspace[],
  pomodoroSettings?: Record<string, unknown>
): BackupData {
  const backup: BackupData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    tasks,
    laps,
    workspaces,
    metadata: {
      taskCount: tasks.length,
      lapCount: laps.length,
      workspaceCount: workspaces.length,
    },
  };

  if (pomodoroSettings) backup.pomodoroSettings = pomodoroSettings;

  return backup;
}

export function downloadBackup(
  tasks: Task[],
  laps: Lap[],
  workspaces: Workspace[],
  pomodoroSettings?: Record<string, unknown>
): void {
  const backup = createBackup(tasks, laps, workspaces, pomodoroSettings);
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `unitracker-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// -------------------------
// Restore (import from JSON backup)
// -------------------------

export interface RestoreResult {
  success: boolean;
  tasks: Task[];
  laps: Lap[];
  workspaces: Workspace[];
  pomodoroSettings?: Record<string, unknown> | undefined;
  error?: string | undefined;
  metadata: {
    taskCount: number;
    lapCount: number;
    workspaceCount: number;
  };
}

export function parseBackup(jsonText: string): RestoreResult {
  try {
    const data = JSON.parse(jsonText) as BackupData;

    if (!data.version || !data.metadata) {
      return {
        success: false,
        tasks: [],
        laps: [],
        workspaces: [],
        error: 'Invalid backup file: missing version or metadata',
        metadata: { taskCount: 0, lapCount: 0, workspaceCount: 0 },
      };
    }

    if (!Array.isArray(data.tasks) || !Array.isArray(data.laps) || !Array.isArray(data.workspaces)) {
      return {
        success: false,
        tasks: [],
        laps: [],
        workspaces: [],
        error: 'Invalid backup file: tasks, laps, or workspaces are not arrays',
        metadata: { taskCount: 0, lapCount: 0, workspaceCount: 0 },
      };
    }

    const result: RestoreResult = {
      success: true,
      tasks: data.tasks,
      laps: data.laps,
      workspaces: data.workspaces,
      metadata: {
        taskCount: data.tasks.length,
        lapCount: data.laps.length,
        workspaceCount: data.workspaces.length,
      },
    };

    if (data.pomodoroSettings) {
      result.pomodoroSettings = data.pomodoroSettings;
    }

    return result;
  } catch (err) {
    return {
      success: false,
      tasks: [],
      laps: [],
      workspaces: [],
      error: `Failed to parse backup: ${err instanceof Error ? err.message : 'Invalid JSON'}`,
      metadata: { taskCount: 0, lapCount: 0, workspaceCount: 0 },
    };
  }
}
