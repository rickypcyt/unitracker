import { Clock, Play, Timer } from 'lucide-react';

import BaseMenu from '@/modals/BaseMenu';
import React from 'react';

interface StartSessionMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onStartSession: () => void;
  onStartTimer: () => void;
  onStartPomodoro: () => void;
}

const StartSessionMenu: React.FC<StartSessionMenuProps> = ({
  x,
  y,
  onClose,
  onStartSession,
  onStartTimer,
  onStartPomodoro,
}) => {
  return (
    <BaseMenu
      x={Math.min(x, window.innerWidth - 220)}
      y={Math.min(y, window.innerHeight - 150)}
      onClose={onClose}
      aria-label="Start session menu"
    >
      <div className="space-y-1">
        <button
          onClick={() => {
            onStartSession();
            onClose();
          }}
          className="px-4 py-2 border-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 border-[var(--accent-primary)] bg-transparent text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 focus:bg-[var(--accent-primary)]/10"
        >
          <Play size={16} />
          Start Session
        </button>
        <button
          onClick={() => {
            onStartTimer();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-base bg-neutral-800 hover:bg-neutral-700 rounded-md bg-opacity-60 flex items-center gap-2 transition-colors duration-200"
        >
          <Clock size={16} />
          Start Timer
        </button>
        <button
          onClick={() => {
            onStartPomodoro();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-base bg-neutral-800 hover:bg-neutral-700 rounded-md bg-opacity-60 flex items-center gap-2 transition-colors duration-200"
        >
          <Timer size={16} />
          Start Pomodoro
        </button>
      </div>
    </BaseMenu>
  );
};

export default StartSessionMenu; 