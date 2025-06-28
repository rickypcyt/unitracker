import { CheckSquare, Coffee, MoreVertical, Pause, Play, RotateCcw, Square, Timer } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

import PomodoroSettingsModal from "@/modals/PomodoroSettingsModal";
import { formatPomoTime } from "@/hooks/useTimers";
import toast from "react-hot-toast";
import useEventListener from "@/hooks/useEventListener";
import useTheme from "@/hooks/useTheme";

// Initial modes
const INITIAL_MODES = [
  { label: "50/10", work: 50 * 60, break: 10 * 60, longBreak: 30 * 60 },
  { label: "25/5", work: 25 * 60, break: 5 * 60, longBreak: 15 * 60 },
  { label: "90/30", work: 90 * 60, break: 30 * 60, longBreak: 45 * 60 },
  { label: "Custom", work: 45 * 60, break: 15 * 60, longBreak: 30 * 60 }, // Add default custom mode
];

// Preload sounds
const sounds = {
  work: new Audio("/sounds/pomo-end.mp3"),
  break: new Audio("/sounds/break-end.mp3"),
  longBreak: new Audio("/sounds/break-end.mp3") // Using same sound for now
};

// Initialize sounds
Object.values(sounds).forEach(sound => {
  sound.load();
  sound.volume = 0.5;
});

const Pomodoro = () => {
  const { accentPalette } = useTheme();
  const iconColor = accentPalette === "#ffffff" ? "#000000" : "#ffffff";

  // State declarations
  const [modes, setModes] = useState(() => {
    const savedModes = localStorage.getItem("pomodoroModes");
    return savedModes ? JSON.parse(savedModes) : INITIAL_MODES;
  });

  const [pomoState, setPomoState] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    const savedState = localStorage.getItem("pomodoroState");
    const defaultModeIndex = 0;
    const defaultMode = "work";
    const defaultTimeLeft = modes[defaultModeIndex][defaultMode];
    const defaultWorkSessionsBeforeLongBreak = 4;

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        return {
          modeIndex: Number(parsed.modeIndex) || defaultModeIndex,
          currentMode: parsed.currentMode || defaultMode,
          timeLeft: Number(parsed.timeLeft) || defaultTimeLeft,
          isRunning: localStorage.getItem("pomodoroIsRunning") === "true",
          pomodoroToday: parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || "0"),
          workSessionsBeforeLongBreak: parsed.workSessionsBeforeLongBreak || defaultWorkSessionsBeforeLongBreak,
          workSessionsCompleted: parsed.workSessionsCompleted || 0,
          startTime: Number(parsed.startTime) || 0,
          pausedTime: Number(parsed.pausedTime) || 0,
          lastManualAdjustment: 0, // Add this to track last manual adjustment
        };
      } catch (error) {
        console.error('Error parsing saved state:', error);
        return {
          modeIndex: defaultModeIndex,
          currentMode: defaultMode,
          timeLeft: defaultTimeLeft,
          isRunning: false,
          pomodoroToday: 0,
          workSessionsBeforeLongBreak: defaultWorkSessionsBeforeLongBreak,
          workSessionsCompleted: 0,
          startTime: 0,
          pausedTime: 0,
          lastManualAdjustment: 0, // Add this to track last manual adjustment
        };
      }
    }
    return {
      modeIndex: defaultModeIndex,
      currentMode: defaultMode,
      timeLeft: defaultTimeLeft,
      isRunning: false,
      pomodoroToday: 0,
      workSessionsBeforeLongBreak: defaultWorkSessionsBeforeLongBreak,
      workSessionsCompleted: 0,
      startTime: 0,
      pausedTime: 0,
      lastManualAdjustment: 0, // Add this to track last manual adjustment
    };
  });

  const [isSyncedWithStudyTimer, setIsSyncedWithStudyTimer] = useState(() => {
    const savedState = localStorage.getItem('isSyncedWithStudyTimer');
    return savedState ? JSON.parse(savedState) : false;
  });

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // All function declarations first
  const handleStart = useCallback(() => {
    const modeDuration = modes[pomoState.modeIndex][pomoState.currentMode];
    setPomoState(prev => ({
      ...prev,
      isRunning: true,
      startTime: Date.now() / 1000,
      pausedTime: 0,
      timeLeft: prev.pausedTime > 0 ? prev.timeLeft : modeDuration,
      lastManualAdjustment: Date.now()
    }));

    if (isSyncedWithStudyTimer) {
      window.dispatchEvent(new CustomEvent("startStudyTimer"));
    }
  }, [pomoState.modeIndex, pomoState.currentMode, modes, isSyncedWithStudyTimer]);

  const handleStop = useCallback(() => {
    setPomoState(prev => ({
      ...prev,
      isRunning: false,
      pausedTime: Date.now() / 1000,
      lastManualAdjustment: Date.now()
    }));

    if (isSyncedWithStudyTimer) {
      window.dispatchEvent(new CustomEvent("pauseStudyTimer"));
    }
  }, [isSyncedWithStudyTimer]);

  const handleReset = useCallback(() => {
    const modeDuration = modes[pomoState.modeIndex][pomoState.currentMode];
    setPomoState(prev => ({
      ...prev,
      isRunning: false,
      timeLeft: modeDuration,
      startTime: 0,
      pausedTime: 0,
      lastManualAdjustment: Date.now()
    }));

    if (isSyncedWithStudyTimer) {
      window.dispatchEvent(new CustomEvent("resetStudyTimer"));
    }
  }, [pomoState.modeIndex, pomoState.currentMode, modes, isSyncedWithStudyTimer]);

  const handleModeChange = useCallback((index) => {
    const safeIndex = Math.min(index, modes.length - 1);
    setPomoState(prev => ({
      ...prev,
      modeIndex: safeIndex,
      timeLeft: modes[safeIndex][prev.currentMode],
      isRunning: false,
    }));
  }, [modes]);

  const handleSaveCustomMode = useCallback((customMode) => {
    setModes(prev => {
      const newModes = [...prev];
      const customModeIndex = newModes.length - 1;
      newModes[customModeIndex] = customMode;
      handleModeChange(customModeIndex);
      return newModes;
    });
  }, [handleModeChange]);

  const handleTimeAdjustment = useCallback((adjustment) => {
    const now = Date.now();
    const currentMode = modes[pomoState.modeIndex];
    const maxTime = currentMode[pomoState.currentMode];

    if (adjustment < 0 && pomoState.timeLeft <= 0) {
      const newMode = pomoState.currentMode === "work" ? "break" : "work";
      const newTimeLeft = currentMode[newMode];

      setPomoState(prev => ({
        ...prev,
        currentMode: newMode,
        timeLeft: newTimeLeft,
        startTime: now / 1000,
        pausedTime: 0,
        lastManualAdjustment: now
      }));

      if (isSyncedWithStudyTimer) {
        window.dispatchEvent(new CustomEvent("adjustStudyTimerTime", {
          detail: {
            adjustment: -currentMode[pomoState.currentMode],
            forceSync: true
          }
        }));
      }
      return;
    }

    let newTimeLeft;
    if (pomoState.isRunning) {
      newTimeLeft = Math.max(0, Math.min(pomoState.timeLeft + adjustment, maxTime));
      setPomoState(prev => ({
        ...prev,
        timeLeft: newTimeLeft,
        startTime: now / 1000,
        pausedTime: 0,
        lastManualAdjustment: now
      }));
    } else {
      newTimeLeft = Math.max(0, Math.min(pomoState.timeLeft + adjustment, maxTime));
      setPomoState(prev => ({
        ...prev,
        timeLeft: newTimeLeft,
        lastManualAdjustment: now
      }));
    }

    if (isSyncedWithStudyTimer) {
      window.dispatchEvent(new CustomEvent("adjustStudyTimerTime", {
        detail: {
          adjustment: -adjustment,
          forceSync: true
        }
      }));
    }
  }, [pomoState.isRunning, pomoState.currentMode, pomoState.timeLeft, modes, pomoState.modeIndex, isSyncedWithStudyTimer]);

  const handlePomodoroComplete = useCallback(() => {
    const isWork = pomoState.currentMode === "work";
    const shouldTakeLongBreak = isWork &&
      (pomoState.workSessionsCompleted + 1) % pomoState.workSessionsBeforeLongBreak === 0;

    const nextMode = isWork
      ? (shouldTakeLongBreak ? "longBreak" : "break")
      : "work";

    const sound = sounds[isWork ? "work" : (pomoState.currentMode === "longBreak" ? "longBreak" : "break")];

    // Play sound
    sound.currentTime = 0;
    sound.play().catch(console.error);

    // Update state
    setPomoState(prev => {
      // Solo incrementamos pomodoroToday cuando terminamos un ciclo completo (work -> break -> work)
      const shouldIncrementPomodoro = !isWork; // Incrementamos cuando terminamos el break
      const newWorkSessionsCompleted = isWork ? prev.workSessionsCompleted + 1 : prev.workSessionsCompleted;

      return {
        ...prev,
        currentMode: nextMode,
        timeLeft: modes[prev.modeIndex][nextMode],
        pomodoroToday: shouldIncrementPomodoro ? prev.pomodoroToday + 1 : prev.pomodoroToday,
        workSessionsCompleted: newWorkSessionsCompleted,
      };
    });

    // Show toast notification
    if (isWork) {
      if (shouldTakeLongBreak) {
        toast.success("Work session complete! Time for a long break. 🎉", {
          duration: 3000,
          position: 'top-center',
        });
      } else {
        toast.success("Work session complete! Time for a break.");
      }
    } else {
      toast.success("Break is over! Let's get back to work! 💪", {
        duration: 3000,
        position: 'top-center',
      });
    }

    // Show browser notification
    showNotification(
      isWork
        ? (shouldTakeLongBreak ? "Work Session Complete! Time for a Long Break! 🎉" : "Work Session Complete! 🎉")
        : "Break Complete! ⏰",
      {
        body: isWork
          ? (shouldTakeLongBreak
            ? "Great job! Time to take a well-deserved long break."
            : "Great job! Time to take a short break.")
          : "Break is over! Time to get back to work.",
        icon: isWork ? "🍅" : "💪",
        badge: isWork ? "🍅" : "💪",
        tag: "pomodoro-notification",
        requireInteraction: true
      }
    );
  }, [pomoState.currentMode, pomoState.modeIndex, pomoState.workSessionsCompleted, pomoState.workSessionsBeforeLongBreak, Notification.permission]);

  const handleWorkSessionsChange = useCallback((newWorkSessions) => {
    setPomoState(prev => ({
      ...prev,
      workSessionsBeforeLongBreak: newWorkSessions,
      workSessionsCompleted: 0
    }));
  }, []);

  // All event listeners after all function declarations
  useEventListener("startPomodoro", handleStart, [handleStart]);
  useEventListener("pauseTimerSync", () => {
    if (pomoState.isRunning && isSyncedWithStudyTimer) {
      handleStop();
    }
  }, [pomoState.isRunning, handleStop, isSyncedWithStudyTimer]);
  useEventListener("stopPomodoro", handleStop, [handleStop]);
  useEventListener("resetPomodoro", handleReset, [handleReset]);
  useEventListener("playTimerSync", () => {
    if (!pomoState.isRunning && isSyncedWithStudyTimer) {
      handleStart();
    }
  }, [pomoState.isRunning, handleStart, isSyncedWithStudyTimer]);

  useEventListener("studyTimerReset", () => {
    if (isSyncedWithStudyTimer) {
      handleReset();
    }
  }, [isSyncedWithStudyTimer, handleReset]);

  useEventListener("studyTimerPause", () => {
    if (isSyncedWithStudyTimer && pomoState.isRunning) {
      handleStop();
    }
  }, [isSyncedWithStudyTimer, pomoState.isRunning, handleStop]);

  useEventListener("studyTimerStart", () => {
    if (isSyncedWithStudyTimer && !pomoState.isRunning) {
      handleStart();
    }
  }, [isSyncedWithStudyTimer, pomoState.isRunning, handleStart]);

  useEventListener("studyTimerSyncStateChanged", (event) => {
    const { isSyncedWithStudyTimer: newSyncState } = event.detail;
    setIsSyncedWithStudyTimer(newSyncState);
  }, []);

  useEventListener("studyTimerTimeUpdate", (event) => {
    if (!isSyncedWithStudyTimer) return;

    const studyTime = Math.floor(event.detail.time);
    const currentMode = modes[pomoState.modeIndex];
    const totalWorkTime = currentMode.work;
    const totalBreakTime = currentMode.break;
    const totalCycleTime = totalWorkTime + totalBreakTime;

    // Ignorar actualizaciones si ha habido un ajuste manual reciente (dentro de 2 segundos)
    const now = Date.now();
    if (now - pomoState.lastManualAdjustment < 2000) {
      return;
    }

    // Calcular posición en el ciclo
    const positionInCycle = studyTime % totalCycleTime;
    const shouldBeWorkMode = positionInCycle < totalWorkTime;
    const isTransitionPoint = positionInCycle === 0 || positionInCycle === totalWorkTime;

    // Actualizar el estado del Pomodoro
    if (isTransitionPoint && shouldBeWorkMode !== (pomoState.currentMode === "work")) {
      setPomoState(prev => ({
        ...prev,
        currentMode: shouldBeWorkMode ? "work" : "break",
        timeLeft: shouldBeWorkMode ? totalWorkTime : totalBreakTime,
        pomodoroToday: shouldBeWorkMode ? prev.pomodoroToday + 1 : prev.pomodoroToday,
        isRunning: true // Mantener el estado de ejecución
      }));

      // Play sound and show notification
      const sound = sounds[shouldBeWorkMode ? "break" : "work"];
      sound.currentTime = 0;
      sound.play().catch(console.error);

      // Show notifications
      if (shouldBeWorkMode) {
        toast.success("Break is over! Let's get back to work! 💪", {
          duration: 3000,
          position: 'top-center',
        });
      } else {
        toast.success("Work session complete! Time for a break.");
      }

      // Show browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        showNotification(
          shouldBeWorkMode ? "Break Complete! ⏰" : "Work Session Complete! 🎉",
          {
            body: shouldBeWorkMode
              ? "Break is over! Time to get back to work."
              : "Great job! Time to take a well-deserved break.",
            icon: shouldBeWorkMode ? "💪" : "🍅",
            badge: shouldBeWorkMode ? "💪" : "🍅",
            tag: "pomodoro-notification",
            requireInteraction: true
          }
        );
      }
    }

    // Actualizar el tiempo restante
    const maxTime = shouldBeWorkMode ? totalWorkTime : totalBreakTime;
    const timeLeft = shouldBeWorkMode
      ? Math.min(maxTime, totalWorkTime - positionInCycle)
      : Math.min(maxTime, totalBreakTime - (positionInCycle - totalWorkTime));

    setPomoState(prev => ({
      ...prev,
      timeLeft: Math.max(0, timeLeft),
      isRunning: true // Mantener el estado de ejecución
    }));
  }, [isSyncedWithStudyTimer, modes, pomoState.modeIndex, pomoState.currentMode, pomoState.lastManualAdjustment, Notification.permission]);

  useEventListener("adjustPomodoroTime", (event) => {
    const { adjustment } = event.detail;
    handleTimeAdjustment(adjustment);
  }, [handleTimeAdjustment]);

  // Effects after all event listeners
  useEffect(() => {
    localStorage.setItem("pomodoroModes", JSON.stringify(modes));
  }, [modes]);

  useEffect(() => {
    const stateToSave = {
      modeIndex: pomoState.modeIndex,
      currentMode: pomoState.currentMode,
      timeLeft: pomoState.timeLeft,
      startTime: pomoState.startTime,
      pausedTime: pomoState.pausedTime,
      workSessionsBeforeLongBreak: pomoState.workSessionsBeforeLongBreak,
      workSessionsCompleted: pomoState.workSessionsCompleted,
      pomodoroToday: pomoState.pomodoroToday
    };
    localStorage.setItem("pomodoroState", JSON.stringify(stateToSave));
    localStorage.setItem("pomodoroIsRunning", pomoState.isRunning.toString());

    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`pomodoroDailyCount_${today}`, pomoState.pomodoroToday.toString());
  }, [pomoState]);

  // Resetear el contador diario a medianoche
  useEffect(() => {
    const resetDailyCount = () => {
      const today = new Date().toISOString().slice(0, 10);
      const lastReset = localStorage.getItem('lastPomodoroReset');

      if (lastReset !== today) {
        localStorage.setItem('lastPomodoroReset', today);
        localStorage.setItem(`pomodoroDailyCount_${today}`, '0');
        setPomoState(prev => ({
          ...prev,
          pomodoroToday: 0
        }));
      }
    };

    // Resetear al cargar la página
    resetDailyCount();

    // Configurar el intervalo para verificar a medianoche
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight.getTime() - now.getTime();

    const midnightTimeout = setTimeout(() => {
      resetDailyCount();
      // Configurar el intervalo para verificar cada día
      setInterval(resetDailyCount, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);

    return () => clearTimeout(midnightTimeout);
  }, []);

  // Timer logic
  useEffect(() => {
    let interval;
    if (pomoState.isRunning && pomoState.timeLeft > 0) {
      // Restart interval whenever isRunning or timeLeft changes
      const startTime = Date.now();
      const startCountingDownFrom = pomoState.timeLeft;

      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const newTimeLeft = Math.max(0, startCountingDownFrom - elapsed);

        if (newTimeLeft <= 0) {
          handlePomodoroComplete();
          return;
        }

        setPomoState(prev => ({
          ...prev,
          timeLeft: newTimeLeft
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [pomoState.isRunning, pomoState.timeLeft]);

  const showNotification = (title, options) => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(title, {
        ...options,
        silent: false,
        vibrate: [200, 100, 200]
      });

      // Close notification after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle notification click
      notification.onclick = () => {
        if (typeof window !== 'undefined') {
          window.focus();
        }
        notification.close();
      };
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  return (
    <div className="flex flex-col items-center h-full">
      {/* Header: Icon, Title, Settings Button */}
      <div className="flex items-center w-full">
        {/* Centered Title with Icon */}
        <div className="section-title flex-1">
          <Timer size={24} className="icon" />
          <span>Pomo Timer</span>
        </div>

        {/* Right side: Settings Button */}
        <div className="ml-auto">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Pomodoro settings"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Timer display */}
      <div className="text-4xl sm:text-5xl font-mono mb-6 text-center" role="timer" aria-label="Current pomodoro time">
        {formatPomoTime(pomoState.timeLeft)}
      </div>

      {/* Time adjustment buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => handleTimeAdjustment(-600)}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Subtract 10 minutes"
        >
          -10
        </button>
        <button
          onClick={() => handleTimeAdjustment(-300)}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Subtract 5 minutes"
        >
          -5
        </button>
        <button
          onClick={() => handleTimeAdjustment(300)}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Add 5 minutes"
        >
          +5
        </button>
        <button
          onClick={() => handleTimeAdjustment(600)}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Add 10 minutes"
        >
          +10
        </button>
      </div>

      {/* Timer controls */}
      <div className="timer-controls flex justify-center items-center gap-3">
        <button
          onClick={handleReset}
          className="control-button flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Reset timer"
        >
          <RotateCcw size={20} style={{ color: "var(--accent-primary)" }} />
        </button>
        {!pomoState.isRunning ? (
          <button
            onClick={handleStart}
            className="control-button flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Start timer"
          >
            <Play size={20} style={{ color: "var(--accent-primary)" }} />
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="control-button flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Pause timer"
          >
            <Pause size={20} style={{ color: "var(--accent-primary)" }} />
          </button>
        )}
      </div>

      {/* Modo actual: Work, Break o Long Break */}
      <div className="flex items-center justify-center mb-4 text-lg font-bold px-4 py-1 rounded text-[var(--text-secondary)]">
        <span>
          {pomoState.currentMode === 'work' && 'Work'}
          {pomoState.currentMode === 'break' && 'Break'}
          {pomoState.currentMode === 'longBreak' && 'Long Break'}
        </span>
      </div>

      {/* Add Pomodoro Settings Modal */}
      <PomodoroSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentModeIndex={pomoState.modeIndex}
        modes={modes}
        onModeChange={handleModeChange}
        onSaveCustomMode={handleSaveCustomMode}
        workSessionsBeforeLongBreak={pomoState.workSessionsBeforeLongBreak}
        onWorkSessionsChange={handleWorkSessionsChange}
      />
    </div>
  );
};

export default Pomodoro; 