import { Timer as TimerIcon, Watch } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Countdown from "@/pages/session/Countdown";
import Pomodoro from "@/pages/session/Pomodoro";
import StudyTimer from "@/pages/session/StudyTimer";
import DemoStudyTimer from "@/pages/landing/DemoStudyTimer";

const card =
  "timer-card relative min-w-0 flex flex-col rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-3 sm:p-4 2xl:aspect-square";

const TOGGLES_KEY = "mobileTimerToggles";

const useIsMobile = () => {
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return mobile;
};

type Props = {
  isSynced?: boolean;
  isRunning?: boolean;
  /** Extra classes for the grid wrapper (e.g. `2xl:contents` to place the cards in a parent grid) */
  className?: string;
  /** Demo mode (landing page): pomodoro ignores saved state and the study timer is an in-memory example session */
  fresh?: boolean;
};

/** Pill that switches an optional timer on/off */
const ToggleChip = ({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof TimerIcon;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
      active
        ? "border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--accent-primary)]/10"
        : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
    }`}
  >
    <Icon size={14} />
    {label}
  </button>
);

/**
 * Mobile: one compact card. The study timer is the main view; Pomodoro and Countdown can be
 * switched on from the pills above it and then appear as small tiles underneath.
 */
const MobileTimer = ({ isSynced, isRunning, fresh }: Omit<Props, "className">) => {
  const { t } = useTranslation();
  const syncProps = isSynced !== undefined ? { isSynced } : {};
  const [show, setShow] = useState<{ pomodoro: boolean; countdown: boolean }>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(TOGGLES_KEY) ?? "null");
      return { pomodoro: !!saved?.pomodoro, countdown: !!saved?.countdown };
    } catch {
      return { pomodoro: false, countdown: false };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(TOGGLES_KEY, JSON.stringify(show));
    } catch {
      /* storage unavailable */
    }
  }, [show]);

  const extra = Number(show.pomodoro) + Number(show.countdown);
  const tile = "timer-card min-w-0 flex flex-col rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-2";
  const tileLabel = "mb-1 text-center text-xs font-semibold text-[var(--text-secondary)]";
  const pomoLabel = t("session.unifiedTimer.pomodoroLabel", { defaultValue: "Pomodoro" });
  const countdownLabel = t("session.unifiedTimer.countdownLabel", { defaultValue: "Countdown" });

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-center gap-2" role="group" aria-label="Timers">
        <ToggleChip
          active={show.pomodoro}
          onClick={() => setShow((s) => ({ ...s, pomodoro: !s.pomodoro }))}
          icon={TimerIcon}
          label={pomoLabel}
        />
        <ToggleChip
          active={show.countdown}
          onClick={() => setShow((s) => ({ ...s, countdown: !s.countdown }))}
          icon={Watch}
          label={countdownLabel}
        />
      </div>

      <div className={`${card} 2xl:aspect-auto`}>
        {fresh ? <DemoStudyTimer /> : <StudyTimer {...syncProps} showMiniPlayerButton />}
      </div>

      {extra > 0 && (
        <div className={`grid gap-2 ${extra === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {show.pomodoro && (
            <div className={tile}>
              <div className={tileLabel}>{pomoLabel}</div>
              <Pomodoro hideHeader fresh={fresh ?? false} />
            </div>
          )}
          {show.countdown && (
            <div className={tile}>
              <div className={tileLabel}>{countdownLabel}</div>
              <Countdown hideHeader {...syncProps} {...(isRunning !== undefined ? { isRunning } : {})} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Pomodoro, study timer and countdown as three independent cards (md+).
 * On mobile it renders the compact single-card version instead.
 */
const TimerCards = ({ isSynced, isRunning, className = "", fresh = false }: Props) => {
  const mobile = useIsMobile();
  const syncProps = isSynced !== undefined ? { isSynced } : {};

  // Only one set of timers is mounted at a time (two StudyTimers would fight over the same state)
  if (mobile) return <MobileTimer isSynced={isSynced} isRunning={isRunning} fresh={fresh} />;

  return (
    <div className={`grid md:grid-cols-3 gap-4 w-full 2xl:h-auto 2xl:items-start ${className}`}>
      <div className={card}>
        <Pomodoro fresh={fresh} />
      </div>

      <div className={card}>
        {fresh ? <DemoStudyTimer /> : <StudyTimer {...syncProps} showMiniPlayerButton />}
      </div>

      <div className={card}>
        <Countdown {...syncProps} {...(isRunning !== undefined ? { isRunning } : {})} />
      </div>
    </div>
  );
};

export default TimerCards;
