import { memo, useEffect, useState } from "react";
import { useSelector } from "react-redux";

import Countdown from "./Countdown";
import GlobalTimerControls from "@/components/GlobalTimerControls";
import NoiseGenerator from "@/pages/session/NoiseGenerator";
import Pomodoro from "@/pages/session/Pomodoro";
import SessionStatsAndTasks from "@/components/SessionStatsAndTasks";
import StudyTimer from "@/pages/session/StudyTimer";
import TimerSettings from "@/components/TimerSettings";

const SessionPage = memo(() => {
  const isSynced = useSelector((state) => state.ui.isSynced);
  const isRunning = useSelector((state) => state.ui.isRunning);
  const resetKey = useSelector((state) => state.ui.resetKey);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --------------------------
  // Sincronización global de timers
  // --------------------------
  useEffect(() => {
    if (!isSynced) return;

    const timestamp = Date.now();

    // Emitir estado global de timers
    window.dispatchEvent(
      new CustomEvent("globalTimerSync", {
        detail: { isRunning, resetKey, timestamp },
      })
    );

    // Emitir reset global si resetKey cambia
    if (resetKey > 0) {
      console.warn("[SessionPage] Emitiendo globalResetSync:", {
        resetKey,
        timestamp,
      });
      window.dispatchEvent(
        new CustomEvent("globalResetSync", { detail: { resetKey, timestamp } })
      );

      // Reset específico de Countdown
      window.dispatchEvent(
        new CustomEvent("resetCountdownSync", {
          detail: { baseTimestamp: timestamp },
        })
      );
    }
  }, [isSynced, isRunning, resetKey]);

  return (
    <div className="w-full px-3 sm:px-4 md:px-3 lg:px-16 xl:px-16 session-page">
      <div className="w-full px-2 overflow-hidden pb-4">
        {/* Controles globales (solo visibles cuando está sincronizado) */}
        <div className="px-1 mb-4">
          <GlobalTimerControls />
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full">
          {/* Columna derecha: timers */}
          <div className="w-full md:w-1/2 md:order-2 space-y-4 order-1">
            <div className="maincard p-4 sm:p-5 w-full space-y-5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] shadow-none">
              <StudyTimer
                isSynced={isSynced}
                isRunning={isRunning}
                resetKey={resetKey}
              />
            </div>

            <div className="flex flex-col gap-4 w-full">
              <div className="maincard p-4 sm:p-5 w-full space-y-5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] shadow-none mb-0">
                <Pomodoro
                  isSynced={isSynced}
                  isRunning={isRunning}
                  resetKey={resetKey}
                />
              </div>
              <div className="maincard p-4 sm:p-5 w-full space-y-5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] shadow-none mb-0">
                <Countdown
                  isSynced={isSynced}
                  isRunning={isRunning}
                  resetKey={resetKey}
                />
              </div>
            </div>
          </div>

          {/* Columna izquierda: stats y noise */}
          <div className="w-full md:w-1/2 md:order-1 order-2 space-y-4">
            <SessionStatsAndTasks />
            <div className="maincard p-4 sm:p-5 w-full space-y-5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] shadow-none">
              <NoiseGenerator />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de configuración */}
      <TimerSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
});

SessionPage.displayName = "SessionPage";

export default SessionPage;
