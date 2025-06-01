import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

import { formatPomoTime } from "../../hooks/useTimers";
import toast from "react-hot-toast";
import useEventListener from "../../hooks/useEventListener";
import { useTheme } from "../../utils/ThemeContext";

const MODES = [
  { label: "50/10", work: 50 * 60, break: 10 * 60 },
  { label: "25/5", work: 25 * 60, break: 5 * 60 },
  { label: "90/30", work: 90 * 60, break: 30 * 60 },
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
  const { iconColor } = useTheme();
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [pomoState, setPomoState] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    const savedState = localStorage.getItem("pomodoroState");
    const defaultModeIndex = 0;
    const defaultMode = "work";
    const defaultTimeLeft = MODES[defaultModeIndex][defaultMode];

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
      }, 100);
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
    if (pomoState.isRunning) {
      // Si está corriendo, actualizamos el tiempo y el startTime
      setPomoState(prev => ({
        ...prev,
        timeLeft: Math.max(0, prev.timeLeft + adjustment),
        startTime: now / 1000,
        pausedTime: 0
      }));
    } else {
      // Si está en pausa, solo actualizamos el tiempo
      setPomoState(prev => ({
        ...prev,
        timeLeft: Math.max(0, prev.timeLeft + adjustment)
      }));
    }
  }, [pomoState.isRunning]);

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
    const modeDuration = MODES[pomoState.modeIndex][pomoState.currentMode];
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
    const modeDuration = MODES[pomoState.modeIndex][pomoState.currentMode];
    setPomoState(prev => ({
      ...prev,
      isRunning: false,
      timeLeft: modeDuration,
      startTime: 0,
      pausedTime: 0
    }));
  }, [pomoState.modeIndex, pomoState.currentMode]);

  const handleModeChange = useCallback((index) => {
    setPomoState(prev => ({
      ...prev,
      modeIndex: index,
      timeLeft: MODES[index][prev.currentMode],
      isRunning: false,
    }));
  }, []);

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
      timeLeft: MODES[prev.modeIndex][isWork ? "break" : "work"],
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
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex items-center gap-2 mb-6">
        <Timer size={24} />
        <h2 className="text-xl font-semibold">Pomodoro Timer</h2>
      </div>

      {/* Mode selection buttons */}
      <div className="flex gap-2 mb-6">
        {MODES.map((mode, index) => (
          <button
            key={mode.label}
            onClick={() => handleModeChange(index)}
            className={`px-3 py-1 rounded-lg transition-colors ${
              pomoState.modeIndex === index
                ? "bg-accent-primary text-white"
                : "bg-neutral-800 text-neutral-400 hover:text-white"
            }`}
            aria-label={`Set ${mode.label} mode`}
          >
            {mode.label}
          </button>
        ))}
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
            if (pomoState.isRunning) {
              // Si está corriendo, actualizamos el tiempo y el startTime
              setPomoState(prev => ({
                ...prev,
                timeLeft: Math.max(0, prev.timeLeft + adjustment),
                startTime: now / 1000,
                pausedTime: 0
              }));
            } else {
              setPomoState(prev => ({
                ...prev,
                timeLeft: Math.max(0, prev.timeLeft + adjustment)
              }));
            }
          }}
          className="px-3 py-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          aria-label="Subtract 10 minutes"
        >
          -10
        </button>
        <button
          onClick={() => {
            const adjustment = -300;
            const now = Date.now();
            if (pomoState.isRunning) {
              setPomoState(prev => ({
                ...prev,
                timeLeft: Math.max(0, prev.timeLeft + adjustment),
                startTime: now / 1000,
                pausedTime: 0
              }));
            } else {
              setPomoState(prev => ({
                ...prev,
                timeLeft: Math.max(0, prev.timeLeft + adjustment)
              }));
            }
          }}
          className="px-3 py-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          aria-label="Subtract 5 minutes"
        >
          -5
        </button>
        <button
          onClick={() => {
            const adjustment = 300;
            const now = Date.now();
            if (pomoState.isRunning) {
              setPomoState(prev => ({
                ...prev,
                timeLeft: prev.timeLeft + adjustment,
                startTime: now / 1000,
                pausedTime: 0
              }));
            } else {
              setPomoState(prev => ({
                ...prev,
                timeLeft: prev.timeLeft + adjustment
              }));
            }
          }}
          className="px-3 py-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          aria-label="Add 5 minutes"
        >
          +5
        </button>
        <button
          onClick={() => {
            const adjustment = 600;
            const now = Date.now();
            if (pomoState.isRunning) {
              setPomoState(prev => ({
                ...prev,
                timeLeft: prev.timeLeft + adjustment,
                startTime: now / 1000,
                pausedTime: 0
              }));
            } else {
              setPomoState(prev => ({
                ...prev,
                timeLeft: prev.timeLeft + adjustment
              }));
            }
          }}
          className="px-3 py-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          aria-label="Add 10 minutes"
        >
          +10
        </button>
      </div>

      <div className="timer-controls">
        <button
          onClick={handleReset}
          className="control-button w-10 h-10 flex items-center justify-center"
          aria-label="Reset timer"
        >
          <RotateCcw size={20} style={{ color: iconColor }} />
        </button>
        {!pomoState.isRunning ? (
          <button
            onClick={handleStart}
            className="control-button w-10 h-10 flex items-center justify-center"
            aria-label="Start timer"
          >
            <Play size={20} style={{ color: iconColor }} />
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="control-button w-10 h-10 flex items-center justify-center"
            aria-label="Pause timer"
          >
            <Pause size={20} style={{ color: iconColor }} />
          </button>
        )}
      </div>

      <div className="mt-4 text-base text-neutral-400">
        {pomoState.currentMode === "work" ? "Work Time" : "Break Time"}
      </div>
      <div className="text-base text-neutral-400">
        Pomodoros Today: {pomoState.pomodoroToday}
      </div>
      {notificationPermission !== "granted" && (
        <button
          onClick={async () => {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
          }}
          className="mt-2 text-sm text-accent-primary hover:text-accent-primary/80"
        >
          Enable Notifications
        </button>
      )}
    </div>
  );
};

export default Pomodoro; 