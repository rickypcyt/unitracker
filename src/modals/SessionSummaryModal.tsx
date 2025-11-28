import { Award, Clock, Target } from 'lucide-react';

import BaseModal from './BaseModal';
import React from 'react';

type SessionSummaryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  durationFormatted: string; // HH:MM:SS
  completedTasksCount: number;
  pomodorosCompleted?: number;
};

const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  isOpen,
  onClose,
  durationFormatted,
  completedTasksCount,
  pomodorosCompleted,
}) => {
  const pomodoroCount = pomodorosCompleted ?? 0;
  
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Session Complete!"
      maxWidth="max-w-lg"
      className="overflow-hidden"
    >
      <div className="text-[var(--text-primary)]">
        {/* Session Summary List */}
        <div className="p-6 space-y-4">
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-[var(--accent-primary)]" />
              Session Summary
            </h3>
            
            {/* Summary Items */}
            <div className="space-y-3">
              {/* Duration Item */}
              <div className="flex items-center justify-between py-3 border-b border-[var(--border-primary)]/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">Total Duration</div>
                    <div className="text-sm text-[var(--text-secondary)]">Time spent studying</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {durationFormatted}
                </div>
              </div>

              {/* Tasks Item */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">Tasks Completed</div>
                    <div className="text-sm text-[var(--text-secondary)]">Tasks marked as done</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {completedTasksCount}
                </div>
              </div>
            </div>
          </div>

          {/* Achievement Badge */}
          {pomodoroCount >= 4 && (
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-700/50">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <div className="font-semibold text-yellow-800 dark:text-yellow-200">
                    Productive Session!
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">
                    {pomodoroCount} focus sessions completed - Great concentration!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-semibold shadow-lg"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default SessionSummaryModal;
