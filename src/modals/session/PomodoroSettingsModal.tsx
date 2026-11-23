import { Bell, BellOff, Play, Target, Volume2, X } from 'lucide-react';
import { useAppStore, usePomodoroModes, usePomodoroSettings } from '@/store/appStore';
import { useEffect, useState } from 'react';
import ReactSlider from 'react-slider';

import BaseModal from '@/modals/shared/BaseModal';
import type { PomodoroMode } from '@/store/appStore';
import React from 'react';

interface PomodoroSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModeIndex: number;
  onModeChange: (index: number) => void;
  onSaveCustomMode: (mode: PomodoroMode) => void;
}

const toMin = (seconds: number) => (seconds / 60).toString();

const Switch = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 ${checked ? 'bg-[var(--accent-primary)]' : 'bg-[var(--text-secondary)]/30'}`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`}
    />
  </button>
);

const Row = ({ icon, label, hint, children }: { icon?: React.ReactNode; label: string; hint?: string; children: React.ReactNode }) => (
  <div className="flex items-center gap-3 px-3.5 py-2.5">
    {icon && <span className="text-[var(--accent-primary)] shrink-0">{icon}</span>}
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium text-[var(--text-primary)]">{label}</div>
      {hint && <div className="text-xs text-[var(--text-secondary)]">{hint}</div>}
    </div>
    {children}
  </div>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 divide-y divide-[var(--border-primary)]/60 ${className}`}>
    {children}
  </div>
);

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
    }
  }, [isOpen, currentModeIndex, pomodoroModes]);

  const workSec = Math.round(parseFloat(workMin) * 60);
  const breakSec = Math.round(parseFloat(breakMin) * 60);
  const longBreakSec = Math.round(parseFloat(longBreakMin) * 60);

  const matchedPresetIndex = predefinedModes.findIndex(
    m => m.work === workSec && m.break === breakSec && m.longBreak === longBreakSec
  );
  const isCustom = matchedPresetIndex < 0;

  const applyPreset = (mode: PomodoroMode) => {
    setWorkMin(toMin(mode.work));
    setBreakMin(toMin(mode.break));
    setLongBreakMin(toMin(mode.longBreak));
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

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="" showHeader={false} padding="none" maxWidth="max-w-[92vw]" className="!w-auto">
      <div className="p-4">
        <div className="relative flex items-center justify-center mb-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)] text-center">
            Pomodoro Settings
          </h2>
          <button
            onClick={onClose}
            className="absolute right-0 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {/* Left column: Daily goal + Mode */}
          <div className="space-y-3">
          {/* Daily goal — hover to edit, no card */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Goal</h3>
            <div className="flex items-center gap-3 px-1 py-1">
              <Target size={18} className="text-[var(--accent-primary)] shrink-0" />
              <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">Daily goal</span>
              <input
                type="number"
                min="1"
                max="50"
                value={pomodoroSettings.dailyGoal}
                onChange={(e) => handleSettingsChange('dailyGoal', parseInt(e.target.value) || 1)}
                aria-label="Daily pomodoro goal"
                className="no-spinners w-14 px-1.5 py-1 rounded-md bg-transparent text-right text-sm font-semibold text-[var(--text-primary)] border border-transparent hover:border-[var(--border-primary)] focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
              />
              <span className="text-sm text-[var(--text-secondary)]">/ day</span>
            </div>
          </div>

          {/* Mode presets — stacked horizontal cards */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Mode</h3>
            <div className="grid grid-cols-3 gap-2">
              {predefinedModes.map((mode, index) => {
                const active = matchedPresetIndex === index;
                return (
                  <button
                    key={mode.label}
                    type="button"
                    onClick={() => applyPreset(mode)}
                    className={`flex flex-col items-stretch gap-2 rounded-xl border px-3 py-3 text-left transition-all ${
                      active
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-sm'
                        : 'border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 hover:border-[var(--accent-primary)]/40 hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <div>
                      <div className={`text-sm font-bold tracking-tight ${active ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                        {mode.label}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] leading-snug mt-0.5">
                        {mode.description}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[var(--border-primary)]/60">
                      {([
                        ['Focus', mode.work],
                        ['Break', mode.break],
                        ['Long', mode.longBreak],
                      ] as const).map(([k, sec]) => (
                        <div key={k} className="text-center">
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{k}</div>
                          <div className="text-xs font-bold text-[var(--text-primary)] tabular-nums">{sec / 60}m</div>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
              {isCustom && (
                <div className="flex flex-col items-stretch gap-2 rounded-xl border border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-3 py-3 shadow-sm">
                  <div>
                    <div className="text-sm font-bold tracking-tight text-[var(--accent-primary)]">Custom</div>
                    <div className="text-[11px] text-[var(--text-secondary)] leading-snug mt-0.5">
                      Your personalized settings
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[var(--border-primary)]/60">
                    {([
                      ['Focus', workMin],
                      ['Break', breakMin],
                      ['Long', longBreakMin],
                    ] as const).map(([k, v]) => (
                      <div key={k} className="text-center">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{k}</div>
                        <div className="text-xs font-bold text-[var(--text-primary)] tabular-nums">{v || '—'}m</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>

          {/* Right column: Times + Sound */}
          <div className="space-y-3">
          {/* Times */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Times</h3>
            <Card>
              {([
                { label: 'Focus', value: workMin, set: setWorkMin, field: 'Focus minutes' },
                { label: 'Break', value: breakMin, set: setBreakMin, field: 'Break minutes' },
                { label: 'Long break', value: longBreakMin, set: setLongBreakMin, field: 'Long break minutes' },
              ] as const).map(({ label, value, set, field }) => (
                <div key={label} className="flex items-center gap-3 px-3.5 py-2.5">
                  <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">{label}</span>
                  <input
                    type="number"
                    min="1"
                    value={value}
                    onChange={(e) => { set(e.target.value); setError(''); }}
                    aria-label={field}
                    className="no-spinners w-14 px-1.5 py-1 rounded-md bg-transparent text-right text-sm font-semibold text-[var(--text-primary)] border border-transparent hover:border-[var(--border-primary)] focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
                  />
                  <span className="text-sm text-[var(--text-secondary)] w-8">min</span>
                </div>
              ))}
            </Card>
            {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
          </div>

          {/* Volume — own section, prominent slider */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Volume</h3>
            <Card>
              <div className="px-4 py-3">
                <div className="flex items-center gap-3 mb-3">
                  <Volume2 size={18} className="text-[var(--accent-primary)] shrink-0" />
                  <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">Alarm volume</span>
                  <span className="text-sm font-bold text-[var(--accent-primary)] tabular-nums w-10 text-right">
                    {Math.round(pomodoroSettings.volume * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ReactSlider
                    className="h-3 flex-1 bg-[var(--border-primary)] rounded-full"
                    thumbClassName="h-6 w-6 rounded-full bg-[var(--accent-primary)] border-[3px] border-[var(--bg-primary)] shadow-lg cursor-pointer -translate-y-1.5 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                    trackClassName="h-3 rounded-full"
                    renderTrack={(props: { key?: React.Key } & React.HTMLProps<HTMLDivElement>) => {
                      const { key, ...rest } = props;
                      return <div key={key} {...rest} className="h-3 rounded-full bg-[var(--accent-primary)]" />;
                    }}
                    renderThumb={(props: { key?: React.Key } & React.HTMLProps<HTMLDivElement>) => {
                      const { key, ...rest } = props;
                      return <div key={key} {...rest} />;
                    }}
                    min={0}
                    max={1}
                    step={0.01}
                    value={pomodoroSettings.volume}
                    onChange={(v) => handleSettingsChange('volume', Array.isArray(v) ? v[0] ?? 0 : v)}
                    aria-label="Volume"
                  />
                  {pomodoroSettings.soundEnabled && (
                    <button
                      onClick={testAlarm}
                      aria-label="Test sound"
                      title="Test sound"
                      className="shrink-0 w-8 h-8 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center hover:bg-[var(--accent-primary)]/20 transition-colors"
                    >
                      <Play size={14} className="ml-0.5" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Sound — stacked horizontal cards */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Sound</h3>
            <Card>
              <Row icon={<Bell size={18} />} label="Timer sounds" hint="Play a sound when a session ends">
                <Switch checked={pomodoroSettings.soundEnabled} onChange={(v) => handleSettingsChange('soundEnabled', v)} label="Timer sounds" />
              </Row>
              <Row icon={<BellOff size={18} />} label="Notifications" hint="Desktop notification when a session ends">
                <Switch checked={pomodoroSettings.notificationEnabled} onChange={(v) => handleSettingsChange('notificationEnabled', v)} label="Notifications" />
              </Row>
            </Card>
          </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-[var(--border-primary)]">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-opacity border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
          >
            Apply
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default PomodoroSettingsModal;
