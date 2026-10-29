import { memo, useEffect } from "react";
import { motion } from "framer-motion";
import { useUi } from "@/store/appStore";
import { useAuth } from "@/hooks/auth/useAuth";
import { LogIn } from "lucide-react";

import { Helmet } from "react-helmet-async";
import NoiseGenerator from "@/pages/session/NoiseGenerator";
import ScratchPad from "@/pages/session/ScratchPad";
import PendingTasks from "@/pages/session/PendingTasks";
import MonthView from "@/pages/session/MonthView";
import UnifiedTimer from "@/pages/session/UnifiedTimer";

const SessionPage = memo(() => {
  const ui = useUi();
  const { isLoggedIn, loginWithGoogle } = useAuth();
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

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

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
      <div className="w-full session-page px-4 sm:px-6 lg:px-2 pt-4 pb-24 sm:pb-4" style={{ fontSize: 'clamp(0.875rem, 0.85rem + 0.15vw, 1rem)' }}>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="w-full max-w-[73rem] 2xl:max-w-[92rem] mx-auto flex flex-col gap-4"
        >
          {/* Top: Noise Generator + Scratchpad */}
          <div className="order-3 grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            <motion.div variants={item} className="dashboard-noise-card w-full h-full">
              <NoiseGenerator />
            </motion.div>
            <motion.div variants={item} className="h-full">
              <ScratchPad />
            </motion.div>
          </div>

          {/* Timers full width */}
          <motion.div variants={item} className="order-1 w-full" data-tour="session-timer">
            {!isLoggedIn && (
              <button
                onClick={() => loginWithGoogle()}
                className="lg:hidden mb-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[var(--accent-primary)] py-2.5 text-sm font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
              >
                <LogIn size={16} />
                Log in to sync your sessions
              </button>
            )}
            <UnifiedTimer isSynced={isSynced} isRunning={isRunning} />
          </motion.div>
          <div className="order-2 grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 items-stretch">
            <motion.div variants={item} className="min-w-0">
              <PendingTasks />
            </motion.div>
            <motion.div variants={item} className="min-w-0">
              <MonthView />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
});

SessionPage.displayName = "SessionPage";

export default SessionPage;
