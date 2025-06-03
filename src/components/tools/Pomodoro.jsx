import { CheckSquare, MoreVertical, Pause, Play, RotateCcw, Square, Timer } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

import PomodoroSettingsModal from "../modals/PomodoroSettingsModal";
import { formatPomoTime } from "../../hooks/useTimers";
import toast from "react-hot-toast";
import useEventListener from "../../hooks/useEventListener";
import useTheme from "../../hooks/useTheme";

// Initial modes
const INITIAL_MODES = [
  { label: "50/10", work: 50 * 60, break: 10 * 60 },
  { label: "25/5", work: 25 * 60, break: 5 * 60 },
  { label: "90/30", work: 90 * 60, break: 30 * 60 },
  { label: "Custom", work: 45 * 60, break: 15 * 60 }, // Add default custom mode
];

// Preload sounds
const sounds = {
  work: new Audio("/sounds/pomo-end.mp3"),
  break: new Audio("/sounds/break-end.mp3")
};

// Initialize sounds
Object.values(sounds).forEach(sound => {
  sound.load();
  sound.volume = 0.5;
});

const Pomodoro = () => {
  const { accentPalette } = useTheme();
  const iconColor = accentPalette === "#ffffff" ? "#000000" : "#ffffff";
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
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

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        return {
          modeIndex: Number(parsed.modeIndex) || defaultModeIndex,
          currentMode: parsed.currentMode || defaultMode,
          timeLeft: Number(parsed.timeLeft) || defaultTimeLeft,
          isRunning: localStorage.getItem("pomodoroIsRunning") === "true",
          pomodoroToday: parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || "0"),
          startTime: Number(parsed.startTime) || 0,
          pausedTime: Number(parsed.pausedTime) || 0,
        };
      } catch (error) {
        console.error('Error parsing saved state:', error);
        return {
          modeIndex: defaultModeIndex,
          currentMode: defaultMode,
          timeLeft: defaultTimeLeft,
          isRunning: false,
          pomodoroToday: 0,
          startTime: 0,
          pausedTime: 0,
        };
      }
    }
    return {
      modeIndex: defaultModeIndex,
      currentMode: defaultMode,
      timeLeft: defaultTimeLeft,
      isRunning: false,
      pomodoroToday: 0,
      startTime: 0,
      pausedTime: 0,
    };
  });

  // Add state to track sync status from StudyTimer
  const [isSyncedWithStudyTimer, setIsSyncedWithStudyTimer] = useState(() => {
    // Initialize sync state from localStorage on load
    const savedState = localStorage.getItem('isSyncedWithStudyTimer');
    return savedState ? JSON.parse(savedState) : false;
  });

  // Add event listener for sync state changes from StudyTimer
  useEventListener("studyTimerSyncStateChanged", (event) => {
    setIsSyncedWithStudyTimer(event.detail.isSyncedWithStudyTimer);
  }, []);

  // Add event listener for study timer time updates
  useEventListener("studyTimerTimeUpdate", (event) => {
    if (!isSyncedWithStudyTimer) return;
    
    const studyTime = Math.floor(event.detail.time); // Redondear a segundos completos
    const currentMode = modes[pomoState.modeIndex];
    const totalWorkTime = currentMode.work;
    const totalBreakTime = currentMode.break;
    
    // Calculate total cycle time
    const totalCycleTime = totalWorkTime + totalBreakTime;
    
    // Calculate position within the current cycle, asegurando que sea exacto
    const positionInCycle = studyTime % totalCycleTime;
    
    // Determine if we should be in work or break mode
    // Ajustamos la comparación para que sea exacta en el segundo 0
    const shouldBeWorkMode = positionInCycle < totalWorkTime;
    
    // Solo cambiar de modo si estamos exactamente en el punto de transición
    const isTransitionPoint = positionInCycle === 0 || positionInCycle === totalWorkTime;
    
    if (isTransitionPoint && shouldBeWorkMode !== (pomoState.currentMode === "work")) {
      setPomoState(prev => ({
        ...prev,
        currentMode: shouldBeWorkMode ? "work" : "break",
        timeLeft: shouldBeWorkMode ? totalWorkTime : totalBreakTime,
        // Si estamos cambiando a modo trabajo, incrementar el contador
        pomodoroToday: shouldBeWorkMode ? prev.pomodoroToday + 1 : prev.pomodoroToday
      }));

      // Play sound and show notification when switching modes
      const sound = sounds[shouldBeWorkMode ? "break" : "work"];
      sound.currentTime = 0;
      sound.play().catch(console.error);

      // Show toast notification
      if (shouldBeWorkMode) {
        toast.success("Break is over! Let's get back to work! 💪", {
          duration: 3000,
          position: 'top-center',
        });
      } else {
        toast.success("Work session complete! Time for a break.");
      }

      // Show browser notification if permission is granted
      if ("Notification" in window && notificationPermission === "granted") {
        const notification = new Notification(
          shouldBeWorkMode ? "Break Complete! ⏰" : "Work Session Complete! 🎉", 
          {
            body: shouldBeWorkMode 
              ? "Break is over! Time to get back to work."
              : "Great job! Time to take a well-deserved break.",
            icon: shouldBeWorkMode ? "💪" : "🍅",
            badge: shouldBeWorkMode ? "💪" : "🍅",
            tag: "pomodoro-notification",
            requireInteraction: true,
            silent: false,
            vibrate: [200, 100, 200]
          }
        );

        // Close notification after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        // Handle notification click
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    }

    // Update timeLeft based on position in cycle, asegurando que sea exacto
    const maxTime = shouldBeWorkMode ? totalWorkTime : totalBreakTime;
    const timeLeft = shouldBeWorkMode 
      ? Math.min(maxTime, totalWorkTime - positionInCycle)
      : Math.min(maxTime, totalBreakTime - (positionInCycle - totalWorkTime));

    setPomoState(prev => ({
      ...prev,
      timeLeft: Math.max(0, timeLeft)
    }));
  }, [isSyncedWithStudyTimer, modes, pomoState.modeIndex, pomoState.currentMode, notificationPermission]);

  // Add state for settings modal
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Save modes to localStorage when they change
  useEffect(() => {
    localStorage.setItem("pomodoroModes", JSON.stringify(modes));
  }, [modes]);

  // Guardar estado en localStorage cuando cambie
  useEffect(() => {
    const stateToSave = {
      modeIndex: pomoState.modeIndex,
      currentMode: pomoState.currentMode,
      timeLeft: pomoState.timeLeft,
      startTime: pomoState.startTime,
      pausedTime: pomoState.pausedTime,
    };
    localStorage.setItem("pomodoroState", JSON.stringify(stateToSave));
    localStorage.setItem("pomodoroIsRunning", pomoState.isRunning.toString());
  }, [pomoState]);

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

  // Event listeners
  useEventListener("startPomodoro", () => handleStart(), []);
  useEventListener("pauseTimerSync", () => {
    if (pomoState.isRunning) {
      handleStop();
    }
  }, [pomoState.isRunning]);
  useEventListener("stopPomodoro", () => handleStop(), []);
  useEventListener("resetPomodoro", () => handleReset(), []);
  useEventListener("playTimerSync", () => {
    if (!pomoState.isRunning) {
      handleStart();
    }
  }, [pomoState.isRunning]);

  // Add event listener for time adjustments
  useEventListener("adjustPomodoroTime", (event) => {
    const { adjustment } = event.detail;
    const now = Date.now();
    const currentMode = modes[pomoState.modeIndex];
    const maxTime = currentMode[pomoState.currentMode];
    
    if (pomoState.isRunning) {
      // Si está corriendo, actualizamos el tiempo y el startTime
      setPomoState(prev => {
        const newTimeLeft = Math.max(0, Math.min(prev.timeLeft + adjustment, maxTime));
        return {
          ...prev,
          timeLeft: newTimeLeft,
          startTime: now / 1000,
          pausedTime: 0
        };
      });
    } else {
      // Si está en pausa, solo actualizamos el tiempo
      setPomoState(prev => ({
        ...prev,
        timeLeft: Math.max(0, Math.min(prev.timeLeft + adjustment, maxTime))
      }));
    }
  }, [pomoState.isRunning, modes, pomoState.modeIndex, pomoState.currentMode]);

  // Request notification permission on component mount
  useEffect(() => {
    const requestNotificationPermission = async () => {
      if (!("Notification" in window)) {
        console.log("This browser does not support notifications");
        return;
      }

      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
      }
    };

    requestNotificationPermission();
  }, []);

  const handleStart = useCallback(() => {
    const modeDuration = modes[pomoState.modeIndex][pomoState.currentMode];
    setPomoState(prev => ({ 
      ...prev, 
      isRunning: true,
      startTime: Date.now() / 1000,
      pausedTime: 0,
      timeLeft: prev.pausedTime > 0 ? prev.timeLeft : modeDuration
    }));
  }, [pomoState.modeIndex, pomoState.currentMode]);

  const handleStop = useCallback(() => {
    setPomoState(prev => ({ 
      ...prev, 
      isRunning: false,
      pausedTime: Date.now() / 1000
    }));
  }, []);

  const handleReset = useCallback(() => {
    const modeDuration = modes[pomoState.modeIndex][pomoState.currentMode];
    setPomoState(prev => ({
      ...prev,
      isRunning: false,
      timeLeft: modeDuration,
      startTime: 0,
      pausedTime: 0
    }));
  }, [pomoState.modeIndex, pomoState.currentMode]);

  const handleModeChange = useCallback((index) => {
    // Ensure index is within bounds
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
      // Find the custom mode (it should always be the last one)
      const customModeIndex = newModes.length - 1;
      // Update the custom mode
      newModes[customModeIndex] = customMode;
      // Switch to the custom mode
      handleModeChange(customModeIndex);
      return newModes;
    });
  }, [handleModeChange]);

  const handlePomodoroComplete = useCallback(() => {
    const isWork = pomoState.currentMode === "work";
    const sound = sounds[isWork ? "work" : "break"];
    
    // Play sound
    sound.currentTime = 0;
    sound.play().catch(console.error);

    // Update state
    setPomoState(prev => ({
      ...prev,
      currentMode: isWork ? "break" : "work",
      timeLeft: modes[prev.modeIndex][isWork ? "break" : "work"],
      pomodoroToday: isWork ? prev.pomodoroToday + 1 : prev.pomodoroToday,
    }));

    // Show toast notification
    if (isWork) {
      toast.success("Work session complete! Time for a break.");
    } else {
      toast.success("Break is over! Let's get back to work! 💪", {
        duration: 3000,
        position: 'top-center',
      });
    }

    // Show browser notification if permission is granted
    if ("Notification" in window && notificationPermission === "granted") {
      const notification = new Notification(
        isWork ? "Work Session Complete! 🎉" : "Break Complete! ⏰", 
        {
          body: isWork 
            ? "Great job! Time to take a well-deserved break." 
            : "Break is over! Time to get back to work.",
          icon: isWork ? "🍅" : "💪",
          badge: isWork ? "🍅" : "💪",
          tag: "pomodoro-notification",
          requireInteraction: true,
          silent: false,
          vibrate: [200, 100, 200]
        }
      );

      // Close notification after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }, [pomoState.currentMode, pomoState.modeIndex, notificationPermission]);

  return (
    <div className="flex flex-col items-center h-full">
      {/* Header: Icon, Title, Settings Button */}
      <div className="flex items-center w-full mb-6">
        {/* Left side: Icon and Title */}
        <div className="flex items-center gap-2">
          <Timer size={24} />
          <h2 className="text-xl font-semibold ">Pomo Timer</h2>
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
          onClick={() => {
            const adjustment = -600;
            const now = Date.now();
            const currentMode = modes[pomoState.modeIndex];
            const maxTime = currentMode[pomoState.currentMode];
            
            if (pomoState.isRunning) {
              setPomoState(prev => ({
                ...prev,
                timeLeft: Math.max(0, Math.min(prev.timeLeft + adjustment, maxTime)),
                startTime: now / 1000,
                pausedTime: 0
              }));
            } else {
              setPomoState(prev => ({
                ...prev,
                timeLeft: Math.max(0, Math.min(prev.timeLeft + adjustment, maxTime))
              }));
            }
          }}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Subtract 10 minutes"
        >
          -10
        </button>
        <button
          onClick={() => {
            const adjustment = -300;
            const now = Date.now();
            const currentMode = modes[pomoState.modeIndex];
            const maxTime = currentMode[pomoState.currentMode];
            
            if (pomoState.isRunning) {
              setPomoState(prev => ({
                ...prev,
                timeLeft: Math.max(0, Math.min(prev.timeLeft + adjustment, maxTime)),
                startTime: now / 1000,
                pausedTime: 0
              }));
            } else {
              setPomoState(prev => ({
                ...prev,
                timeLeft: Math.max(0, Math.min(prev.timeLeft + adjustment, maxTime))
              }));
            }
          }}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Subtract 5 minutes"
        >
          -5
        </button>
        <button
          onClick={() => {
            const adjustment = 300;
            const now = Date.now();
            const currentMode = modes[pomoState.modeIndex];
            const maxTime = currentMode[pomoState.currentMode];
            
            if (pomoState.isRunning) {
              setPomoState(prev => ({
                ...prev,
                timeLeft: Math.max(0, Math.min(prev.timeLeft + adjustment, maxTime)),
                startTime: now / 1000,
                pausedTime: 0
              }));
            } else {
              setPomoState(prev => ({
                ...prev,
                timeLeft: Math.max(0, Math.min(prev.timeLeft + adjustment, maxTime))
              }));
            }
          }}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Add 5 minutes"
        >
          +5
        </button>
        <button
          onClick={() => {
            const adjustment = 600;
            const now = Date.now();
            const currentMode = modes[pomoState.modeIndex];
            const maxTime = currentMode[pomoState.currentMode];
            
            if (pomoState.isRunning) {
              setPomoState(prev => ({
                ...prev,
                timeLeft: Math.max(0, Math.min(prev.timeLeft + adjustment, maxTime)),
                startTime: now / 1000,
                pausedTime: 0
              }));
            } else {
              setPomoState(prev => ({
                ...prev,
                timeLeft: Math.max(0, Math.min(prev.timeLeft + adjustment, maxTime))
              }));
            }
          }}
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

      <div className="mt-4 text-base text-[var(--text-secondary)] mb-1">
        {pomoState.currentMode === "work" ? "Work Time" : "Break Time"}
      </div>
      <div className="text-base text-[var(--text-secondary)] mb-1">
        Pomodoros Today: {pomoState.pomodoroToday}
      </div>

      {/* Sync with StudyTimer toggle */}
      <div className="flex items-center gap-2 justify-center mb-4">
        <label className="flex items-center gap-2 text-[var(--text-secondary)] cursor-pointer" onClick={() => {
          const newSyncState = !isSyncedWithStudyTimer;
          setIsSyncedWithStudyTimer(newSyncState);
          localStorage.setItem('isSyncedWithStudyTimer', JSON.stringify(newSyncState));
          window.dispatchEvent(new CustomEvent("studyTimerSyncStateChanged", { 
            detail: { isSyncedWithStudyTimer: newSyncState } 
          }));
        }}>
          <span>Sync with Study Timer:</span>
          {isSyncedWithStudyTimer ? <CheckSquare size={20} style={{ color: "var(--accent-primary)" }} /> : <Square size={20} style={{ color: "var(--accent-primary)" }} />}
        </label>
      </div>

      {notificationPermission !== "granted" && (
        <button
          onClick={async () => {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
          }}
          className="mt-2 text-sm text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80"
        >
          Enable Notifications
        </button>
      )}

      {/* Add Pomodoro Settings Modal */}
      <PomodoroSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentModeIndex={pomoState.modeIndex}
        modes={modes}
        onModeChange={handleModeChange}
        onSaveCustomMode={handleSaveCustomMode}
      />
    </div>
  );
};

export default Pomodoro; 