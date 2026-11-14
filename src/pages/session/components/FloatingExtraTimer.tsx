import { Pause, Play, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

import {
  isExtraTimerRunning,
  readExtraTimerSeconds,
  requestToggleExtraTimer,
  type ExtraTimerId,
} from "@/utils/studyTimerRemote";
import { formatHMS } from "@/utils/timeUtils";

const CONFIG: Record<ExtraTimerId, { labelKey: string; color: string }> = {
  pomodoro: { labelKey: "session.unifiedTimer.pomodoroLabel", color: "#ef4444" },
  countdown: { labelKey: "session.unifiedTimer.countdownLabel", color: "#22c55e" },
};

interface FloatingExtraTimerProps {
  id: ExtraTimerId;
  /** Vertical stack offset so multiple overlays don't overlap. */
  stackIndex?: number;
  onClose: () => void;
}

/** Independent draggable overlay for a timer that is NOT synced to the study timer. */
const FloatingExtraTimer = ({ id, stackIndex = 0, onClose }: FloatingExtraTimerProps) => {
  const { t } = useTranslation();
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const { labelKey, color } = CONFIG[id];

  useEffect(() => {
    const tick = () => {
      setSeconds(readExtraTimerSeconds(id) ?? 0);
      setRunning(isExtraTimerRunning(id));
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [id]);

  return (
    <motion.div
      drag
      dragMomentum={false}
      className="fixed right-4 z-[100] w-[240px] cursor-grab active:cursor-grabbing"
      style={{ bottom: `${6 + stackIndex * 4.5}rem` }}
    >
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-[var(--border-primary)]/50 bg-[var(--bg-primary)]/90 backdrop-blur-md text-[var(--text-primary)] shadow-xl select-none">
        <div className="flex flex-col min-w-0">
          <span
            className={`font-timer-digits text-[1.1rem] font-semibold leading-none tracking-[0.06em] ${
              running ? "" : "opacity-60"
            }`}
            style={{ color }}
            aria-live="off"
          >
            {formatHMS(seconds)}
          </span>
          <span
            className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.22em] opacity-60"
            style={{ color }}
          >
            {t(labelKey)}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          <button
            onClick={() => requestToggleExtraTimer(id)}
            className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center border border-[var(--border-primary)]/60 text-[var(--text-primary)] transition-colors"
            style={{ color: running ? color : undefined }}
            aria-label={running ? t("session.studyTimer.pauseTimer") : t("session.studyTimer.resumeTimer")}
            title={running ? t("session.studyTimer.pauseTimer") : t("session.studyTimer.resumeTimer")}
          >
            {running ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[var(--text-secondary)]/70 hover:text-[var(--text-primary)] transition-colors"
            aria-label={t("session.miniPlayer.close")}
            title={t("session.miniPlayer.close")}
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default FloatingExtraTimer;
