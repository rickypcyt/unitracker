import { Check, Flag, Pause, Play, RotateCcw, X } from 'lucide-react';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import SectionTitle from '@/components/ui/SectionTitle';
import useEventListener from '@/hooks/common/useEventListener';
import { SYNC_EVENTS, useEmitSyncEvents } from '@/hooks/session/useStudySync';
import { useAppStore } from '@/store/appStore';

/**
 * Self-contained "example session" for the landing page. It looks and behaves like the study
 * timer (start a session, pause, add notes, adjust minutes, finish) but lives only in memory:
 * nothing is saved, synced or written to the real timer state.
 */

const ADJUSTMENTS = [-10, -5, 5, 10] as const;
const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const pad = (n: number) => String(n).padStart(2, '0');
const hms = (total: number) => {
  const s = Math.max(0, Math.floor(total));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

type Phase = 'idle' | 'setup' | 'active' | 'finished';

const ASSIGNMENT_SUGGESTIONS = ['Mathematics', 'Programming', 'History'];

const DemoStudyTimer: FC = () => {
  const { t } = useTranslation();
  const { setStudyRunning, setStudyTimerState, syncSettings } = useAppStore();
  const { emitSyncEvent } = useEmitSyncEvents();
  const isPomodoroSync = syncSettings.syncPomodoroWithTimer;
  const isCountdownSync = syncSettings.syncCountdownWithTimer;
  const [phase, setPhase] = useState<Phase>('idle');
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [notes, setNotes] = useState<{ at: number; text: string }[]>([]);
  const [summary, setSummary] = useState<{ duration: string; notes: number } | null>(null);
  // Optional details picked in the "new session" menu
  const [sessionName, setSessionName] = useState('');
  const [sessionAssignment, setSessionAssignment] = useState('');
  // Elapsed time is derived from timestamps so it stays exact even if the tab throttles timers
  const baseRef = useRef(0);
  const startedAtRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSeconds(baseRef.current + (Date.now() - startedAtRef.current) / 1000);
    }, 250);
    return () => window.clearInterval(id);
  }, [running]);

  // Tell the real Pomodoro / Countdown (when linked) what the study timer just did
  const broadcast = useCallback(
    (kind: 'PLAY' | 'PAUSE' | 'RESET') => {
      const ts = Date.now();
      if (isPomodoroSync) emitSyncEvent(SYNC_EVENTS[`${kind}_POMODORO`], ts);
      if (isCountdownSync) emitSyncEvent(SYNC_EVENTS[`${kind}_COUNTDOWN`], ts);
    },
    [emitSyncEvent, isPomodoroSync, isCountdownSync],
  );

  const setRunningState = useCallback(
    (value: boolean, status: 'running' | 'paused' | 'stopped') => {
      setRunning(value);
      setStudyRunning(value);
      setStudyTimerState(status);
      window.dispatchEvent(new CustomEvent(SYNC_EVENTS.STUDY_TIMER_STATE_CHANGED, { detail: { isRunning: value } }));
    },
    [setStudyRunning, setStudyTimerState],
  );

  // Keep linked timers in step: they follow this value while synced
  useEffect(() => {
    if (!isPomodoroSync && !isCountdownSync) return;
    window.dispatchEvent(
      new CustomEvent(SYNC_EVENTS.STUDY_TIMER_TIME_UPDATE, { detail: { time: Math.floor(seconds), isRunning: running } }),
    );
  }, [isPomodoroSync, isCountdownSync, Math.floor(seconds), running]);

  // Leaving the page must not leave the global "study running" flag on
  useEffect(
    () => () => {
      setStudyRunning(false);
      setStudyTimerState('stopped');
    },
    [setStudyRunning, setStudyTimerState],
  );

  const resume = useCallback(() => {
    startedAtRef.current = Date.now();
    baseRef.current = seconds;
    setRunningState(true, 'running');
    broadcast('PLAY');
  }, [seconds, setRunningState, broadcast]);

  const pause = useCallback(() => {
    baseRef.current = seconds;
    setRunningState(false, 'paused');
    broadcast('PAUSE');
  }, [seconds, setRunningState, broadcast]);

  const startSession = () => {
    baseRef.current = 0;
    startedAtRef.current = Date.now();
    setSeconds(0);
    setNotes([]);
    setSummary(null);
    setPhase('active');
    setRunningState(true, 'running');
    broadcast('PLAY');
  };

  const adjust = (minutes: number) => {
    const next = Math.max(0, seconds + minutes * 60);
    baseRef.current = next;
    startedAtRef.current = Date.now();
    setSeconds(next);
    const adjustment = minutes * 60;
    if (isPomodoroSync) window.dispatchEvent(new CustomEvent(SYNC_EVENTS.ADJUST_POMODORO_TIME, { detail: { adjustment } }));
    if (isCountdownSync) window.dispatchEvent(new CustomEvent(SYNC_EVENTS.ADJUST_COUNTDOWN_TIME, { detail: { adjustment } }));
  };

  const addNote = () => {
    const sampleNotes = ['Read chapter 3', 'Solved exercise set', 'Reviewed my notes', 'Questions for class'];
    setNotes((prev) => [...prev, { at: Math.floor(seconds), text: sampleNotes[prev.length % sampleNotes.length]! }]);
  };

  // Back to 00:00:00 but keep the example session open
  const resetTimer = useCallback(
    (fromSync = false) => {
      baseRef.current = 0;
      startedAtRef.current = Date.now();
      setSeconds(0);
      setNotes([]);
      setRunningState(false, 'stopped');
      if (!fromSync) broadcast('RESET');
    },
    [setRunningState, broadcast],
  );

  // A linked timer (Pomodoro / Countdown) was reset: follow it
  useEventListener(SYNC_EVENTS.RESET_TIMER, () => resetTimer(true), [resetTimer]);

  const finish = () => {
    setSummary({ duration: hms(seconds), notes: notes.length });
    setRunningState(false, 'stopped');
    broadcast('PAUSE');
    setPhase('finished');
  };

  const cancel = () => {
    setRunningState(false, 'stopped');
    setSeconds(0);
    setNotes([]);
    setSessionName('');
    setSessionAssignment('');
    setPhase('idle');
    broadcast('RESET');
  };

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const paused = phase === 'active' && !running;
  const progress = (seconds % 3600) / 3600;
  const digit = `text-lg font-mono font-bold tabular-nums leading-none ${running ? 'text-accent-primary' : 'text-(--text-primary)'}`;
  const colon = `text-base font-mono font-bold leading-none ${running ? 'text-accent-primary' : 'text-(--text-secondary)'}`;

  return (
    <div className="flex h-full w-full flex-col">
      <div className="section-title relative w-full justify-center px-4 py-3">
        <SectionTitle
          title={t('session.studyTimer.title')}
          tooltip="Tracks the time of your study session. Start a session, add notes and finish it to see your stats."
          size="sm"
        />
      </div>

      {phase === 'setup' ? (
        <form
          className="flex flex-1 flex-col justify-center gap-3 px-4 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            startSession();
          }}
        >
          <label className="block">
            <span className="mb-1 flex items-center justify-between text-xs font-semibold text-(--text-primary)">
              {t('landing.demoSession.nameLabel', { defaultValue: 'Session name' })}
              <span className="font-normal text-(--text-secondary)">{t('landing.demoSession.optional', { defaultValue: 'optional' })}</span>
            </span>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              maxLength={60}
              autoFocus
              placeholder={t('landing.demoSession.name', { defaultValue: 'Example session' })}
              className="w-full rounded-lg border-2 border-(--border-primary) bg-transparent px-3 py-2 text-sm text-(--text-primary) placeholder:text-(--text-secondary)/60 focus:border-(--accent-primary) focus:outline-none"
            />
          </label>
          <div>
            <label className="block">
              <span className="mb-1 flex items-center justify-between text-xs font-semibold text-(--text-primary)">
                {t('landing.demoSession.assignmentLabel', { defaultValue: 'Assignment' })}
                <span className="font-normal text-(--text-secondary)">{t('landing.demoSession.optional', { defaultValue: 'optional' })}</span>
              </span>
              <input
                type="text"
                value={sessionAssignment}
                onChange={(e) => setSessionAssignment(e.target.value)}
                maxLength={40}
                placeholder="Mathematics"
                className="w-full rounded-lg border-2 border-(--border-primary) bg-transparent px-3 py-2 text-sm text-(--text-primary) placeholder:text-(--text-secondary)/60 focus:border-(--accent-primary) focus:outline-none"
              />
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ASSIGNMENT_SUGGESTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setSessionAssignment(a)}
                  aria-pressed={sessionAssignment === a}
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    sessionAssignment === a
                      ? 'border-(--accent-primary) text-(--accent-primary)'
                      : 'border-(--border-primary) text-(--text-secondary) hover:text-(--text-primary)'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={() => setPhase('idle')}
              className="flex-1 rounded-lg border-2 border-(--border-primary) px-3 py-2 text-xs font-semibold text-(--text-primary) transition-colors hover:bg-(--bg-secondary)"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-(--accent-primary) px-3 py-2 text-xs font-semibold text-(--accent-primary) transition-colors hover:bg-(--accent-primary)/10"
            >
              <Play size={14} />
              {t('landing.demoSession.start', { defaultValue: 'Start' })}
            </button>
          </div>
        </form>
      ) : phase === 'finished' && summary ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-6 text-center">
          <Check size={28} className="text-emerald-400" />
          <p className="text-base font-semibold text-(--text-primary)">
            {sessionName.trim() || t('landing.demoSession.done', { defaultValue: 'Example session complete' })}
          </p>
          {sessionAssignment.trim() && (
            <span className="rounded-full bg-(--accent-primary)/10 px-2 py-0.5 text-[11px] font-medium text-(--accent-primary)">
              {sessionAssignment.trim()}
            </span>
          )}
          <p className="font-mono text-2xl font-bold tabular-nums text-(--accent-primary)">{summary.duration}</p>
          <p className="max-w-[16rem] text-xs text-(--text-secondary)">
            {t('landing.demoSession.signup', { defaultValue: 'Sign up to save your real sessions and see your stats.' })}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              to="/login"
              className="rounded-lg border-2 border-(--accent-primary) px-4 py-1.5 text-xs font-semibold text-(--accent-primary) transition-colors hover:bg-(--accent-primary)/10"
            >
              {t('landing.demoSession.cta', { defaultValue: 'Sign up free' })}
            </Link>
            <button
              type="button"
              onClick={cancel}
              className="rounded-lg border-2 border-(--border-primary) px-4 py-1.5 text-xs font-semibold text-(--text-primary) transition-colors hover:bg-(--bg-secondary)"
            >
              {t('landing.demoSession.again', { defaultValue: 'Try again' })}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className="flex w-full flex-1 flex-col items-center justify-center py-2"
            role="timer"
            aria-label={t('session.studyTimer.timerAria')}
            title={
              phase === 'active'
                ? [sessionName.trim() || t('landing.demoSession.name', { defaultValue: 'Example session' }), sessionAssignment.trim()]
                    .filter(Boolean)
                    .join(' · ')
                : undefined
            }
          >
            <div className="timer-ring relative h-32 w-32">
              {phase === 'active' && (
                <>
                  <div className="study-side-left absolute right-full top-[68%] mr-6 flex -translate-y-1/2 gap-2">
                    <button
                      type="button"
                      onClick={addNote}
                      className="timer-ctrl-btn"
                      aria-label={t('session.studyTimer.addLapNote')}
                    >
                      <Flag size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => resetTimer()}
                      className="timer-ctrl-btn"
                      aria-label="Reset timer"
                      title="Reset"
                    >
                      <RotateCcw size={18} />
                    </button>
                  </div>
                  <div className="study-side-right absolute left-full top-[68%] ml-3 flex -translate-y-1/2 gap-2">
                    <button
                      type="button"
                      onClick={finish}
                      className="timer-ctrl-btn"
                      aria-label={t('session.studyTimer.finishSession')}
                    >
                      <Check size={18} className="text-emerald-400" />
                    </button>
                    <button
                      type="button"
                      onClick={cancel}
                      className="timer-ctrl-btn"
                      aria-label={t('session.studyTimer.cancelSession')}
                    >
                      <X size={18} className="text-red-400" />
                    </button>
                  </div>
                </>
              )}
              <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--border-primary)" strokeWidth="5" opacity="0.5" />
                <circle
                  cx="60"
                  cy="60"
                  r={RADIUS}
                  fill="none"
                  stroke="#0A84FF"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={paused ? CIRCUMFERENCE * 0.25 : CIRCUMFERENCE}
                  strokeDashoffset={paused ? CIRCUMFERENCE * 0.5 : CIRCUMFERENCE * (1 - progress)}
                  className={`transition-all duration-300 ${paused ? 'origin-center animate-spin' : ''}`}
                  style={{ transformOrigin: '60px 60px', animationDuration: paused ? '2s' : '' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex items-center gap-0.5">
                  <span className={digit}>{pad(h)}</span>
                  <span className={colon}>:</span>
                  <span className={digit}>{pad(m)}</span>
                  <span className={colon}>:</span>
                  <span className={digit}>{pad(s)}</span>
                </div>
              </div>
            </div>
          </div>

          {notes.length > 0 && (
            <ul className="mx-3 mb-2 max-h-16 space-y-0.5 overflow-y-auto text-xs text-(--text-secondary)">
              {notes.map((n, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="truncate">{n.text}</span>
                  <span className="shrink-0 font-mono tabular-nums">{hms(n.at)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mb-3 mt-auto flex h-16 shrink-0 flex-nowrap items-center justify-center gap-x-2 pb-2 pt-2">
            <div className="flex shrink-0 gap-1">
              {phase === 'active' &&
                ADJUSTMENTS.filter((a) => a < 0).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => adjust(a)}
                    className="timer-adjust-btn"
                    aria-label={t('session.studyTimer.subtractMinutes', { count: Math.abs(a) })}
                  >
                    {a}
                  </button>
                ))}
            </div>

            {phase === 'idle' ? (
              <button
                type="button"
                onClick={() => setPhase('setup')}
                className="mx-1 shrink-0 whitespace-nowrap rounded-lg border-2 border-(--accent-primary) px-4 py-1.5 text-xs font-semibold text-(--accent-primary) transition-colors hover:bg-(--accent-primary)/10"
              >
                {t('session.studyTimer.startNewSession')}
              </button>
            ) : running ? (
              <button
                type="button"
                onClick={pause}
                className="timer-ctrl-btn timer-ctrl-btn-primary mx-1 shrink-0"
                aria-label={t('session.studyTimer.pauseTimer')}
              >
                <Pause size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={resume}
                className="timer-ctrl-btn timer-ctrl-btn-primary mx-1 shrink-0"
                aria-label={t('session.studyTimer.resumeTimer')}
              >
                <Play size={18} />
              </button>
            )}

            <div className="flex shrink-0 gap-1">
              {phase === 'active' &&
                ADJUSTMENTS.filter((a) => a > 0).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => adjust(a)}
                    className="timer-adjust-btn"
                    aria-label={t('session.studyTimer.addMinutes', { count: a })}
                  >
                    +{a}
                  </button>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DemoStudyTimer;
