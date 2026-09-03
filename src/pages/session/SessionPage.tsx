import { Activity, Clock, Flame, Link2, Link2Off, Trash2, X, Zap } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { useAppStore, useLaps, useUi } from "@/store/appStore";

import { Helmet } from "react-helmet-async";
import NoiseGenerator from "@/pages/session/NoiseGenerator";
import TimerSettings from "@/components/TimerSettings";
import UnifiedTimer from "@/pages/session/UnifiedTimer";
import { getLocalDateString } from "@/utils/dateUtils";
import { useNavigation } from "@/navbar/NavigationContext";

const durationToSeconds = (duration?: string | number | null): number => {
  if (duration === null || duration === undefined || duration === "") return 0;
  if (typeof duration === "number") return duration;
  if (/^\d+$/.test(duration)) return parseInt(duration, 10);
  const parts = duration.split(":");
  if (parts.length !== 3) return 0;
  const hh = Number(parts[0] || 0);
  const mm = Number(parts[1] || 0);
  const ss = Number(parts[2] || 0);
  if ([hh, mm, ss].some(v => typeof v !== "number" || isNaN(v))) return 0;
  return hh * 3600 + mm * 60 + ss;
};


const SessionPage = memo(() => {
  const ui = useUi();
  const { navigateTo } = useNavigation();
  const isSynced = ui.isSynced;
  const isRunning = ui.isRunning;
  const activeSessionId = useAppStore(s => s.activeSessionId);
  const resetKey = ui.resetKey;
  const syncPomodoro = useAppStore(s => s.syncSettings.syncPomodoroWithTimer);
  const syncCountdown = useAppStore(s => s.syncSettings.syncCountdownWithTimer);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [stats, setStats] = useState({ pomodorosToday: 0, sessionsToday: 0, studyTime: 0 });
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);
  const { laps } = useLaps();

  // Load stats and session title from localStorage + DB laps
  useEffect(() => {
    const loadStats = () => {
      try {
        const today = getLocalDateString();
        const pomos = parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || '0', 10);
        const sessions = parseInt(localStorage.getItem('sessionsTodayCount') || '0', 10);

        const todayLocal = new Date();
        todayLocal.setHours(0, 0, 0, 0);
        const tomorrowLocal = new Date(todayLocal);
        tomorrowLocal.setDate(todayLocal.getDate() + 1);
        const activeSessionId = localStorage.getItem('activeSessionId');

        let studySeconds = 0;
        (laps || []).forEach((lap: any) => {
          const date = lap.created_at || lap.started_at;
          if (!date) return;
          const lapDate = new Date(date);
          if (lapDate < todayLocal || lapDate >= tomorrowLocal) return;
          if (lap.id === activeSessionId) return; // active session counted from timer state
          studySeconds += durationToSeconds(lap.duration);
        });

        const studyRaw = localStorage.getItem('studyTimerState');
        let title: string | null = null;
        if (studyRaw) {
          const parsed = JSON.parse(studyRaw);
          title = parsed.sessionTitle || parsed.title || null;
          if (parsed.isRunning && parsed.lastStart) {
            studySeconds += (parsed.timeAtStart || 0) + Math.floor((Date.now() - parsed.lastStart) / 1000);
          } else {
            studySeconds += parsed.time || 0;
          }
        }
        setStats({ pomodorosToday: pomos, sessionsToday: sessions, studyTime: studySeconds });
        setSessionTitle(title);
      } catch {}
    };

    loadStats();

    const handleStatsUpdate = () => loadStats();
    window.addEventListener('pomodoroCompleted', handleStatsUpdate);
    window.addEventListener('sessionCompleted', handleStatsUpdate);
    const statsInterval = setInterval(loadStats, 5000);

    return () => {
      window.removeEventListener('pomodoroCompleted', handleStatsUpdate);
      window.removeEventListener('sessionCompleted', handleStatsUpdate);
      clearInterval(statsInterval);
    };
  }, [laps]);

  const formatStudyTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

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
      <div className="w-full session-page" style={{ fontSize: 'clamp(0.875rem, 0.85rem + 0.15vw, 1rem)', paddingLeft: 'clamp(0.5rem, 0.3rem + 1vw, 2rem)', paddingRight: 'clamp(0.5rem, 0.3rem + 1vw, 2rem)', paddingBottom: 'clamp(2rem, 1.5rem + 2vw, 4rem)' }}>
        {/* Dashboard Header */}
        <div className="flex items-center justify-between w-full mt-4 mb-4 px-2" style={{ marginTop: 'clamp(0.5rem, 0.4rem + 0.5vw, 1rem)', marginBottom: 'clamp(0.5rem, 0.4rem + 0.5vw, 1rem)' }}>
          <div className="flex flex-col">
            <h1 className="font-bold text-[var(--text-primary)]" style={{ fontSize: 'clamp(1.125rem, 1rem + 0.6vw, 1.5rem)', marginBottom: '0.125rem' }}>
              {sessionTitle || 'Start a Session!'}
            </h1>
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

        <div className="w-full pb-2 flex flex-col" style={{ gap: 'clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)' }}>
          {/* Top: Timers full width */}
          <div className="w-full" data-tour="session-timer">
            <UnifiedTimer isSynced={isSynced} isRunning={isRunning} />
          </div>

          {/* Bottom row: Noise (left) + Stats (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-3">
            {/* Noise Generator */}
            <div className="dashboard-noise-card">
              <NoiseGenerator />
            </div>

            {/* Stats grid - 2x2, centered */}
            <div className="flex flex-col items-center justify-center">
              <div
                className="grid grid-cols-2 gap-3 w-full"
                style={{ maxWidth: '360px' }}
              >
                {/* Pomodoros Today */}
                <div className="dashboard-stat-card !p-3 flex flex-col gap-2 items-center text-center">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-500/10">
                      <Flame size={16} className="text-red-500" />
                    </div>
                    <span className="font-medium text-[var(--text-secondary)] uppercase tracking-wide text-[0.625rem]">Pomodoros</span>
                  </div>
                  <div className="flex items-baseline gap-1 justify-center">
                    <span className="font-bold text-[var(--text-primary)] text-2xl">{stats.pomodorosToday}</span>
                    <span className="text-[var(--text-secondary)] text-xs">today</span>
                  </div>
                </div>

                {/* Study Time */}
                <div className="dashboard-stat-card !p-3 flex flex-col gap-2 items-center text-center">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10">
                      <Clock size={16} className="text-blue-500" />
                    </div>
                    <span className="font-medium text-[var(--text-secondary)] uppercase tracking-wide text-[0.625rem]">Study</span>
                  </div>
                  <div className="flex items-baseline gap-1 justify-center">
                    <span className="font-bold text-[var(--text-primary)] text-2xl">{formatStudyTime(stats.studyTime)}</span>
                  </div>
                </div>

                {/* Sessions Today */}
                <div className="dashboard-stat-card !p-3 flex flex-col gap-2 items-center text-center">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-green-500/10">
                      <Activity size={16} className="text-green-500" />
                    </div>
                    <span className="font-medium text-[var(--text-secondary)] uppercase tracking-wide text-[0.625rem]">Sessions</span>
                  </div>
                  <div className="flex items-baseline gap-1 justify-center">
                    <span className="font-bold text-[var(--text-primary)] text-2xl">{stats.sessionsToday}</span>
                    <span className="text-[var(--text-secondary)] text-xs">today</span>
                  </div>
                </div>

                {/* Sync Status */}
                <div className="dashboard-stat-card !p-3 flex flex-col gap-2 items-center text-center">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${syncPomodoro || syncCountdown ? 'bg-[var(--accent-primary)]/10' : 'bg-[var(--bg-secondary)]'}`}>
                      {syncPomodoro || syncCountdown ? (
                        <Link2 size={16} className="text-[var(--accent-primary)]" />
                      ) : (
                        <Link2Off size={16} className="text-[var(--text-secondary)]" />
                      )}
                    </div>
                    <span className="font-medium text-[var(--text-secondary)] uppercase tracking-wide text-[0.625rem]">Sync</span>
                  </div>
                  <div className="flex items-baseline gap-1 justify-center">
                    <span className={`font-bold text-lg ${syncPomodoro || syncCountdown ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}>
                      {syncPomodoro && syncCountdown ? 'Pomo + Count' : syncPomodoro ? 'Pomodoro' : syncCountdown ? 'Countdown' : 'OFF'}
                    </span>
                  </div>
                </div>
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
    </>
  );
});

SessionPage.displayName = "SessionPage";

export default SessionPage;
