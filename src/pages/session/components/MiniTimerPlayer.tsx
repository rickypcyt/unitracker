import { Pause, Play, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getElapsedSeconds,
  readStudyTimerSnapshot,
  readSyncedTimers,
  requestToggleStudyTimer,
} from "@/utils/studyTimerRemote";
import { formatHMS } from "@/utils/timeUtils";

interface MiniTimerPlayerProps {
  /** Go back to the session page (e.g. when there is no session to resume). */
  onExpand: () => void;
  /** Only rendered for the in-app overlay variant. */
  onClose?: () => void;
}

interface TimerChip {
  id: "study" | "pomodoro" | "countdown";
  label: string;
  color: string;
  seconds: number;
}

const MiniTimerPlayer = ({ onExpand, onClose }: MiniTimerPlayerProps) => {
  const { t } = useTranslation();
  const [timers, setTimers] = useState<TimerChip[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  // Poll the persisted timer state — the source of truth works with or
  // without the timer components mounted, and stays correct across navigation.
  useEffect(() => {
    const tick = () => {
      const s = readStudyTimerSnapshot();
      setIsRunning(s.isRunning && s.sessionStatus === "active");
      setHasSession(s.sessionStatus !== "inactive");

      const chips: TimerChip[] = [
        {
          id: "study",
          label: t("session.unifiedTimer.studyLabel"),
          color: "#0A84FF",
          seconds: getElapsedSeconds(s),
        },
        ...readSyncedTimers().map(r => ({
          id: r.id,
          label: t(
            r.id === "pomodoro"
              ? "session.unifiedTimer.pomodoroLabel"
              : "session.unifiedTimer.countdownLabel"
          ),
          color: r.id === "pomodoro" ? "#ef4444" : "#22c55e",
          seconds: r.seconds,
        })),
      ];
      setTimers(chips);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [t]);

  const handleToggle = () => {
    // No session to resume → send the user to pick one instead.
    if (requestToggleStudyTimer() === "none") onExpand();
  };

  const statusKey = isRunning
    ? "session.miniPlayer.statusPlaying"
    : hasSession
      ? "session.miniPlayer.statusPaused"
      : "session.miniPlayer.statusNoSession";
  const statusClass = isRunning
    ? "text-emerald-400"
    : hasSession
      ? "text-amber-400"
      : "text-[var(--text-secondary)]";

  return (
    <div className="flex items-center gap-3 w-full h-full px-4 py-2 rounded-2xl border border-[var(--border-primary)]/50 bg-[var(--bg-primary)]/90 backdrop-blur-md text-[var(--text-primary)] shadow-xl select-none">
      {/* Times — one chip per timer in sync, each in its own color */}
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <div className="flex items-end gap-4">
          {timers.map(timer => (
            <div key={timer.id} className="flex flex-col min-w-0">
              <span
                className={`font-mono text-[1.15rem] font-semibold tabular-nums leading-none tracking-[0.06em] ${
                  isRunning ? "" : "opacity-60"
                }`}
                style={{ color: timer.color }}
                aria-live="off"
              >
                {formatHMS(timer.seconds)}
              </span>
              <span
                className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.22em] opacity-60"
                style={{ color: timer.color }}
              >
                {timer.label}
              </span>
            </div>
          ))}
        </div>
        <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.25em] text-[var(--text-secondary)]">
          {t("session.miniPlayer.timer")}{" "}
          <span className={statusClass}>({t(statusKey)})</span>
        </span>
      </div>

      {/* Controls */}
      <div className="ml-auto flex items-center gap-0.5">
        <button
          onClick={handleToggle}
          className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center border border-[var(--border-primary)]/60 text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
          aria-label={isRunning ? t("session.studyTimer.pauseTimer") : t("session.studyTimer.resumeTimer")}
          title={isRunning ? t("session.studyTimer.pauseTimer") : t("session.studyTimer.resumeTimer")}
        >
          {isRunning ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </button>
        {onClose ? (
          <button
            onClick={onClose}
            className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[var(--text-secondary)]/70 hover:text-[var(--text-primary)] transition-colors"
            aria-label={t("session.miniPlayer.close")}
            title={t("session.miniPlayer.close")}
          >
            <X size={13} />
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default MiniTimerPlayer;
