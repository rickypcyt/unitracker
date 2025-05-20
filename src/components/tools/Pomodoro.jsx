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

function usePomodoroState() {
  const [modeIndex, setModeIndex] = useState(() => getLocal("pomodoroModeIndex", 0));
  const [mode, setMode] = useState(() => getLocal("pomodoroMode", "work"));
  const [timeLeft, setTimeLeft] = useState(() =>
    getLocal("pomodoroTimeLeft", MODES[modeIndex].work)
  );
  const [isRunning, setIsRunning] = useState(() => getLocal("pomodoroIsRunning", false));
  const [pomodoroCount, setPomodoroCount] = useState(() => getLocal("pomodoroCount", 0));

  useEffect(() => {
    setLocal("pomodoroModeIndex", modeIndex);
    setLocal("pomodoroMode", mode);
    setLocal("pomodoroTimeLeft", timeLeft);
    setLocal("pomodoroIsRunning", isRunning);
    setLocal("pomodoroCount", pomodoroCount);
  }, [modeIndex, mode, timeLeft, isRunning, pomodoroCount]);

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

const TimerControlButton = ({ onClick, icon: Icon, label, className }) => (
  <button onClick={onClick} className={className} aria-label={label}>
    <Icon size={20} />
  </button>
);

const Pomodoro = () => {
  const { accentPalette } = useTheme();
  const {
    modeIndex,
    mode,
    timeLeft,
    isRunning,
    pomodoroCount,
    setMode,
    setTimeLeft,
    setIsRunning,
    setPomodoroCount,
    changeMode,
    resetTimer,
  } = usePomodoroState();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Precise timer references
  const startTimestamp = useRef(null);
  const lastTimeLeft = useRef(timeLeft);
  const intervalRef = useRef(null);
  const lastHiddenTime = useRef(null);

  // Solicitar permisos de notificación
  useEffect(() => {
    if ("Notification" in window) Notification.requestPermission();
  }, []);

  // Manejo del temporizador preciso
  useEffect(() => {
    if (isRunning) {
      // Si es la primera vez o tras pausa, calcula el timestamp de inicio
      if (!startTimestamp.current) {
        startTimestamp.current = Date.now() - (MODES[modeIndex][mode] - lastTimeLeft.current) * 1000;
      }
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimestamp.current) / 1000);
        const newTime = MODES[modeIndex][mode] - elapsed;
        setTimeLeft(newTime > 0 ? newTime : 0);
        lastTimeLeft.current = newTime > 0 ? newTime : 0;
      }, 250);
    } else {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      startTimestamp.current = null;
    }
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line
  }, [isRunning, mode, modeIndex]);

  // Ajuste al cambiar de pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        lastHiddenTime.current = Date.now();
      } else if (lastHiddenTime.current && isRunning) {
        const hiddenDuration = Date.now() - lastHiddenTime.current;
        // Ajusta el timestamp de inicio para compensar el tiempo oculto
        startTimestamp.current += hiddenDuration;
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    // eslint-disable-next-line
  }, [isRunning]);

  // Lógica de fin de ciclo
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
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
          lastTimeLeft.current = MODES[modeIndex].break;
          startTimestamp.current = null;
          setPomodoroCount((prev) => prev + 1);
        } else {
          setMode("work");
          setTimeLeft(MODES[modeIndex].work);
          lastTimeLeft.current = MODES[modeIndex].work;
          startTimestamp.current = null;
        }
        setIsRunning(true);
      }, 100);
    }
    // eslint-disable-next-line
  }, [timeLeft, mode, modeIndex, setMode, setTimeLeft, setPomodoroCount, setIsRunning]);

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
                  className={`block px-4 py-2 w-full text-center hover:bg-bg-tertiary transition-colors duration-200 ${index === modeIndex ? "bg-bg-tertiary" : ""
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
              lastTimeLeft.current = mode === "work" ? MODES[modeIndex].work : MODES[modeIndex].break;
              startTimestamp.current = null;
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
    </div>
  );
};

export default Pomodoro;
