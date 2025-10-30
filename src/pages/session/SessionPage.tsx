import { memo, useEffect, useState } from "react";

import Countdown from "./Countdown";
import GlobalTimerControls from "@/components/GlobalTimerControls";
import NoiseGenerator from "@/pages/session/NoiseGenerator";
import Pomodoro from "@/pages/session/Pomodoro";
import StudyTimer from "@/pages/session/StudyTimer";
import TimerSettings from "@/components/TimerSettings";
import TodaysSession from "@/components/TodaysSession";
import { useSelector } from "react-redux";

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
    <div className="w-full px-2 sm:px-4 md:px-3 lg:px-6 xl:px-24 session-page">
      <div className="w-full px-2 overflow-hidden pb-4">
        {/* Controles globales */}
        <div className="px-1 mb-4">
          <GlobalTimerControls />
        </div>

        {/* Fila superior: Tres timers en columnas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-4">
          {/* Study Timer */}
          <div className="maincard p-4 sm:p-5 w-full space-y-5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] shadow-none">
            <StudyTimer
              isSynced={isSynced}
              isRunning={isRunning}
              resetKey={resetKey}
            />
          </div>

          {/* Pomodoro */}
          <div className="maincard p-4 sm:p-5 w-full space-y-5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] shadow-none">
            <Pomodoro
              isSynced={isSynced}
              isRunning={isRunning}
              resetKey={resetKey}
            />
          </div>

          {/* Countdown */}
          <div className="maincard p-4 sm:p-5 w-full space-y-5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] shadow-none">
            <Countdown
              isSynced={isSynced}
              isRunning={isRunning}
              resetKey={resetKey}
            />
          </div>
        </div>

        {/* Fila inferior: Stats y Noise Generator */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* Stats */}
          <div className="maincard p-3 sm:p-4 md:p-5 w-full min-h-[400px] md:min-h-[450px] lg:min-h-[500px] space-y-4 md:space-y-5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] shadow-sm">
            <div className="h-full">
              <TodaysSession />
            </div>
          </div>
          
          {/* Noise Generator */}
          <div className="maincard p-3 sm:p-4 md:p-5 w-full min-h-[400px] md:min-h-[450px] lg:min-h-[500px] space-y-4 md:space-y-5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] shadow-sm">
            <NoiseGenerator />
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
