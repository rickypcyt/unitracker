import React, { useState } from 'react';
import { Settings, Clock } from 'lucide-react';
import BaseModal from '@/modals/BaseModal';

const TimerSettings = ({ isOpen, onClose }) => {
  const [pomodoroSettings, setPomodoroSettings] = useState({
    work: 25,
    break: 5,
    longBreak: 15,
    workSessionsBeforeLongBreak: 4
  });

  const [countdownSettings, setCountdownSettings] = useState({
    hours: 1,
    minutes: 0,
    seconds: 0
  });

  const handlePomodoroChange = (field, value) => {
    setPomodoroSettings(prev => ({
      ...prev,
      [field]: Math.max(1, parseInt(value) || 1)
    }));
  };

  const handleCountdownChange = (field, value) => {
    const numValue = parseInt(value) || 0;
    const maxValue = field === 'hours' ? 23 : 59;
    setCountdownSettings(prev => ({
      ...prev,
      [field]: Math.max(0, Math.min(numValue, maxValue))
    }));
  };

  const handleSave = () => {
    // Guardar configuración en localStorage
    localStorage.setItem('pomodoroSettings', JSON.stringify(pomodoroSettings));
    localStorage.setItem('countdownSettings', JSON.stringify(countdownSettings));
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Timer Settings"
      maxWidth="max-w-md"
    >
      <div className="space-y-6">
        {/* Configuración de Pomodoro */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={20} className="text-[var(--accent-primary)]" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Pomodoro Settings</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Work (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={pomodoroSettings.work}
                onChange={(e) => handlePomodoroChange('work', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Break (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={pomodoroSettings.break}
                onChange={(e) => handlePomodoroChange('break', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Long Break (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={pomodoroSettings.longBreak}
                onChange={(e) => handlePomodoroChange('longBreak', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Sessions before long break
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={pomodoroSettings.workSessionsBeforeLongBreak}
                onChange={(e) => handlePomodoroChange('workSessionsBeforeLongBreak', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
            </div>
          </div>
        </div>

        {/* Configuración de Countdown */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={20} className="text-[var(--accent-primary)]" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Countdown Default Time</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Hours
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={countdownSettings.hours}
                onChange={(e) => handleCountdownChange('hours', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Minutes
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={countdownSettings.minutes}
                onChange={(e) => handleCountdownChange('minutes', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Seconds
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={countdownSettings.seconds}
                onChange={(e) => handleCountdownChange('seconds', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors border border-[var(--border-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-secondary)] transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default TimerSettings; 