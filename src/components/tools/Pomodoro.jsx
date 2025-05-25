import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  AlarmClockCheck,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-toastify";
import { useTheme } from "../../utils/ThemeContext";
import { colorClasses, hoverClasses } from "../../utils/colors";
import { useEventListener } from 'usehooks-ts'
import PropTypes from 'prop-types';
import { formatPomoTime } from "../../hooks/useTimers";

const workSound = new Audio("/sounds/pomo-end.mp3");
const breakSound = new Audio("/sounds/break-end.mp3");

const MODES = [
  { label: "50/10", work: 50 * 60, break: 10 * 60 },
  { label: "25/5", work: 25 * 60, break: 5 * 60 },
  { label: "90/30", work: 90 * 60, break: 30 * 60 },
];

// Unified timer hook for synchronization
function useSynchronizedTimer(callback, isRunning, duration, mode = 'countdown') {
  const rafRef = useRef();
  const savedCallback = useRef();
  const startTimeRef = useRef(null);
  const accumulatedTimeRef = useRef(0);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    if (!isRunning) {
      return;
    }

    // Set start time when timer begins
    if (startTimeRef.current === null) {
      startTimeRef.current = performance.now();
    }

    const tick = (currentTime) => {
      const elapsed = (currentTime - startTimeRef.current) / 1000;
      const totalTime = accumulatedTimeRef.current + elapsed;
      
      if (mode === 'countdown') {
        const remaining = Math.max(0, duration - totalTime);
        savedCallback.current(remaining);
        
        if (remaining > 0) {
          rafRef.current = requestAnimationFrame(tick);
        }
      } else {
        // Stopwatch mode
        savedCallback.current(totalTime);
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isRunning, duration, mode]);

  // Handle pause/resume
  useEffect(() => {
    if (!isRunning && startTimeRef.current !== null) {
      // Timer was paused, save accumulated time
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      accumulatedTimeRef.current += elapsed;
      startTimeRef.current = null;
    }
  }, [isRunning]);

  // Reset function
  const reset = useCallback(() => {
    accumulatedTimeRef.current = 0;
    startTimeRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  }, []);

  return { reset };
}

const getLocal = (key, fallback) => {
  const value = localStorage.getItem(key);
  if (value === null || value === undefined) return fallback;
  if (typeof fallback === "boolean") return value === "true";
  if (typeof fallback === "number") return parseInt(value);
  return value;
};

const setLocal = (key, value) => localStorage.setItem(key, value.toString());

const sendNotification = (title, body) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "🍅" });
  }
};

function usePomodoroState() {
  const [modeIndex, setModeIndex] = useState(() => getLocal("pomodoroModeIndex", 0));
  const [mode, setMode] = useState(() => getLocal("pomodoroMode", "work"));
  const [timeLeft, setTimeLeft] = useState(() =>
    getLocal("pomodoroTimeLeft", MODES[modeIndex].work)
  );
  const [isRunning, setIsRunning] = useState(() => getLocal("pomodoroIsRunning", false));

  // Utilidad para obtener la fecha de hoy en formato YYYY-MM-DD
  const getToday = () => new Date().toISOString().slice(0, 10);

  // Obtener el contador de hoy desde localStorage
  const getTodayPomodoroCount = () => {
    const data = JSON.parse(localStorage.getItem("pomodoroDailyCount") || "{}");
    const today = getToday();
    return data[today] || 0;
  };

  // Guardar el contador actualizado
  const setTodayPomodoroCount = (count) => {
    const data = JSON.parse(localStorage.getItem("pomodoroDailyCount") || "{}");
    const today = getToday();
    data[today] = count;
    localStorage.setItem("pomodoroDailyCount", JSON.stringify(data));
  };

  const [pomodoroToday, setPomodoroToday] = useState(getTodayPomodoroCount());

  useEffect(() => {
    setTodayPomodoroCount(pomodoroToday);
  }, [pomodoroToday]);

  useEffect(() => {
    setLocal("pomodoroModeIndex", modeIndex);
    setLocal("pomodoroMode", mode);
    setLocal("pomodoroTimeLeft", timeLeft);
    setLocal("pomodoroIsRunning", isRunning);
    setLocal("pomodoroToday", pomodoroToday);
  }, [modeIndex, mode, timeLeft, isRunning, pomodoroToday]);

  const changeMode = useCallback(
    (newIndex) => {
      setModeIndex(newIndex);
      setMode("work");
      setTimeLeft(MODES[newIndex].work);
      setIsRunning(false);
    },
    []
  );

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(mode === "work" ? MODES[modeIndex].work : MODES[modeIndex].break);
    setMode("work");
    setPomodoroToday(0);
  }, [mode, modeIndex]);

  return {
    modeIndex,
    mode,
    timeLeft,
    isRunning,
    pomodoroToday,
    setModeIndex,
    setMode,
    setTimeLeft,
    setIsRunning,
    setPomodoroToday,
    changeMode,
    resetTimer,
  };
}

const TimerControlButton = ({ onClick, icon: Icon, label, className }) => (
  <button onClick={onClick} className={className} aria-label={label}>
    <Icon size={20} />
  </button>
);

const Pomodoro = ({ syncPomo = true }) => {
  const {
    modeIndex,
    mode,
    timeLeft,
    isRunning,
    pomodoroToday,
    setMode,
    setTimeLeft,
    setIsRunning,
    setPomodoroToday,
    changeMode,
  } = usePomodoroState();

  const { accentPalette } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Get current duration based on mode
  const currentDuration = mode === "work" ? MODES[modeIndex].work : MODES[modeIndex].break;

  // Use synchronized timer
  const { reset: resetTimer } = useSynchronizedTimer(
    (remaining) => {
      setTimeLeft(Math.floor(remaining));
    },
    isRunning,
    currentDuration,
    'countdown'
  );

  // Funciones de control
  const startPomodoro = () => {
    if (!isRunning) {
      setIsRunning(true);
    }
  };

  const pausePomodoro = () => {
    if (isRunning) {
      setIsRunning(false);
    }
  };

  const resetPomodoro = () => {
    setIsRunning(false);
    const initial = mode === "work" ? MODES[modeIndex].work : MODES[modeIndex].break;
    setTimeLeft(initial);
    resetTimer();
  };

  // Escucha los eventos de StudyTimer SOLO si syncPomo está activo
  useEventListener("playPomoSync", () => {
    if (syncPomo) {
      requestAnimationFrame(() => startPomodoro());
    }
  });

  useEventListener("pausePomoSync", () => {
    if (syncPomo) {
      requestAnimationFrame(() => pausePomodoro());
    }
  });

  useEventListener("resetPomoSync", () => {
    if (syncPomo) {
      requestAnimationFrame(() => resetPomodoro());
    }
  });

  // Solicitar permisos de notificación
  useEffect(() => {
    if ("Notification" in window) Notification.requestPermission();
  }, []);

  // Lógica de fin de ciclo
  useEffect(() => {
    if (timeLeft <= 0 && isRunning) {
      const sound =
        mode === "work"
          ? workSound.cloneNode(true)
          : breakSound.cloneNode(true);
      sound.play().catch(() => {}); // Handle play errors silently

      const message =
        mode === "work"
          ? "🍅 Pomodoro finished. ¡Take a break!"
          : "⏳ Break finished. ¡Time to work!";

      toast(message, { position: "top-right", autoClose: 4000, theme: "dark" });
      sendNotification("Pomodoro Timer", message);

      setTimeout(() => {
        if (mode === "work") {
          setMode("break");
          setTimeLeft(MODES[modeIndex].break);
          setPomodoroToday((prev) => prev + 1);
        } else {
          setMode("work");
          setTimeLeft(MODES[modeIndex].work);
        }
        resetTimer();
        setIsRunning(true);
      }, 100);
    }
  }, [timeLeft, mode, modeIndex, isRunning, setMode, setTimeLeft, setPomodoroToday, resetTimer]);

  // Manejo del menú
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // --- Render ---
  return (
    <div className="maincard flex flex-col h-full">
      {/* Header */}
      <div className="relative">
        <div className="cardtitle">
          <AlarmClockCheck size={24} className="mr-2" />
          <span>
            Pomo ({MODES[modeIndex].label})
            <span
              style={{
                color: "var(--accent-primary)",
                marginLeft: 8,
                fontWeight: 500,
              }}
            >
              [{mode === "work" ? "Work" : "Break"}]
            </span>
          </span>
        </div>
        <div className="absolute top-0 right-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors duration-200"
          >
            <span>Edit</span>
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>
          {menuOpen && (
            <div
              ref={menuRef}
              className="sort-menu absolute right-0 mt-2 w-35 bg-neutral-900 rounded-lg shadow-lg z-10 border border-neutral-800"
            >
              {MODES.map((m, index) => (
                <button
                  key={index}
                  onClick={() => changeMode(index)}
                  className={`block px-4 py-2 w-full text-center hover:bg-bg-tertiary transition-colors duration-200 ${
                    index === modeIndex ? "bg-bg-tertiary" : ""
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Contenido centrado */}
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="text-5xl font-mono mb-5 text-center">
          {formatPomoTime(timeLeft)}
        </div>
        <div className="flex justify-center space-x-4 mb-6">
          {!isRunning ? (
            <TimerControlButton
              onClick={() => {
                startPomodoro();
                if (syncPomo) {
                  window.dispatchEvent(new CustomEvent("playTimerSync"));
                }
              }}
              icon={Play}
              label="Play"
              className={`button ${colorClasses[accentPalette]} text-white hover:${hoverClasses[accentPalette]}`}
            />
          ) : (
            <TimerControlButton
              onClick={() => {
                pausePomodoro();
                if (syncPomo) {
                  window.dispatchEvent(new CustomEvent("pauseTimerSync"));
                }
              }}
              icon={Pause}
              label="Pause"
              className={`button ${colorClasses[accentPalette]} text-white hover:${hoverClasses[accentPalette]}`}
            />
          )}
          <TimerControlButton
            onClick={() => {
              resetPomodoro();
              if (syncPomo) {
                window.dispatchEvent(new CustomEvent("resetTimerSync"));
              }
            }}
            icon={RotateCcw}
            label="Reset"
            className={`button ${colorClasses[accentPalette]} text-white hover:${hoverClasses[accentPalette]}`}
          />
        </div>
        <div className="text-center text-lg font-medium">
          Completed Pomodoros: {pomodoroToday}
        </div>
      </div>
    </div>
  );
};

Pomodoro.propTypes = {
  syncPomo: PropTypes.bool,
};

export default Pomodoro;