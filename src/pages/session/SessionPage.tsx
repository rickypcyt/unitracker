import { memo, useEffect, useState } from "react";

import Countdown from "./Countdown";
import GlobalTimerControls from "@/components/GlobalTimerControls";
import { Helmet } from "react-helmet-async";
import NoiseGenerator from "@/pages/session/NoiseGenerator";
import Pomodoro from "@/pages/session/Pomodoro";
import StudyTimer from "@/pages/session/StudyTimer";
import TimerSettings from "@/components/TimerSettings";
import { useUi } from "@/store/appStore";

const SessionPage = memo(() => {
  const ui = useUi();
  const isSynced = ui.isSynced;
  const isRunning = ui.isRunning;
  const resetKey = ui.resetKey;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pomodoroState, setPomodoroState] = useState<any>(null);

  // Load Pomodoro state from localStorage to show current mode
  useEffect(() => {
    const loadPomodoroState = () => {
      try {
        const saved = localStorage.getItem('pomodoroState');
        if (saved) {
          const parsed = JSON.parse(saved);
          setPomodoroState(parsed);
        }
      } catch (e) {
        console.error('Failed to load pomodoro state:', e);
      }
    };

    loadPomodoroState();
    
    // Listen for Pomodoro state changes
    const handlePomodoroUpdate = () => loadPomodoroState();
    window.addEventListener('pomodoroStateUpdate', handlePomodoroUpdate);
    
    return () => window.removeEventListener('pomodoroStateUpdate', handlePomodoroUpdate);
  }, []);

  const getPomodoroModeDisplay = () => {
    if (!pomodoroState || !pomodoroState.isRunning) return null;

    const mode = pomodoroState.currentMode || 'work';
    const validModes = ['work', 'break', 'longBreak'] as const;
    type ValidMode = typeof validModes[number];
    const currentMode: ValidMode = validModes.includes(mode as ValidMode) ? mode as ValidMode : 'work';
    
    const modeConfig = {
      work: { text: 'WORK', color: 'text-red-500', bgColor: 'bg-red-500/10' },
      break: { text: 'BREAK', color: 'text-green-500', bgColor: 'bg-green-500/10' },
      longBreak: { text: 'LONG BREAK', color: 'text-blue-500', bgColor: 'bg-blue-500/10' }
    };
    
    const config = modeConfig[currentMode];
    
    return (
      <div className={`px-4 py-2 rounded-lg ${config.bgColor} ${config.color} font-semibold text-center uppercase tracking-wider`}>
        {config.text}
      </div>
    );
  };

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
    <>
      <Helmet>
        <title>Pomodoro Timer & Study Sessions | Uni Tracker 2026</title>
        <meta
          name="description"
          content="Free Pomodoro timer for students. Track study sessions, manage breaks, and boost productivity with our free study app. No ads, no subscriptions."
        />
        <meta
          name="keywords"
          content="pomodoro timer, study timer, productivity timer, focus timer, study sessions, break timer, time management, student productivity"
        />
        <meta property="og:title" content="Pomodoro Timer & Study Sessions | Uni Tracker 2026" />
        <meta
          property="og:description"
          content="Free Pomodoro timer for students. Track study sessions, manage breaks, and boost productivity with our free study app."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://uni-tracker.vercel.app/session" />
        <link rel="canonical" href="https://uni-tracker.vercel.app/session" />
      </Helmet>
      <div className="w-full px-2 sm:px-4 md:px-3 lg:px-6 xl:px-24 session-page">
      {/* Pomodoro mode display at the very top when active */}
      {getPomodoroModeDisplay() && (
        <div className="w-full px-2 mb-3">
          {getPomodoroModeDisplay()}
        </div>
      )}
      
      <div className="w-full px-2 overflow-hidden pb-2">
        {/* Controles globales */}
        <div className="px-1 mb-3">
          <GlobalTimerControls />
        </div>

        {/* Grid con Timer ocupando toda la primera fila en mobile/tablet, tres columnas en lg */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 w-full mb-3">
          {/* Study Timer - ocupa toda la primera fila en mobile/tablet, una columna en lg */}
          <div className="col-span-2 lg:col-span-1 maincard p-2 sm:p-3 w-full space-y-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] shadow-none">
            <StudyTimer
              isSynced={isSynced}
            />
          </div>

          {/* Pomo */}
          <div className="maincard p-2 sm:p-3 w-full space-y-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] shadow-none">
            <Pomodoro />
          </div>

          {/* Countdown */}
          <div className="maincard p-2 sm:p-3 w-full space-y-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] shadow-none">
            <Countdown
              isSynced={isSynced}
              isRunning={isRunning}
            />
          </div>
        </div>

        {/* Noise Generator */}
        <div className="w-full">
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
    </>
  );
});

SessionPage.displayName = "SessionPage";

export default SessionPage;
