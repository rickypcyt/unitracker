import { memo, useEffect } from "react";
import { useUi } from "@/store/appStore";

import { Helmet } from "react-helmet-async";
import NoiseGenerator from "@/pages/session/NoiseGenerator";
import ScratchPad from "@/pages/session/ScratchPad";
import UnifiedTimer from "@/pages/session/UnifiedTimer";

const SessionPage = memo(() => {
  const ui = useUi();
  const isSynced = ui.isSynced;
  const isRunning = ui.isRunning;
  const resetKey = ui.resetKey;



  // --------------------------
  // Sincronización global de timers
  // --------------------------
  useEffect(() => {
    if (!isSynced) return;

    const timestamp = Date.now();

    window.dispatchEvent(
      new CustomEvent("globalTimerSync", {
        detail: { isRunning, resetKey, timestamp },
      })
    );

    if (resetKey > 0) {
      console.warn("[SessionPage] Emitiendo globalResetSync:", {
        resetKey,
        timestamp,
      });
      window.dispatchEvent(
        new CustomEvent("globalResetSync", { detail: { resetKey, timestamp } })
      );

      window.dispatchEvent(
        new CustomEvent("resetCountdownSync", {
          detail: { baseTimestamp: timestamp },
        })
      );
    }
  }, [isSynced, isRunning, resetKey]);

  return (
    <>
      <Helmet>
        <title>Focus Timer & Session Tracking | UniTracker 2026</title>
        <meta
          name="description"
          content="Free Pomodoro timer and focus session tracker. Track your time across any area, manage breaks, and boost productivity. No ads, no subscriptions."
        />
        <meta
          name="keywords"
          content="pomodoro timer, focus timer, productivity timer, time tracker, focus sessions, break timer, time management, work tracker"
        />
        <meta property="og:title" content="Focus Timer & Session Tracking | UniTracker 2026" />
        <meta
          property="og:description"
          content="Free Pomodoro timer and focus session tracker. Track your time across any area, manage breaks, and boost productivity."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://unitracker.me/session" />
        <link rel="canonical" href="https://unitracker.me/session" />
      </Helmet>
      <div className="w-full session-page px-4 sm:px-6 py-4" style={{ fontSize: 'clamp(0.875rem, 0.85rem + 0.15vw, 1rem)' }}>
        <div className="w-full max-w-[73rem] mx-auto flex flex-col gap-4">
          {/* Top: Noise Generator + Scratchpad */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            <ScratchPad />
            <div className="dashboard-noise-card w-full">
              <NoiseGenerator />
            </div>
          </div>

          {/* Timers full width */}
          <div className="w-full" data-tour="session-timer">
            <UnifiedTimer isSynced={isSynced} isRunning={isRunning} />
          </div>
        </div>
      </div>
    </>
  );
});

SessionPage.displayName = "SessionPage";

export default SessionPage;
