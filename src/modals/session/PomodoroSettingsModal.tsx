import { Bell, BellOff, Clock, Play, Target, Volume, Volume2 } from 'lucide-react';
import { useAppStore, usePomodoroModes, usePomodoroSettings } from '@/store/appStore';
import { useEffect, useState } from 'react';

import BaseModal from '@/modals/shared/BaseModal';
import type { PomodoroMode } from '@/store/appStore';
import React from 'react';
import { X } from 'lucide-react';

interface PomodoroSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModeIndex: number;
  onModeChange: (index: number) => void;
  onSaveCustomMode: (mode: PomodoroMode) => void;
}

const TIME_PRESETS = {
  work: [15, 25, 50, 60],
  break: [3, 5, 10, 15],
  longBreak: [10, 15, 30, 45],
};

const toMin = (seconds: number) => (seconds / 60).toString();

const PomodoroSettingsModal: React.FC<PomodoroSettingsModalProps> = ({ isOpen, onClose, currentModeIndex, onModeChange, onSaveCustomMode }) => {
  const pomodoroModes = usePomodoroModes();
  const pomodoroSettings = usePomodoroSettings();
  const updatePomodoroSettings = useAppStore((state) => state.updatePomodoroSettings);

  const customModeIndex = pomodoroModes.length - 1;
  const predefinedModes = pomodoroModes.slice(0, customModeIndex);

  const [workMin, setWorkMin] = useState('25');
  const [breakMin, setBreakMin] = useState('5');
  const [longBreakMin, setLongBreakMin] = useState('15');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'times' | 'settings' | 'sounds'>('times');

  const testAlarm = () => {
    if (pomodoroSettings.soundEnabled) {
      const audio = new Audio('/sounds/break-end.mp3');
      audio.volume = pomodoroSettings.volume;
      audio.play().catch(err => console.log('Error playing test sound:', err));
    }
  };

  useEffect(() => {
    if (isOpen) {
      const current = pomodoroModes[currentModeIndex] ?? pomodoroModes[0];
      if (!current) return;
      setWorkMin(toMin(current.work));
      setBreakMin(toMin(current.break));
      setLongBreakMin(toMin(current.longBreak));
      setError('');
      setActiveTab('times');
    }
  }, [isOpen, currentModeIndex, pomodoroModes]);

  const workSec = Math.round(parseFloat(workMin) * 60);
  const breakSec = Math.round(parseFloat(breakMin) * 60);
  const longBreakSec = Math.round(parseFloat(longBreakMin) * 60);

  const matchedPresetIndex = predefinedModes.findIndex(
    m => m.work === workSec && m.break === breakSec && m.longBreak === longBreakSec
  );

  const applyPreset = (mode: PomodoroMode) => {
    setWorkMin(toMin(mode.work));
    setBreakMin(toMin(mode.break));
    setLongBreakMin(toMin(mode.longBreak));
    setError('');
  };

  const setChip = (field: 'work' | 'break' | 'longBreak', minutes: number) => {
    if (field === 'work') setWorkMin(minutes.toString());
    else if (field === 'break') setBreakMin(minutes.toString());
    else setLongBreakMin(minutes.toString());
    setError('');
  };

  const handleSave = () => {
    const valid = [workSec, breakSec, longBreakSec].every(s => Number.isFinite(s) && s > 0)
      && workSec <= 4 * 3600 && breakSec <= 3600 && longBreakSec <= 2 * 3600;
    if (!valid) {
      setError('Enter valid times: work up to 4h, break up to 1h, long break up to 2h.');
      return;
    }
    if (matchedPresetIndex >= 0) {
      onModeChange(matchedPresetIndex);
    } else {
      onSaveCustomMode({ label: 'Custom', work: workSec, break: breakSec, longBreak: longBreakSec });
    }
    onClose();
  };

  const handleSettingsChange = (key: keyof typeof pomodoroSettings, value: any) => {
    updatePomodoroSettings({ [key]: value });
  };

  const stepValue = (field: 'work' | 'break' | 'longBreak', delta: number) => {
    const current = parseFloat(field === 'work' ? workMin : field === 'break' ? breakMin : longBreakMin) || 0;
    const next = Math.min(Math.max(current + delta, 1), 240);
    setChip(field, next);
  };

  const TimeField = ({ label, value, onChange, field }: { label: string; value: string; onChange: (v: string) => void; field: 'work' | 'break' | 'longBreak' }) => (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 p-3 flex flex-col items-center">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{label}</span>
      <div className="flex items-center gap-1.5 mt-2">
        <button
          type="button"
          onClick={() => stepValue(field, -1)}
          className="w-7 h-7 rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50 transition-colors flex items-center justify-center text-sm font-bold"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <div className="relative w-[4.5rem]">
          <input
            type="number"
            min="1"
            value={value}
            onChange={(e) => { onChange(e.target.value); setError(''); }}
            className="w-full px-1 py-1.5 rounded-lg bg-transparent text-center text-2xl font-bold text-[var(--text-primary)] border border-transparent focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={() => stepValue(field, 1)}
          className="w-7 h-7 rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50 transition-colors flex items-center justify-center text-sm font-bold"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
      <span className="text-[11px] text-[var(--text-secondary)] mt-0.5">minutes</span>
      <div className="flex flex-wrap justify-center gap-1 mt-2.5">
        {TIME_PRESETS[field].map(p => (
          <button
            key={p}
            type="button"
            onClick={() => setChip(field, p)}
            className={`min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
              parseFloat(value) === p
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)]'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );

  const tabClass = (tab: string) =>
    `flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-colors ${
      activeTab === tab
        ? 'border-2 border-[var(--accent-primary)] text-[var(--accent-primary)]'
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
    }`;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="" showHeader={false} padding="none" maxWidth="max-w-lg">
      <div className="p-6">
        <div className="relative flex items-center justify-center mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] text-center">
            Pomodoro Settings
          </h2>
          <button
            onClick={onClose}
            className="absolute right-0 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 rounded-lg p-1">
          <button onClick={() => setActiveTab('times')} className={tabClass('times')}>
            <Clock size={16} />
            Times
          </button>
          <button onClick={() => setActiveTab('settings')} className={tabClass('settings')}>
            <Play size={16} />
            Behavior
          </button>
          <button onClick={() => setActiveTab('sounds')} className={tabClass('sounds')}>
            <Volume2 size={16} />
            Sounds
          </button>
        </div>

        {/* Tab Content */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          {activeTab === 'times' && (
            <div className="space-y-6 lg:col-span-2">
              <div>
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-1">Quick presets</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-3">Tap to fill the times, then tweak below.</p>
                <div className="flex flex-wrap gap-2">
                  {predefinedModes.map((mode, index) => {
                    const active = matchedPresetIndex === index;
                    return (
                      <button
                        key={mode.label}
                        type="button"
                        onClick={() => applyPreset(mode)}
                        className={`px-3.5 py-2 rounded-full border text-sm font-medium transition-all ${
                          active
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]'
                            : 'border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/50 hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {mode.label}
                        <span className="ml-1.5 text-xs opacity-70 font-normal">
                          {mode.work / 60}·{mode.break / 60}·{mode.longBreak / 60}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="text-lg font-medium text-[var(--text-primary)]">Times</h3>
                  <span className="text-xs text-[var(--text-secondary)]">in minutes</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <TimeField label="Focus" value={workMin} onChange={setWorkMin} field="work" />
                  <TimeField label="Break" value={breakMin} onChange={setBreakMin} field="break" />
                  <TimeField label="Long break" value={longBreakMin} onChange={setLongBreakMin} field="longBreak" />
                </div>
                {matchedPresetIndex < 0 && (
                  <p className="text-xs text-[var(--text-secondary)] mt-3 text-center">Custom combination — will be saved as your Custom mode.</p>
                )}
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
          )}

          {activeTab === 'settings' && (
            <>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">Auto-start Settings</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 rounded-lg">
                      <span className="text-[var(--text-primary)]">Auto-start breaks</span>
                      <input
                        type="checkbox"
                        checked={pomodoroSettings.autoStartBreak}
                        onChange={(e) => handleSettingsChange('autoStartBreak', e.target.checked)}
                        className="w-5 h-5 rounded text-[var(--accent-primary)]"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 rounded-lg">
                      <span className="text-[var(--text-primary)]">Auto-start work sessions</span>
                      <input
                        type="checkbox"
                        checked={pomodoroSettings.autoStartWork}
                        onChange={(e) => handleSettingsChange('autoStartWork', e.target.checked)}
                        className="w-5 h-5 rounded text-[var(--accent-primary)]"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">Daily Goals</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg">
                      <Target size={20} className="text-[var(--accent-primary)]" />
                      <div className="flex-1">
                        <label className="text-[var(--text-primary)]">Daily Pomodoro Goal</label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={pomodoroSettings.dailyGoal}
                          onChange={(e) => handleSettingsChange('dailyGoal', parseInt(e.target.value) || 1)}
                          className="mt-1 w-20 px-2 py-1 rounded text-[var(--text-primary)] border-2 border-[var(--border-primary)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'sounds' && (
            <>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">Sound Settings</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bell size={20} className="text-[var(--accent-primary)]" />
                        <span className="text-[var(--text-primary)]">Timer sounds</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={pomodoroSettings.soundEnabled}
                        onChange={(e) => handleSettingsChange('soundEnabled', e.target.checked)}
                        className="w-5 h-5 rounded text-[var(--accent-primary)]"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <BellOff size={20} className="text-[var(--accent-primary)]" />
                        <span className="text-[var(--text-primary)]">Browser notifications</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={pomodoroSettings.notificationEnabled}
                        onChange={(e) => handleSettingsChange('notificationEnabled', e.target.checked)}
                        className="w-5 h-5 rounded text-[var(--accent-primary)]"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">Volume</h3>
                  <div className="flex items-center gap-3 p-3 rounded-lg">
                    <Volume2 size={20} className="text-[var(--accent-primary)]" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={pomodoroSettings.volume}
                      onChange={(e) => handleSettingsChange('volume', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-[var(--text-primary)] w-12 text-right">
                      {Math.round(pomodoroSettings.volume * 100)}%
                    </span>
                  </div>

                  <div className="mt-3">
                    <button
                      onClick={testAlarm}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
                    >
                      <Volume size={16} />
                      Test Alarm Sound
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border-primary)] lg:col-span-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors border-2 border-[var(--border-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default PomodoroSettingsModal;
