import { Pause, Play, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getElapsedSeconds,
  isExtraTimerSynced,
  readStudyTimerSnapshot,
  readSyncedTimerSeconds,
  requestToggleStudyTimer,
  type ExtraTimerId,
} from "@/utils/studyTimerRemote";
import { formatHMS } from "@/utils/timeUtils";

interface MiniTimerPlayerProps {
  /** Go back to the session page (e.g. when there is no session to resume). */
  onExpand: () => void;
  /** Only rendered for the in-app overlay variant. */
  onClose?: () => void;
}

interface ExtraRow {
  id: ExtraTimerId;
  label: string;
  color: string;
  seconds: number | null;
  running: boolean;
}

const EXTRA_CONFIG: Record<ExtraTimerId, { labelKey: string; color: string }> = {
  pomodoro: { labelKey: "session.unifiedTimer.pomodoroLabel", color: "#ef4444" },
  countdown: { labelKey: "session.unifiedTimer.countdownLabel", color: "#22c55e" },
};

const STUDY_COLOR = "#0A84FF";

const MiniTimerPlayer = ({ onExpand, onClose }: MiniTimerPlayerProps) => {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [extras, setExtras] = useState<ExtraRow[]>([]);

  // Poll the persisted timer state — the source of truth works with or
  // without the timer components mounted, and stays correct across navigation.
  useEffect(() => {
    const tick = () => {
      const s = readStudyTimerSnapshot();
      const studyRunning = s.isRunning && s.sessionStatus === "active";
      // Floor to display seconds — synced extras derive from the same value so
      // every row flips on the exact same second boundary.
      const studySeconds = Math.floor(getElapsedSeconds(s));
      setElapsed(studySeconds);
      setIsRunning(studyRunning);
      setHasSession(s.sessionStatus !== "inactive");
      setExtras(
        (Object.keys(EXTRA_CONFIG) as ExtraTimerId[])
          .filter(id => isExtraTimerSynced(id))
          .map(id => ({
            id,
            label: t(EXTRA_CONFIG[id].labelKey),
            color: EXTRA_CONFIG[id].color,
            seconds: readSyncedTimerSeconds(id, studySeconds),
            running: studyRunning,
          }))
      );
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
    <div className="flex flex-col gap-2 w-full h-full min-h-0 p-1.5 text-[var(--text-primary)] select-none">
      {/* Synced timers — one rectangular card each, title on top, timer below */}
      {extras.map(row => (
        <div
          key={row.id}
          className="flex items-center justify-between gap-2 flex-1 min-h-[3.5rem] rounded-xl border border-[var(--border-primary)]/40 bg-[var(--bg-secondary)]/30 px-3 py-1.5"
        >
          <div className="flex flex-col min-w-0">
            <span
              className="text-[9px] font-medium uppercase tracking-[0.2em] leading-tight truncate"
              style={{ color: row.color }}
            >
              {row.label}
            </span>
            <span
              className={`font-timer-digits text-[clamp(1rem,7.5vw,1.5rem)] font-semibold leading-tight tracking-[0.06em] ${
                row.running ? "" : "mini-timer-paused"
              }`}
              style={{ color: row.color }}
              aria-live="off"
            >
              {formatHMS(row.seconds ?? 0)}
            </span>
          </div>
        </div>
      ))}

      {/* Study timer card — same size as the others, the only one with play/pause */}
      <div className="flex items-center justify-between gap-2 flex-1 min-h-[3.5rem] rounded-xl border border-[var(--border-primary)]/40 bg-[var(--bg-secondary)]/30 px-3 py-1.5">
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] font-medium uppercase tracking-[0.2em] leading-tight text-[var(--text-secondary)] truncate">
            {t("session.miniPlayer.timer")} <span className={statusClass}>({t(statusKey)})</span>
          </span>
          {hasSession ? (
            <span
              className={`font-timer-digits text-[clamp(1rem,7.5vw,1.5rem)] font-semibold leading-tight tracking-[0.06em] ${
                isRunning ? "" : "mini-timer-paused"
              }`}
              style={{ color: STUDY_COLOR }}
              aria-live="off"
            >
              {formatHMS(elapsed)}
            </span>
          ) : (
            <span className="text-sm font-medium leading-tight text-[var(--text-secondary)]">
              {t("session.miniPlayer.noSessionHint")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={handleToggle}
            className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center border-2 border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
            aria-label={isRunning ? t("session.studyTimer.pauseTimer") : t("session.studyTimer.resumeTimer")}
            title={isRunning ? t("session.studyTimer.pauseTimer") : t("session.studyTimer.resumeTimer")}
          >
            {isRunning ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
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
    </div>
  );
};

export default MiniTimerPlayer;
