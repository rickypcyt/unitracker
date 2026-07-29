import {
  Clock,
  Database,
  Download,
  FileText,
  FileUp,
  FileSpreadsheet,
  HardDriveDownload,
  HardDriveUpload,
  Loader2,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';

import { useDataExportImport } from '@/hooks/useDataExportImport';
import type { ImportSource } from '@/utils/dataImport';

const DataExportImportPanel = () => {
  const {
    exporting,
    importing,
    exportData,
    importTasks,
    exportBackup,
    restoreBackup,
  } = useDataExportImport();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [pendingImportSource, setPendingImportSource] = useState<ImportSource>('csv');

  const handleExportClick = (dataType: 'tasks' | 'sessions' | 'stats', format: 'csv' | 'pdf') => {
    exportData(dataType, format);
  };

  const triggerImport = (source: ImportSource) => {
    setPendingImportSource(source);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await importTasks(file, pendingImportSource);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBackupSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await restoreBackup(file);
    if (backupInputRef.current) backupInputRef.current.value = '';
  };

  const btnClass = "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all active:scale-95";
  const primaryBtn = `${btnClass} bg-[var(--accent-primary)] text-white hover:opacity-90`;
  const secondaryBtn = `${btnClass} border-2 border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50`;

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Download size={18} className="text-[var(--accent-primary)]" />
          <h4 className="text-sm font-bold text-[var(--text-primary)]">Export Data</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Tasks */}
          <div className="border-2 border-[var(--border-primary)] rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
              <FileText size={14} />
              Tasks
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExportClick('tasks', 'csv')}
                disabled={exporting}
                className={secondaryBtn + ' flex-1 justify-center'}
              >
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                CSV
              </button>
              <button
                onClick={() => handleExportClick('tasks', 'pdf')}
                disabled={exporting}
                className={secondaryBtn + ' flex-1 justify-center'}
              >
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                PDF
              </button>
            </div>
          </div>

          {/* Sessions */}
          <div className="border-2 border-[var(--border-primary)] rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
              <Clock size={14} />
              Sessions
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExportClick('sessions', 'csv')}
                disabled={exporting}
                className={secondaryBtn + ' flex-1 justify-center'}
              >
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                CSV
              </button>
              <button
                onClick={() => handleExportClick('sessions', 'pdf')}
                disabled={exporting}
                className={secondaryBtn + ' flex-1 justify-center'}
              >
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                PDF
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="border-2 border-[var(--border-primary)] rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
              <Database size={14} />
              Stats
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExportClick('stats', 'csv')}
                disabled={exporting}
                className={secondaryBtn + ' flex-1 justify-center'}
              >
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                CSV
              </button>
              <button
                onClick={() => handleExportClick('stats', 'pdf')}
                disabled={exporting}
                className={secondaryBtn + ' flex-1 justify-center'}
              >
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Upload size={18} className="text-[var(--accent-primary)]" />
          <h4 className="text-sm font-bold text-[var(--text-primary)]">Import Tasks</h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => triggerImport('csv')}
            disabled={importing}
            className={secondaryBtn + ' justify-center'}
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
            CSV
          </button>
          <button
            onClick={() => triggerImport('notion')}
            disabled={importing}
            className={secondaryBtn + ' justify-center'}
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
            Notion
          </button>
          <button
            onClick={() => triggerImport('todoist')}
            disabled={importing}
            className={secondaryBtn + ' justify-center'}
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
            Todoist
          </button>
          <button
            onClick={() => triggerImport('google-calendar')}
            disabled={importing}
            className={secondaryBtn + ' justify-center'}
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
            Google Cal
          </button>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-2">
          Import tasks from external services. Tasks will be added to your current workspace.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json,.ics"
          onChange={handleFileSelected}
          className="hidden"
        />
      </div>

      {/* Backup / Restore Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Database size={18} className="text-[var(--accent-primary)]" />
          <h4 className="text-sm font-bold text-[var(--text-primary)]">Backup & Restore</h4>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportBackup}
            disabled={exporting}
            className={primaryBtn}
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <HardDriveDownload size={14} />}
            Download Backup
          </button>
          <button
            onClick={() => backupInputRef.current?.click()}
            disabled={importing}
            className={secondaryBtn}
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <HardDriveUpload size={14} />}
            Restore from Backup
          </button>
          <input
            ref={backupInputRef}
            type="file"
            accept=".json"
            onChange={handleBackupSelected}
            className="hidden"
          />
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-2">
          Full backup includes tasks, study sessions, and workspaces as a JSON file.
        </p>
      </div>
    </div>
  );
};

export default DataExportImportPanel;
