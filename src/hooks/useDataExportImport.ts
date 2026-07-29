import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '@/hooks/useAuth';
import { useAppStore, useWorkspace, useWorkspaceActions } from '@/store/appStore';
import { downloadBackup, parseBackup, type RestoreResult } from '@/utils/backupRestore';
import { downloadSessionsCSV, downloadStatsCSV, downloadTasksCSV, type StatsExportData } from '@/utils/csvExport';
import {
  importFromCSV,
  importFromGoogleCalendar,
  importFromNotion,
  importFromTodoist,
  importedTaskToTask,
  type ImportResult,
  type ImportSource,
  readFileAsText,
} from '@/utils/dataImport';
import { exportSessionsPDF, exportStatsPDF, exportTasksPDF } from '@/utils/pdfExport';
import { supabase } from '@/utils/supabaseClient';

export type ExportFormat = 'csv' | 'pdf';
export type DataType = 'tasks' | 'sessions' | 'stats';

export interface UseDataExportImportReturn {
  exporting: boolean;
  importing: boolean;
  lastImportResult: ImportResult | null;
  lastRestoreResult: RestoreResult | null;
  exportData: (dataType: DataType, format: ExportFormat, statsData?: StatsExportData) => Promise<void>;
  importTasks: (file: File, source: ImportSource) => Promise<ImportResult>;
  exportBackup: () => void;
  restoreBackup: (file: File) => Promise<RestoreResult>;
  clearResults: () => void;
}

export function useDataExportImport(): UseDataExportImportReturn {
  const { user } = useAuth();
  const tasks = useAppStore(state => state.tasks.tasks);
  const laps = useAppStore(state => state.laps.laps);
  const { workspaces, currentWorkspace } = useWorkspace();
  const { setWorkspaces, setCurrentWorkspace } = useWorkspaceActions();

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [lastImportResult, setLastImportResult] = useState<ImportResult | null>(null);
  const [lastRestoreResult, setLastRestoreResult] = useState<RestoreResult | null>(null);

  const exportData = useCallback(async (
    dataType: DataType,
    format: ExportFormat,
    statsData?: StatsExportData
  ) => {
    setExporting(true);
    try {
      if (dataType === 'tasks') {
        if (format === 'csv') {
          downloadTasksCSV(tasks);
        } else {
          exportTasksPDF(tasks);
        }
        toast.success(`Exported ${tasks.length} tasks`);
      } else if (dataType === 'sessions') {
        if (format === 'csv') {
          downloadSessionsCSV(laps);
        } else {
          exportSessionsPDF(laps);
        }
        toast.success(`Exported ${laps.length} sessions`);
      } else if (dataType === 'stats') {
        if (!statsData) {
          toast.error('Stats data not available');
          return;
        }
        if (format === 'csv') {
          downloadStatsCSV(statsData);
        } else {
          exportStatsPDF(statsData);
        }
        toast.success('Exported stats');
      }
    } catch (err) {
      toast.error(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  }, [tasks, laps]);

  const importTasks = useCallback(async (file: File, source: ImportSource): Promise<ImportResult> => {
    setImporting(true);
    try {
      const text = await readFileAsText(file);
      let result: ImportResult;

      if (source === 'csv') {
        result = importFromCSV(text);
      } else if (source === 'notion') {
        result = importFromNotion(text);
      } else if (source === 'todoist') {
        result = importFromTodoist(text);
      } else {
        result = importFromGoogleCalendar(text);
      }

      if (result.tasks.length === 0) {
        toast.error('No tasks found in file');
        setLastImportResult(result);
        return result;
      }

      // Insert tasks into Supabase if user is logged in
      if (user?.id) {
        const workspaceId = currentWorkspace?.id as string | undefined;
        const tasksToInsert = result.tasks.map(t => importedTaskToTask(t, user.id, workspaceId));

        const { error: insertError } = await supabase
          .from('tasks')
          .insert(tasksToInsert);

        if (insertError) {
          toast.error(`Import failed: ${insertError.message}`);
          return result;
        }

        toast.success(`Imported ${result.tasks.length} tasks from ${source}`);
      } else {
        toast.error('Please log in to import tasks');
      }

      setLastImportResult(result);
      return result;
    } catch (err) {
      toast.error(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      const result: ImportResult = { tasks: [], source, count: 0 };
      setLastImportResult(result);
      return result;
    } finally {
      setImporting(false);
    }
  }, [user, currentWorkspace]);

  const exportBackup = useCallback(() => {
    setExporting(true);
    try {
      downloadBackup(tasks, laps, workspaces);
      toast.success('Backup downloaded');
    } catch (err) {
      toast.error(`Backup failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  }, [tasks, laps, workspaces]);

  const restoreBackup = useCallback(async (file: File): Promise<RestoreResult> => {
    setImporting(true);
    try {
      const text = await readFileAsText(file);
      const result = parseBackup(text);

      if (!result.success) {
        toast.error(result.error ?? 'Invalid backup file');
        setLastRestoreResult(result);
        return result;
      }

      // Restore workspaces to store
      if (result.workspaces.length > 0) {
        setWorkspaces(result.workspaces);
        if (result.workspaces.length > 0 && !currentWorkspace) {
          setCurrentWorkspace(result.workspaces[0] ?? null);
        }
      }

      toast.success(
        `Restored ${result.metadata.taskCount} tasks, ${result.metadata.lapCount} sessions, ${result.metadata.workspaceCount} workspaces`
      );

      setLastRestoreResult(result);
      return result;
    } catch (err) {
      toast.error(`Restore failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      const result: RestoreResult = {
        success: false,
        tasks: [],
        laps: [],
        workspaces: [],
        error: err instanceof Error ? err.message : 'Unknown error',
        metadata: { taskCount: 0, lapCount: 0, workspaceCount: 0 },
      };
      setLastRestoreResult(result);
      return result;
    } finally {
      setImporting(false);
    }
  }, [setWorkspaces, setCurrentWorkspace, currentWorkspace]);

  const clearResults = useCallback(() => {
    setLastImportResult(null);
    setLastRestoreResult(null);
  }, []);

  return {
    exporting,
    importing,
    lastImportResult,
    lastRestoreResult,
    exportData,
    importTasks,
    exportBackup,
    restoreBackup,
    clearResults,
  };
}
