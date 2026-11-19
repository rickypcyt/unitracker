import { PictureInPicture } from "lucide-react";
import { useTranslation } from "react-i18next";

import Countdown from "@/pages/session/Countdown";
import Pomodoro from "@/pages/session/Pomodoro";
import StudyTimer from "@/pages/session/StudyTimer";
import { MINI_PLAYER_OPEN_EVENT } from "@/utils/studyTimerRemote";

const card =
  "relative min-w-0 flex flex-col rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-3 sm:p-4";

/**
 * Classic layout: study timer, pomodoro and countdown as three independent cards.
 * Each timer renders its own header (sync toggle, settings, alarm) and controls.
 */
const TimerCards = ({ isSynced, isRunning }: { isSynced?: boolean; isRunning?: boolean }) => {
  const { t } = useTranslation();
  const syncProps = isSynced !== undefined ? { isSynced } : {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      <div className={card}>
        <Pomodoro />
      </div>

      <div className={card}>
        <StudyTimer {...syncProps} />
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent(MINI_PLAYER_OPEN_EVENT))}
          className="absolute bottom-3 right-3 p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          aria-label={t("session.miniPlayer.openAria")}
          title={t("session.miniPlayer.openTitle")}
        >
          <PictureInPicture size={18} />
        </button>
      </div>

      <div className={card}>
        <Countdown {...syncProps} {...(isRunning !== undefined ? { isRunning } : {})} />
      </div>
    </div>
  );
};

export default TimerCards;
