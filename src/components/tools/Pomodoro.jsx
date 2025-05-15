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

const workSound = new Audio("/sounds/pomo-end.mp3");
const breakSound = new Audio("/sounds/break-end.mp3");

const MODES = [
  { label: "50/10", work: 50 * 60, break: 10 * 60 },
  { label: "25/5", work: 25 * 60, break: 5 * 60 },
  { label: "90/30", work: 90 * 60, break: 30 * 60 },
];

// --- Utilidades DRY ---
const getLocal = (key, fallback) => {
  const value = localStorage.getItem(key);
  if (value === null || value === undefined) return fallback;
  if (typeof fallback === "boolean") return value === "true";
  if (typeof fallback === "number") return parseInt(value);
  return value;
};

const setLocal = (key, value) => localStorage.setItem(key, value.toString());

const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

const sendNotification = (title, body) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "🍅" });
  }
};

// --- Custom Hook (Single Responsibility) ---
function usePomodoroState() {
  const [modeIndex, setModeIndex] = useState(() => getLocal("pomodoroModeIndex", 0));
  const [mode, setMode] = useState(() => getLocal("pomodoroMode", "work"));
  const [timeLeft, setTimeLeft] = useState(() =>
    getLocal("pomodoroTimeLeft", MODES[modeIndex].work)
  );
  const [isRunning, setIsRunning] = useState(() => getLocal("pomodoroIsRunning", false));
  const [pomodoroCount, setPomodoroCount] = useState(() => getLocal("pomodoroCount", 0));

  // Persistir en localStorage
  useEffect(() => {
    setLocal("pomodoroModeIndex", modeIndex);
    setLocal("pomodoroMode", mode);
    setLocal("pomodoroTimeLeft", timeLeft);
    setLocal("pomodoroIsRunning", isRunning);
    setLocal("pomodoroCount", pomodoroCount);
  }, [modeIndex, mode, timeLeft, isRunning, pomodoroCount]);

  // Cambiar modo y resetear tiempo
  const changeMode = useCallback(
    (newIndex) => {
      setModeIndex(newIndex);
      setMode("work");
      setTimeLeft(MODES[newIndex].work);
      setIsRunning(false);
    },
    []
  );

  // Resetear temporizador
  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(mode === "work" ? MODES[modeIndex].work : MODES[modeIndex].break);
    setMode("work");
    setPomodoroCount(0);
  }, [mode, modeIndex]);

  return {
    modeIndex,
    mode,
    timeLeft,
    isRunning,
    pomodoroCount,
    setModeIndex,
    setMode,
    setTimeLeft,
    setIsRunning,
    setPomodoroCount,
    changeMode,
    resetTimer,
  };
}

// --- Botones DRY ---
const TimerControlButton = ({ onClick, icon: Icon, label, className }) => (
  <button onClick={onClick} className={className} aria-label={label}>
    <Icon size={20} />
  </button>
);

// --- Componente principal ---
const Pomodoro = () => {
  const { accentPalette, iconColor } = useTheme();
  const {
    modeIndex,
    mode,
    timeLeft,
    isRunning,
    pomodoroCount,
    setModeIndex,
    setMode,
    setTimeLeft,
    setIsRunning,
    setPomodoroCount,
    changeMode,
    resetTimer,
  } = usePomodoroState();

  const [menuOpen, setMenuOpen] = useState(false);
  const intervalRef = useRef(null);
  const menuRef = useRef(null);

  // Solicitar permiso de notificaciones
  useEffect(() => {
    if ("Notification" in window) Notification.requestPermission();
  }, []);

  // Temporizador
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  // Al llegar a cero
  useEffect(() => {
    if (timeLeft === 0) {
      const sound =
        mode === "work"
          ? workSound.cloneNode(true)
          : breakSound.cloneNode(true);
      sound.play();

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
          setPomodoroCount((prev) => prev + 1);
        } else {
          setMode("work");
          setTimeLeft(MODES[modeIndex].work);
        }
        setIsRunning(true);
      }, 100);
    }
  }, [timeLeft, mode, modeIndex, setMode, setTimeLeft, setPomodoroCount, setIsRunning]);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Eventos externos
  useEffect(() => {
    const handleStart = () => setIsRunning(true);
    const handleStop = () => setIsRunning(false);
    const handleReset = () => resetTimer();

    window.addEventListener("startPomodoro", handleStart);
    window.addEventListener("stopPomodoro", handleStop);
    window.addEventListener("resetPomodoro", handleReset);
    return () => {
      window.removeEventListener("startPomodoro", handleStart);
      window.removeEventListener("stopPomodoro", handleStop);
      window.removeEventListener("resetPomodoro", handleReset);
    };
  }, [resetTimer]);

  // --- Render ---
  return (
    <div className="maincard">
      <div className="relative">
        <div className="text-2xl font-bold mb-6 flex items-center">
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
            className="flex items-center gap-2 px-3 py-1.5 bg-bg-surface hover:bg-bg-tertiary rounded-lg transition-colors duration-200"
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
              className="absolute right-0 mt-2 w-32 bg-bg-surface rounded-lg shadow-lg z-10 border border-border-primary"
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
      <div className="text-5xl font-mono mb-4 text-center">
        {formatTime(timeLeft)}
      </div>
      <div className="flex justify-center space-x-4 mb-6">
        {!isRunning ? (
          <TimerControlButton
            onClick={() => {
              setIsRunning(true);
              window.dispatchEvent(new CustomEvent("pomodoroPlay"));
            }}
            icon={Play}
            label="Play"
            className={`button ${colorClasses[accentPalette]} text-white hover:${hoverClasses[accentPalette]}`}
          />
        ) : (
          <TimerControlButton
            onClick={() => {
              setIsRunning(false);
              window.dispatchEvent(new CustomEvent("pomodoroPause"));
            }}
            icon={Pause}
            label="Pause"
            className={`button ${colorClasses[accentPalette]} text-white hover:${hoverClasses[accentPalette]}`}
          />
        )}
        <TimerControlButton
          onClick={() => {
            setIsRunning(false);
            setTimeLeft(mode === "work" ? MODES[modeIndex].work : MODES[modeIndex].break);
            window.dispatchEvent(new CustomEvent("pomodoroReset"));
          }}
          icon={RotateCcw}
          label="Reset"
          className={`button ${colorClasses[accentPalette]} text-white hover:${hoverClasses[accentPalette]}`}
        />
      </div>
      <div className="text-center text-lg font-medium">
        Completed Pomodoros: {pomodoroCount}
      </div>
    </div>
  );
};

export default Pomodoro;
