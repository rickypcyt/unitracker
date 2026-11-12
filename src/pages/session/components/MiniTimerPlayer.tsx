import { Pause, PictureInPicture2, Play, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  EXTRA_TIMER_TOGGLE_EVENT,
  getElapsedSeconds,
  isExtraTimerRunning,
  isExtraTimerSynced,
  readExtraTimerSeconds,
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
  synced: boolean;
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
        (Object.keys(EXTRA_CONFIG) as ExtraTimerId[]).map(id => {
          const synced = isExtraTimerSynced(id);
          return {
            id,
            label: t(EXTRA_CONFIG[id].labelKey),
            color: EXTRA_CONFIG[id].color,
            seconds: synced ? readSyncedTimerSeconds(id, studySeconds) : readExtraTimerSeconds(id),
            synced,
            running: synced ? studyRunning : isExtraTimerRunning(id),
          };
        })
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

  const openExtraPopup = (id: ExtraTimerId) => {
    window.dispatchEvent(new CustomEvent(EXTRA_TIMER_TOGGLE_EVENT, { detail: { id } }));
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
    <div className="flex flex-col w-full h-full px-4 py-2.5 rounded-2xl border border-[var(--border-primary)]/50 bg-[var(--bg-primary)]/90 backdrop-blur-md text-[var(--text-primary)] shadow-xl select-none">
      {/* Extra timers — synced ones show their time; unsynced get a float button */}
      {extras.map(row => (
        <div key={row.id} className="flex items-center gap-2.5">
          <span
            className="text-[9px] font-medium uppercase tracking-[0.2em] w-16 shrink-0 truncate"
            style={{ color: row.color }}
          >
            {row.label}
          </span>
          <span
            className={`font-mono text-sm font-semibold tabular-nums leading-none tracking-[0.06em] ${
              row.running ? "" : "opacity-50"
            }`}
            style={{ color: row.color }}
            aria-live="off"
          >
            {formatHMS(row.seconds ?? 0)}
          </span>
          {!row.synced && (
            <button
              onClick={() => openExtraPopup(row.id)}
              className="ml-auto w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[var(--text-secondary)]/70 hover:text-[var(--text-primary)] transition-colors"
              aria-label={t("session.miniPlayer.floatTimer", { timer: row.label })}
              title={t("session.miniPlayer.floatTimer", { timer: row.label })}
            >
              <PictureInPicture2 size={12} />
            </button>
          )}
        </div>
      ))}

      {/* Study timer — bottom row, the only one with play/pause */}
      <div className="flex items-end mt-auto pt-1.5">
        <div className="flex flex-col min-w-0">
          <span
            className={`font-mono text-[1.35rem] font-semibold tabular-nums leading-none tracking-[0.08em] ${
              isRunning ? "" : "opacity-60"
            }`}
            style={{ color: STUDY_COLOR }}
            aria-live="off"
          >
            {formatHMS(elapsed)}
          </span>
          <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.25em] text-[var(--text-secondary)]">
            {t("session.miniPlayer.timer")}{" "}
            <span className={statusClass}>({t(statusKey)})</span>
          </span>
        </div>
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
    </div>
  );
};

export default MiniTimerPlayer;
