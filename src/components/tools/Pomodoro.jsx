import React, { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { useTheme } from "../../utils/ThemeContext";
import { formatPomoTime } from "../../hooks/useTimers";
import useEventListener from "../../hooks/useEventListener";
import { toast } from "react-toastify";

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
  const [pomoState, setPomoState] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      modeIndex: parseInt(localStorage.getItem("pomodoroModeIndex") || "0"),
      currentMode: localStorage.getItem("pomodoroCurrentMode") || "work",
      timeLeft: parseInt(localStorage.getItem("pomodoroTimeLeft") || MODES[0].work),
      isRunning: localStorage.getItem("pomodoroIsRunning") === "true",
      pomodoroToday: parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || "0"),
    };
  });

  // Save state to localStorage
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("pomodoroModeIndex", pomoState.modeIndex);
    localStorage.setItem("pomodoroCurrentMode", pomoState.currentMode);
    if (!pomoState.isRunning) {
      localStorage.setItem("pomodoroTimeLeft", pomoState.timeLeft);
    }
    localStorage.setItem("pomodoroIsRunning", pomoState.isRunning);
    localStorage.setItem(`pomodoroDailyCount_${today}`, pomoState.pomodoroToday);
  }, [pomoState]);

  // Timer logic
  useEffect(() => {
    let interval;
    if (pomoState.isRunning && pomoState.timeLeft > 0) {
      interval = setInterval(() => {
        setPomoState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (pomoState.timeLeft === 0) {
      handlePomodoroComplete();
    }
    return () => clearInterval(interval);
  }, [pomoState.isRunning, pomoState.timeLeft]);

  // Event listeners
  useEventListener("startPomodoro", () => handleStart(), []);
  useEventListener("pauseTimerSync", () => handleStop(), []);
  useEventListener("stopPomodoro", () => handleStop(), []);
  useEventListener("resetPomodoro", () => handleReset(), []);

  const handleStart = useCallback(() => {
    setPomoState(prev => ({ ...prev, isRunning: true }));
  }, []);

  const handleStop = useCallback(() => {
    setPomoState(prev => ({ ...prev, isRunning: false }));
  }, []);

  const handleReset = useCallback(() => {
    setPomoState(prev => ({
      ...prev,
      isRunning: false,
      timeLeft: MODES[prev.modeIndex][prev.currentMode],
    }));
  }, []);

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

    // Show notification
    toast.success(isWork ? "Work session complete! Time for a break." : "Break complete! Ready for next work session?");

    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(isWork ? "Work Session Complete!" : "Break Complete!", {
        body: isWork ? "Time for a break!" : "Ready for next work session?",
        icon: "🍅",
      });
    }
  }, [pomoState.currentMode, pomoState.modeIndex]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex items-center gap-2 mb-6">
        <Timer size={24} />
        <h2 className="text-xl font-semibold">Pomodoro Timer</h2>
      </div>

      <div className="text-4xl sm:text-5xl font-mono mb-6 text-center" role="timer" aria-label="Current pomodoro time">
        {formatPomoTime(pomoState.timeLeft)}
      </div>

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
    </div>
  );
};

export default Pomodoro; 