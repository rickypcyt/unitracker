import { Activity, Clock, Flame, Link2, Link2Off, Zap } from "lucide-react";
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
        <title>Pomodoro Timer & Study Sessions | UniTracker 2026</title>
        <meta
          name="description"
          content="Free Pomodoro timer for students. Track study sessions, manage breaks, and boost productivity with our free study app. No ads, no subscriptions."
        />
        <meta
          name="keywords"
          content="pomodoro timer, study timer, productivity timer, focus timer, study sessions, break timer, time management, student productivity"
        />
        <meta property="og:title" content="Pomodoro Timer & Study Sessions | UniTracker 2026" />
        <meta
          property="og:description"
          content="Free Pomodoro timer for students. Track study sessions, manage breaks, and boost productivity with our free study app."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://unitracker.me/session" />
        <link rel="canonical" href="https://unitracker.me/session" />
      </Helmet>
      <div className="w-full px-2 sm:px-4 md:px-3 lg:px-6 xl:px-24 session-page">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between w-full mt-4 mb-4 px-2">
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-0.5">
              {sessionTitle || 'Start a Session!'}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">{todayDate}</p>
          </div>
          <button
            onClick={() => navigateTo('focusWidget')}
            className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--accent-primary)]/5"
          >
            <Zap size={16} />
            <span className="hidden sm:inline">Focus Widget</span>
          </button>
        </div>

        <div className="w-full px-2 overflow-hidden pb-2">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Unified Timer */}
            <div className="w-full lg:w-1/2" data-tour="session-timer">
              <UnifiedTimer isSynced={isSynced} isRunning={isRunning} />
            </div>

            {/* Right column: stats row + Noise Generator */}
            <div className="w-full lg:w-1/2 flex flex-col gap-3">
              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {/* Pomodoros Today */}
                <div className="dashboard-stat-card">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-lg bg-red-500/10">
                      <Flame size={16} className="text-red-500" />
                    </div>
                    <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Pomodoros</span>
                  </div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.pomodorosToday}</div>
                  <div className="text-xs text-[var(--text-secondary)]">today</div>
                </div>

                {/* Study Time */}
                <div className="dashboard-stat-card">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-lg bg-blue-500/10">
                      <Clock size={16} className="text-blue-500" />
                    </div>
                    <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Study Time</span>
                  </div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{formatStudyTime(stats.studyTime)}</div>
                  <div className="text-xs text-[var(--text-secondary)]">session today</div>
                </div>

                {/* Sessions Today */}
                <div className="dashboard-stat-card">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-lg bg-green-500/10">
                      <Activity size={16} className="text-green-500" />
                    </div>
                    <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Sessions</span>
                  </div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.sessionsToday}</div>
                  <div className="text-xs text-[var(--text-secondary)]">today</div>
                </div>

                {/* Sync Status - Dynamic */}
                <div className="dashboard-stat-card">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`p-1.5 rounded-lg ${syncPomodoro || syncCountdown ? 'bg-[var(--accent-primary)]/10' : 'bg-[var(--bg-secondary)]'}`}>
                      {syncPomodoro || syncCountdown ? (
                        <Link2 size={16} className="text-[var(--accent-primary)]" />
                      ) : (
                        <Link2Off size={16} className="text-[var(--text-secondary)]" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Sync</span>
                  </div>
                  {syncPomodoro && syncCountdown ? (
                    <div className="text-sm font-bold text-[var(--accent-primary)]">Pomo + Countdown</div>
                  ) : syncPomodoro ? (
                    <div className="text-sm font-bold text-red-500">Pomodoro</div>
                  ) : syncCountdown ? (
                    <div className="text-sm font-bold text-green-500">Countdown</div>
                  ) : (
                    <div className="text-sm font-bold text-[var(--text-secondary)]">OFF</div>
                  )}
                  <div className="text-xs text-[var(--text-secondary)]">
                    {syncPomodoro || syncCountdown ? 'linked to Study' : 'independent timers'}
                  </div>
                </div>
              </div>

              {/* Noise Generator */}
              <div className="dashboard-noise-card min-h-0 flex-1">
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
    </>
  );
});

SessionPage.displayName = "SessionPage";

export default SessionPage;
