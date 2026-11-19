import Countdown from "@/pages/session/Countdown";
import Pomodoro from "@/pages/session/Pomodoro";
import StudyTimer from "@/pages/session/StudyTimer";

const card =
  "timer-card relative min-w-0 2xl:aspect-square flex flex-col rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-3 sm:p-4";

/**
 * Classic layout: study timer, pomodoro and countdown as three independent cards.
 * Each timer renders its own header (sync toggle, settings, alarm) and controls.
 */
const TimerCards = ({
  isSynced,
  isRunning,
  className = "",
}: {
  isSynced?: boolean;
  isRunning?: boolean;
  /** Extra classes for the grid wrapper (e.g. `2xl:contents` to place the cards in a parent grid) */
  className?: string;
}) => {
  const syncProps = isSynced !== undefined ? { isSynced } : {};

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 w-full xl:h-full 2xl:h-auto 2xl:items-start ${className}`}>
      <div className={card}>
        <Pomodoro />
      </div>

      <div className={card}>
        <StudyTimer {...syncProps} showMiniPlayerButton />
      </div>

      <div className={card}>
        <Countdown {...syncProps} {...(isRunning !== undefined ? { isRunning } : {})} />
      </div>
    </div>
  );
};

export default TimerCards;
