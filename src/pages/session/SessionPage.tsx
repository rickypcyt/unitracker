import { memo, useEffect, useState } from "react";
import { useUi } from "@/store/appStore";
import { useAuth } from "@/hooks/auth/useAuth";
import { LogIn } from "lucide-react";

import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import NoiseGenerator from "@/pages/session/NoiseGenerator";
import ScratchPad from "@/pages/session/ScratchPad";
import PendingTasks from "@/pages/session/PendingTasks";
import MonthView from "@/pages/session/MonthView";
import TimerCards from "@/pages/session/components/TimerCards";
import {
  getSessionLayout,
  SESSION_LAYOUT_EVENT,
  type SessionLayoutId,
} from "@/pages/session/sessionLayouts";

const SessionPage = memo(() => {
  const { t } = useTranslation();
  const ui = useUi();
  const { isLoggedIn, loginWithGoogle } = useAuth();
  const isSynced = ui.isSynced;
  const isRunning = ui.isRunning;
  const resetKey = ui.resetKey;

  const [layout, setLayout] = useState<SessionLayoutId>(getSessionLayout);

  useEffect(() => {
    const handler = () => setLayout(getSessionLayout());
    window.addEventListener(SESSION_LAYOUT_EVENT, handler);
    return () => window.removeEventListener(SESSION_LAYOUT_EVENT, handler);
  }, []);



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


  // `flat`: on 2xl the wrappers become `display: contents`, so the three timer cards are
  // direct items of the parent grid (used by the default layout).
  const renderTimers = (flat = false) => (
    <div className={`w-full min-w-0 h-full flex flex-col ${flat ? "2xl:contents" : ""}`} data-tour="session-timer">
      {!isLoggedIn && (
        <button
          onClick={() => loginWithGoogle()}
          className="lg:hidden mb-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-(--accent-primary) py-2.5 text-sm font-semibold text-(--accent-primary) hover:bg-(--accent-primary)/10 transition-colors"
        >
          <LogIn size={16} />
          {t("session.loginToSync")}
        </button>
      )}
      <TimerCards isSynced={isSynced} isRunning={isRunning} className={flat ? "2xl:contents" : ""} />
    </div>
  );
  const timersSection = renderTimers();

  const tasksMonthRow = (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 items-start">
      <div className="min-w-0">
        <PendingTasks />
      </div>
      <div className="min-w-0">
        <MonthView />
      </div>
    </div>
  );

  // md–xl (768–1535): 2 columns. Timers full width, then noise | calendar, then
  //   pending tasks | scratchpad. (A 3-column layout is too cramped for the timer cards here.)
  // 2xl (≥1536): 5 equal columns (the 5th is pending tasks, same width as the timers). Row 1: calendar, pomo, sessions,
  //   countdown. Row 2: noise | scratchpad (3 cols). The timer cards are square and set the
  //   row height, so calendar and noise are the same square size; every other block is
  //   absolute in its cell (fills it, scrolls inside). Pending tasks spans both rows.
  const timersMonthRow = (
    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-5 2xl:grid-rows-2 gap-4 items-stretch">
      {/* Timers: full width; on 2xl the cards are placed directly in this grid (row 1, cols 2-4) */}
      <div className="min-w-0 order-1 md:col-span-2 2xl:contents">
        {renderTimers(true)}
      </div>
      {/* Scratchpad */}
      <div className="min-w-0 min-h-0 order-2 md:order-5 2xl:col-start-2 2xl:col-span-3 2xl:row-start-2 2xl:relative">
        <div className="md:h-full md:*:max-h-none 2xl:absolute 2xl:inset-0 2xl:*:min-h-0">
          <ScratchPad />
        </div>
      </div>
      {/* Calendar */}
      <div className="min-w-0 order-3 2xl:col-start-1 2xl:row-start-1 2xl:relative 2xl:min-h-0">
        <div className="md:h-full md:[&>section]:aspect-auto md:[&>section]:h-full 2xl:absolute 2xl:inset-0">
          <MonthView fillHeight />
        </div>
      </div>
      {/* Noise generator */}
      <div className="order-4 md:order-2 2xl:col-start-1 2xl:row-start-2 min-w-0 2xl:relative 2xl:min-h-0">
        <div className="noise-fit dashboard-noise-card w-full overflow-hidden p-3 md:h-full 2xl:absolute 2xl:inset-0 2xl:overflow-y-auto">
          <NoiseGenerator />
        </div>
      </div>
      {/* Pending tasks — on 2xl it spans both rows (absolute, scrolls inside) */}
      <div className="min-w-0 order-5 md:order-4 2xl:col-start-5 2xl:row-start-1 2xl:row-span-2 2xl:relative 2xl:min-h-0">
        <div className="md:h-full 2xl:absolute 2xl:inset-0">
          <PendingTasks fillHeight />
        </div>
      </div>
    </div>
  );

  const toolsRow = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
      <div className="order-2 lg:order-1 dashboard-noise-card w-full h-full">
        <NoiseGenerator />
      </div>
      <div className="order-1 lg:order-2 h-full">
        <ScratchPad />
      </div>
    </div>
  );

  const tasksRow = (
    <div className="min-w-0">
      <PendingTasks />
    </div>
  );

  const compactRow = (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 items-start">
      <div className="min-w-0">
        <PendingTasks />
      </div>
      <div className="min-w-0">
        <MonthView />
      </div>
      <div className="min-w-0 flex flex-col gap-4">
        <div className="dashboard-noise-card w-full">
          <NoiseGenerator />
        </div>
        <div className="flex-1">
          <ScratchPad />
        </div>
      </div>
    </div>
  );

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
      <div className="w-full session-page pb-24 sm:pb-4" style={{ fontSize: 'clamp(0.875rem, 0.85rem + 0.15vw, 1rem)' }}>
        <div
          className="session-sections w-full max-w-360 lg:max-w-none mx-auto flex flex-col gap-4"
        >
          {layout === "planning" ? (
            <>
              {tasksMonthRow}
              {timersSection}
              {toolsRow}
            </>
          ) : layout === "focus" ? (
            <>
              {timersSection}
              {tasksRow}
            </>
          ) : layout === "compact" ? (
            <>
              {timersSection}
              {compactRow}
            </>
          ) : (
            <>
              {timersMonthRow}
            </>
          )}
        </div>
      </div>
    </>
  );
});

SessionPage.displayName = "SessionPage";

export default SessionPage;
