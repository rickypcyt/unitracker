import { Trash2, X, Zap } from "lucide-react";
import { memo, useEffect } from "react";
import { useAppStore, useUi } from "@/store/appStore";

import { Helmet } from "react-helmet-async";
import NoiseGenerator from "@/pages/session/NoiseGenerator";
import UnifiedTimer from "@/pages/session/UnifiedTimer";
import { useNavigation } from "@/navbar/NavigationContext";

const SessionPage = memo(() => {
  const ui = useUi();
  const { navigateTo } = useNavigation();
  const isSynced = ui.isSynced;
  const isRunning = ui.isRunning;
  const resetKey = ui.resetKey;
  const activeSessionId = useAppStore(s => s.activeSessionId);



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

  const todayDate = new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });

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
      <div className="w-full min-h-screen flex flex-col session-page" style={{ fontSize: 'clamp(0.875rem, 0.85rem + 0.15vw, 1rem)', paddingLeft: 'clamp(0.5rem, 0.3rem + 1vw, 2rem)', paddingRight: 'clamp(0.5rem, 0.3rem + 1vw, 2rem)', paddingBottom: 'clamp(2rem, 1.5rem + 2vw, 4rem)' }}>
        {/* Dashboard Header */}
        <div className="flex items-center justify-between w-full mt-4 mb-4 px-2" style={{ marginTop: 'clamp(0.5rem, 0.4rem + 0.5vw, 1rem)', marginBottom: 'clamp(0.5rem, 0.4rem + 0.5vw, 1rem)' }}>
          <div className="flex flex-col">
            <p className="text-[var(--text-secondary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)' }}>{todayDate}</p>
          </div>
          <div className="flex items-center gap-2">
            {activeSessionId && (
              <>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('study-exit-session'))}
                  className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors py-1.5 rounded-lg hover:bg-[var(--accent-primary)]/5"
                  style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', paddingLeft: 'clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)', paddingRight: 'clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)' }}
                  title="Cancel session (keep or delete)"
                >
                  <X size={16} />
                  <span className="hidden sm:inline">Cancel Session</span>
                </button>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('study-delete-session'))}
                  className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-red-500 transition-colors py-1.5 rounded-lg hover:bg-red-500/5"
                  style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', paddingLeft: 'clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)', paddingRight: 'clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)' }}
                  title="Delete session permanently"
                >
                  <Trash2 size={16} />
                  <span className="hidden sm:inline">Finish Session</span>
                </button>
              </>
            )}
            <button
              onClick={() => navigateTo('focusWidget')}
              className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors py-1.5 rounded-lg hover:bg-[var(--accent-primary)]/5"
              style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', paddingLeft: 'clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)', paddingRight: 'clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)' }}
            >
              <Zap size={16} />
              <span className="hidden sm:inline">Focus Widget</span>
            </button>
          </div>
        </div>

        <div className="w-full pb-2 flex flex-col my-auto" style={{ gap: 'clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)' }}>
          {/* Top: Timers full width */}
          <div className="w-full" data-tour="session-timer">
            <UnifiedTimer isSynced={isSynced} isRunning={isRunning} />
          </div>

          {/* Noise Generator */}
          <div className="dashboard-noise-card max-w-[73rem] w-full mx-auto">
            <NoiseGenerator />
          </div>
        </div>

      </div>
    </>
  );
});

SessionPage.displayName = "SessionPage";

export default SessionPage;
