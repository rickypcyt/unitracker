import { CheckCircle, Clock, Flame, Target } from 'lucide-react';

import BaseModal from './BaseModal';
import React from 'react';

type SessionSummaryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  durationFormatted: string; // HH:MM:SS
  completedTasksCount: number;
  pomodorosCompleted?: number;
};

const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  isOpen,
  onClose,
  title,
  durationFormatted,
  completedTasksCount,
  pomodorosCompleted,
}) => {
  const pomodoroCount = pomodorosCompleted ?? 0;
  
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="max-w-md"
      className="overflow-hidden"
    >
      <div className="text-[var(--text-primary)]">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">Session Complete!</h2>
            <div className="bg-white/20 rounded-full p-2">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-white/90 font-medium">
            {title || 'Untitled Session'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="p-6 space-y-4">
          {/* Main Stats */}
          <div className="grid grid-cols-2 gap-4">
            {/* Duration Card */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 border border-blue-200 dark:border-blue-700/50">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded-full">
                  Duration
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 font-mono">
                {durationFormatted}
              </div>
            </div>

            {/* Tasks Card */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 border border-green-200 dark:border-green-700/50">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">
                  Tasks
                </span>
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {completedTasksCount}
              </div>
            </div>
          </div>

          {/* Pomodoros Card */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 border border-orange-200 dark:border-orange-700/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 px-2 py-1 rounded-full">
                  Pomodoros Completed
                </span>
              </div>
            </div>
            
            {/* Pomodoro Count Display */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {Array.from({ length: Math.min(pomodoroCount, 5) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-[var(--bg-primary)]"
                  >
                    🍅
                  </div>
                ))}
                {pomodoroCount > 5 && (
                  <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-[var(--bg-primary)]">
                    +{pomodoroCount - 5}
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                {pomodoroCount}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-orange-600 dark:text-orange-400 mb-1">
                <span>Focus Progress</span>
                <span>{Math.min(pomodoroCount * 25, 100)}%</span>
              </div>
              <div className="w-full bg-orange-200 dark:bg-orange-800/30 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(pomodoroCount * 25, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Achievement Badge */}
          {pomodoroCount >= 4 && (
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-700/50">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🏆</div>
                <div>
                  <div className="font-semibold text-yellow-800 dark:text-yellow-200">
                    Productive Session!
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">
                    {pomodoroCount} pomodoros completed - Great focus!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-semibold hover:opacity-90 transition-all duration-200 transform hover:scale-105 shadow-lg"
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
