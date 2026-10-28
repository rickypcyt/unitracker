import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud,
  CloudOff,
  Flag,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
} from 'lucide-react';

const R = 44;
const CIRC = 2 * Math.PI * R;

const formatMMSS = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const TimerRing = ({
  progress,
  color,
  label,
  sublabel,
}: {
  progress: number;
  color: string;
  label: string;
  sublabel: string;
}) => (
  <div className="relative w-44 h-44 mx-auto">
    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
      <circle
        cx="50" cy="50" r={R} fill="none"
        stroke="var(--border-primary)" strokeOpacity="0.35" strokeWidth="4"
      />
      <circle
        cx="50" cy="50" r={R} fill="none"
        stroke={color} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={CIRC * (1 - progress)}
        style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s ease' }}
      />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <span
        className="text-3xl font-bold tabular-nums tracking-tight"
        style={{ color }}
      >
        {label}
      </span>
      <span className="text-[11px] uppercase tracking-widest text-[var(--text-secondary)] mt-1">
        {sublabel}
      </span>
    </div>
  </div>
);

const CtrlBtn = ({
  onClick,
  label,
  primary,
  color,
  children,
}: {
  onClick: () => void;
  label: string;
  primary?: boolean;
  color?: string;
  children: React.ReactNode;
}) => (
  <motion.button
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    aria-label={label}
    className={`inline-flex items-center justify-center rounded-full border-2 transition-colors ${
      primary ? 'w-12 h-12' : 'w-10 h-10'
    }`}
    style={{
      color: color ?? 'var(--text-secondary)',
      borderColor: color ?? 'var(--border-primary)',
      backgroundColor: 'transparent',
    }}
  >
    {children}
  </motion.button>
);

// ─── Pomodoro demo ──────────────────────────────────────────────────────────

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

export const PomodoroDemo = () => {
  const [phase, setPhase] = useState<'work' | 'break'>('work');
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS);
  const [running, setRunning] = useState(false);
  const total = phase === 'work' ? WORK_SECONDS : BREAK_SECONDS;
  const color = phase === 'work' ? '#ef4444' : '#22c55e';

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setPhase((p) => (p === 'work' ? 'break' : 'work'));
          return phase === 'work' ? BREAK_SECONDS : WORK_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, phase]);

  const reset = () => {
    setRunning(false);
    setPhase('work');
    setSecondsLeft(WORK_SECONDS);
  };

  return (
    <div className="flex flex-col items-center py-4">
      <div className="flex gap-2 mb-4">
        {(['work', 'break'] as const).map((p) => (
          <button
            key={p}
            onClick={() => {
              setPhase(p);
              setSecondsLeft(p === 'work' ? WORK_SECONDS : BREAK_SECONDS);
            }}
            className="px-3 py-1 rounded-full text-xs font-semibold capitalize border transition-colors"
            style={{
              color: phase === p ? color : 'var(--text-secondary)',
              borderColor: phase === p ? color : 'var(--border-primary)',
              backgroundColor: phase === p ? `${color}14` : 'transparent',
            }}
          >
            {p === 'work' ? 'Focus' : 'Break'}
          </button>
        ))}
      </div>

      <TimerRing
        progress={secondsLeft / total}
        color={color}
        label={formatMMSS(secondsLeft)}
        sublabel={phase === 'work' ? 'Focus time' : 'Take a break'}
      />

      <div className="flex items-center gap-3 mt-5">
        <CtrlBtn onClick={reset} label="Reset">
          <RotateCcw size={16} />
        </CtrlBtn>
        <CtrlBtn
          onClick={() => setSecondsLeft((s) => Math.max(0, s - 60))}
          label="Minus 1 minute"
        >
          <Minus size={16} />
        </CtrlBtn>
        <CtrlBtn
          primary
          color={color}
          onClick={() => setRunning((r) => !r)}
          label={running ? 'Pause' : 'Start'}
        >
          {running ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </CtrlBtn>
        <CtrlBtn
          onClick={() => setSecondsLeft((s) => Math.min(total, s + 60))}
          label="Plus 1 minute"
        >
          <Plus size={16} />
        </CtrlBtn>
        <CtrlBtn onClick={() => setPhase((p) => (p === 'work' ? 'break' : 'work'))} label="Skip phase">
          <Flag size={16} />
        </CtrlBtn>
      </div>
      <p className="mt-4 text-xs text-[var(--text-secondary)]">
        {running ? 'Running — auto-switches to break' : 'Press play to try it'}
      </p>
    </div>
  );
};

// ─── Study timer demo ───────────────────────────────────────────────────────

export const StudyTimerDemo = () => {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [synced, setSynced] = useState(true);
  const pendingRef = useRef(0);
  const [, force] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed((s) => s + 1);
      if (!synced) {
        pendingRef.current += 1;
      }
    }, 1000);
    return () => clearInterval(id);
  }, [running, synced]);

  const toggleSync = () => {
    setSynced((s) => {
      if (s === false) {
        // turning sync back on → flush pending
        pendingRef.current = 0;
      }
      return !s;
    });
    force((n) => n + 1);
  };

  const pending = pendingRef.current;

  return (
    <div className="flex flex-col items-center py-4">
      {/* Sync toggle */}
      <button
        onClick={toggleSync}
        className="mb-4 flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors"
        style={{
          color: synced ? '#22c55e' : '#f59e0b',
          borderColor: synced ? '#22c55e55' : '#f59e0b55',
          backgroundColor: synced ? '#22c55e14' : '#f59e0b14',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={synced ? 'on' : 'off'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            {synced ? (
              <>
                <Cloud size={13} /> Synced
              </>
            ) : (
              <>
                <CloudOff size={13} /> Offline — saving locally{pending > 0 ? ` (+${pending}s)` : ''}
              </>
            )}
          </motion.span>
        </AnimatePresence>
      </button>

      <TimerRing
        progress={(elapsed % 60) / 60}
        color="var(--accent-primary)"
        label={formatMMSS(elapsed)}
        sublabel={running ? 'Session running' : 'Paused'}
      />

      <div className="flex items-center gap-3 mt-5">
        <CtrlBtn onClick={() => { setRunning(false); setElapsed(0); }} label="Reset">
          <RotateCcw size={16} />
        </CtrlBtn>
        <CtrlBtn
          primary
          color="var(--accent-primary)"
          onClick={() => setRunning((r) => !r)}
          label={running ? 'Pause' : 'Start'}
        >
          {running ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </CtrlBtn>
        <CtrlBtn
          onClick={() => setElapsed((s) => s + 300)}
          label="Plus 5 minutes"
        >
          <Plus size={16} />
        </CtrlBtn>
      </div>

      <p className="mt-4 text-xs text-[var(--text-secondary)] text-center max-w-[240px]">
        {synced
          ? 'Sessions sync to the cloud automatically'
          : 'No internet? The timer keeps running — it syncs when you reconnect'}
      </p>
    </div>
  );
};
