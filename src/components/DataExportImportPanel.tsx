import {
  Clock,
  Database,
  Download,
  FileText,
  FileSpreadsheet,
  HardDriveDownload,
  HardDriveUpload,
  Loader2,
} from 'lucide-react';
import { useRef } from 'react';

import { useDataExportImport } from '@/hooks/useDataExportImport';

const DataExportImportPanel = () => {
  const {
    exporting,
    importing,
    exportData,
    exportBackup,
    restoreBackup,
  } = useDataExportImport();

  const backupInputRef = useRef<HTMLInputElement>(null);

  const handleExportClick = (dataType: 'tasks' | 'sessions' | 'stats', format: 'csv' | 'pdf') => {
    exportData(dataType, format);
  };

  const handleBackupSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await restoreBackup(file);
    if (backupInputRef.current) backupInputRef.current.value = '';
  };

  const btnClass = "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all active:scale-95";
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
            <button
              onClick={() => handleExportClick('tasks', 'csv')}
              disabled={exporting}
              className={secondaryBtn + ' w-full justify-center'}
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
              CSV
            </button>
          </div>

          {/* Sessions */}
          <div className="border-2 border-[var(--border-primary)] rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
              <Clock size={14} />
              Sessions
            </div>
            <button
              onClick={() => handleExportClick('sessions', 'csv')}
              disabled={exporting}
              className={secondaryBtn + ' w-full justify-center'}
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
              CSV
            </button>
          </div>

          {/* Stats */}
          <div className="border-2 border-[var(--border-primary)] rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
              <Database size={14} />
              Stats
            </div>
            <button
              onClick={() => handleExportClick('stats', 'csv')}
              disabled={exporting}
              className={secondaryBtn + ' w-full justify-center'}
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
              CSV
            </button>
          </div>
        </div>
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
            className={secondaryBtn}
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
