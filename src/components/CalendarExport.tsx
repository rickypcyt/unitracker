import { Download, Info, Loader2 } from 'lucide-react';
import React, { useCallback, useState } from 'react';

import { Task } from '@/pages/tasks/taskStorage';
import { downloadICSFile } from '@/utils/googleCalendarExport';

interface CalendarExportProps {
  tasks: Task[];
  className?: string;
}

const CalendarExport: React.FC<CalendarExportProps> = ({ 
  tasks, 
  className = '' 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Exportar como archivo ICS
  const exportToICS = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const activeTasks = tasks.filter(task => !task.completed);
      
      if (activeTasks.length === 0) {
        setError('No active tasks to export.');
        setIsLoading(false);
        return;
      }

      downloadICSFile(activeTasks);
      setSuccess(`Exported ${activeTasks.length} tasks to ICS file.`);
    } catch (err) {
      console.error('Error in ICS export:', err);
      setError('Error generating ICS file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [tasks]);

  // Limpiar mensajes
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const activeTasks = tasks.filter(task => !task.completed);

  return (
    <div className={`relative ${className}`}>
      {/* Export Button with Hover Info */}
      <div 
        className="relative"
        onMouseEnter={() => setShowInfo(true)}
        onMouseLeave={() => setShowInfo(false)}
      >
        <button
          onClick={exportToICS}
          disabled={isLoading || activeTasks.length === 0}
          className="inline-flex items-center justify-center px-3 py-1.5 text-blue-600 text-sm rounded-lg border border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export to ICS
        </button>

        {/* Hover Info Tooltip */}
        {showInfo && (
          <div className="absolute top-full mt-2 right-0 w-64 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg z-50 p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-[var(--text-secondary)] space-y-1">
                <p>• Compatible with Google Calendar, Outlook, Apple Calendar</p>
                <p>• Includes dates, descriptions and reminders</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {(error || success) && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 w-64 z-50">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-center">
              <div className="text-center">
                <p className="text-xs text-red-800">{error}</p>
                <button
                  onClick={clearMessages}
                  className="text-xs text-red-600 hover:text-red-800 mt-1 underline"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-center">
              <div className="text-center">
                <p className="text-xs text-green-800">{success}</p>
                <button
                  onClick={clearMessages}
                  className="text-xs text-green-600 hover:text-green-800 mt-1 underline"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarExport;
