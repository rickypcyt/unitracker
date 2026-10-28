import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Flag,
  Pause,
  Play,
  RotateCcw,
  X,
} from 'lucide-react';

// ─── Demo sync bus ───────────────────────────────────────────────────────────
// Mirrors the app's SYNC_EVENTS system: when "Sync Pomodoro" is on, the study
// timer broadcasts control events that the pomodoro listens to.
const bus = new EventTarget();
const EV = {
  SYNC: 'demo:sync',
  PLAY: 'demo:play',
  PAUSE: 'demo:pause',
  RESET: 'demo:reset',
  ADJUST: 'demo:adjust', // detail: seconds
};

const emit = (type: string, detail?: number) =>
  bus.dispatchEvent(new CustomEvent(type, { detail }));

const useBusEvent = (type: string, handler: (e: Event) => void) => {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const fn = (e: Event) => ref.current(e);
    bus.addEventListener(type, fn);
    return () => bus.removeEventListener(type, fn);
  }, [type]);
};

// ─── Shared ring (same svg geometry as the real timers: viewBox 120, r=52) ────
const RING_RADIUS = 52;
const CIRC = 2 * Math.PI * RING_RADIUS;

const Ring = ({
  progress,
  color,
  spinning,
  children,
}: {
  progress: number; // 0..1 elapsed
  color: string;
  spinning?: boolean;
  children: React.ReactNode;
}) => (
  <div className="relative w-32 h-32">
    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={RING_RADIUS} fill="none" stroke="var(--border-primary)" strokeWidth="5" opacity="0.5" />
      <circle
        cx="60" cy="60" r={RING_RADIUS} fill="none"
        stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={spinning ? CIRC * 0.25 : CIRC}
        strokeDashoffset={spinning ? CIRC * 0.5 : CIRC * (1 - progress)}
        className={`transition-all duration-300 ${spinning ? 'animate-spin origin-center' : ''}`}
        style={{ transformOrigin: '60px 60px', animationDuration: spinning ? '2s' : undefined }}
      />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      {children}
    </div>
  </div>
);

// ─── Pomodoro demo (copy of src/pages/session/Pomodoro.tsx) ─────────────────
const POMO_RED = '#ef4444';
const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

export const PomodoroDemo = () => {
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(WORK_SECONDS);
  const [running, setRunning] = useState(false);
  const [synced, setSynced] = useState(false);
  const modeDuration = mode === 'work' ? WORK_SECONDS : BREAK_SECONDS;

  // Tick
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setMode((m) => {
            const next = m === 'work' ? 'break' : 'work';
            setTimeLeft(next === 'work' ? WORK_SECONDS : BREAK_SECONDS);
            return next;
          });
          return t;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const reset = () => {
    setRunning(false);
    setMode('work');
    setTimeLeft(WORK_SECONDS);
  };

  // Listen to study-timer sync events (same as syncPomodoroWithTimer)
  useBusEvent(EV.SYNC, (e) => setSynced(Boolean((e as CustomEvent).detail)));
  useBusEvent(EV.PLAY, () => synced && setRunning(true));
  useBusEvent(EV.PAUSE, () => synced && setRunning(false));
  useBusEvent(EV.RESET, () => synced && reset());
  useBusEvent(EV.ADJUST, (e) => {
    if (!synced) return;
    const secs = (e as CustomEvent).detail ?? 0;
    setTimeLeft((t) => Math.max(0, t + secs));
  });

  const rounded = Math.round(timeLeft);
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  const progress = Math.max(0, Math.min(1, 1 - timeLeft / modeDuration));
  const isBreak = mode !== 'work';
  const isPaused = !running && timeLeft < modeDuration;

  return (
    <div className="flex flex-col items-center py-2 min-h-[230px]">
      {/* Timer display */}
      <div className="w-full flex-1 flex flex-col items-center justify-center py-2" role="timer">
        <div className="relative">
          {!synced && (
            <button
              onClick={reset}
              className="timer-ctrl-btn absolute right-full top-0 bottom-0 my-auto mr-3"
              aria-label="Reset timer"
            >
              <RotateCcw size={18} />
            </button>
          )}
          <Ring progress={progress} color={POMO_RED} spinning={isPaused && running === false && timeLeft !== modeDuration}>
            <div className={`flex items-center gap-0.5 ${isBreak && !isPaused ? 'animate-pulse' : ''}`}>
              <span className="text-2xl font-mono font-bold tabular-nums leading-none" style={{ color: POMO_RED }}>
                {mins.toString().padStart(2, '0')}
              </span>
              <span className="text-xl font-mono font-bold leading-none" style={{ color: POMO_RED }}>:</span>
              <span className="text-2xl font-mono font-bold tabular-nums leading-none" style={{ color: POMO_RED }}>
                {secs.toString().padStart(2, '0')}
              </span>
            </div>
            <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mt-1">
              {mode === 'work' ? 'Focus' : 'Break'}
            </span>
          </Ring>
        </div>
      </div>

      {/* Controls — hidden while synced, exactly like the real component */}
      {!synced ? (
        <div className="flex flex-nowrap justify-center items-center gap-x-2 mt-auto shrink-0 pt-2 pb-2">
          <div className="flex gap-1 shrink-0">
            {[-600, -300].map((adj) => (
              <button key={adj} onClick={() => setTimeLeft((t) => Math.max(0, t + adj))} className="timer-adjust-btn" aria-label={`Subtract ${Math.abs(adj / 60)} minutes`}>
                {adj / 60}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!running ? (
              <button onClick={() => setRunning(true)} className="timer-ctrl-btn timer-ctrl-btn-pomo" aria-label="Start timer">
                <Play size={18} />
              </button>
            ) : (
              <button onClick={() => setRunning(false)} className="timer-ctrl-btn timer-ctrl-btn-pomo" aria-label="Pause timer">
                <Pause size={18} />
              </button>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            {[300, 600].map((adj) => (
              <button key={adj} onClick={() => setTimeLeft((t) => t + adj)} className="timer-adjust-btn" aria-label={`Add ${adj / 60} minutes`}>
                +{adj / 60}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-auto shrink-0 pt-2 pb-2 h-[52px] flex items-center">
          <span className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            Synced with Study Timer
          </span>
        </div>
      )}
    </div>
  );
};

// ─── Study timer demo (copy of src/pages/session/StudyTimer.tsx) ─────────────
export const StudyTimerDemo = () => {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [started] = useState(true); // demo pretends a session exists
  const [paused, setPaused] = useState(false);
  const [syncPomo, setSyncPomo] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    emit(EV.SYNC, syncPomo ? 1 : 0);
  }, [syncPomo]);

  const start = () => {
    setRunning(true);
    setPaused(false);
    if (syncPomo) emit(EV.PLAY);
  };
  const pause = () => {
    setRunning(false);
    setPaused(true);
    if (syncPomo) emit(EV.PAUSE);
  };
  const reset = () => {
    setRunning(false);
    setPaused(false);
    setElapsed(0);
    if (syncPomo) emit(EV.RESET);
  };
  const adjust = (secs: number) => {
    setElapsed((s) => Math.max(0, s + secs));
    if (syncPomo) emit(EV.ADJUST, secs);
  };

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const hourProgress = (elapsed % 3600) / 3600;

  return (
    <div className="flex flex-col items-center py-2 min-h-[230px]">
      {/* Sync toggle — same control as StartSessionModal */}
      <button
        onClick={() => setSyncPomo((v) => !v)}
        className="mb-1 flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <span
          className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
            syncPomo ? 'bg-[var(--accent-primary)]' : 'bg-[var(--border-primary)]'
          }`}
        >
          <span
            className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${
              syncPomo ? 'translate-x-3.5' : 'translate-x-0.5'
            }`}
          />
        </span>
        Sync Pomodoro with timer
      </button>

      {/* Timer display */}
      <div className="w-full flex-1 flex flex-col items-center justify-center py-2" role="timer">
        <div className="relative">
          {started && (
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 flex gap-2">
              <button onClick={reset} className="timer-ctrl-btn" aria-label="Reset timer" title="Reset timer">
                <RotateCcw size={18} />
              </button>
              <button className="timer-ctrl-btn" aria-label="Add lap note" title="Add lap note">
                <Flag size={18} />
              </button>
            </div>
          )}
          {started && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 flex gap-2">
              <button className="timer-ctrl-btn" aria-label="Finish session" title="Finish session">
                <Check size={18} className="text-emerald-400" />
              </button>
              <button className="timer-ctrl-btn" aria-label="Cancel session" title="Cancel session">
                <X size={18} className="text-red-400" />
              </button>
            </div>
          )}
          <Ring progress={hourProgress} color="var(--accent-primary)" spinning={paused}>
            <div className="flex items-center gap-0.5">
              {h > 0 ? (
                <>
                  <span className={`text-lg font-mono font-bold tabular-nums leading-none ${running ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                    {h.toString().padStart(2, '0')}
                  </span>
                  <span className={`text-base font-mono font-bold leading-none ${running ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}>:</span>
                  <span className={`text-lg font-mono font-bold tabular-nums leading-none ${running ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                    {m.toString().padStart(2, '0')}
                  </span>
                  <span className={`text-base font-mono font-bold leading-none ${running ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}>:</span>
                  <span className={`text-lg font-mono font-bold tabular-nums leading-none ${running ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                    {s.toString().padStart(2, '0')}
                  </span>
                </>
              ) : (
                <>
                  <span className={`text-2xl font-mono font-bold tabular-nums leading-none ${running ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                    {m.toString().padStart(2, '0')}
                  </span>
                  <span className={`text-xl font-mono font-bold leading-none ${running ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}>:</span>
                  <span className={`text-2xl font-mono font-bold tabular-nums leading-none ${running ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                    {s.toString().padStart(2, '0')}
                  </span>
                </>
              )}
            </div>
          </Ring>
        </div>
      </div>

      {/* Controls: adjustments + play/pause in a single centered row */}
      <div className="flex flex-nowrap justify-center items-center gap-x-2 mt-auto shrink-0 pt-2 pb-2">
        <div className="flex gap-1 shrink-0">
          {started && [-600, -300].map((adj) => (
            <button key={adj} onClick={() => adjust(adj)} className="timer-adjust-btn" aria-label={`Subtract ${Math.abs(adj / 60)} minutes`}>
              {adj / 60}
            </button>
          ))}
        </div>

        {!running ? (
          <button onClick={start} className="timer-ctrl-btn timer-ctrl-btn-primary mx-1 shrink-0" aria-label="Start session" title="Start session">
            <Play size={18} />
          </button>
        ) : (
          <button onClick={pause} className="timer-ctrl-btn timer-ctrl-btn-primary mx-1 shrink-0" aria-label="Pause timer" title="Pause timer">
            <Pause size={18} />
          </button>
        )}

        <div className="flex gap-1 shrink-0">
          {started && [300, 600].map((adj) => (
            <button key={adj} onClick={() => adjust(adj)} className="timer-adjust-btn" aria-label={`Add ${adj / 60} minutes`}>
              +{adj / 60}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
