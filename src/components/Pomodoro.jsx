import { useState, useEffect, useRef } from "react";
import {
    Play,
    Pause,
    RotateCcw,
    AlarmClockCheck,
    ChevronDown,
} from "lucide-react";
import { toast } from "react-toastify";

const workSound = new Audio("/sounds/pomo-end.mp3");
const breakSound = new Audio("/sounds/break-end.mp3");

const MODES = [
    { label: "50/10", work: 50 * 60, break: 10 * 60 },
    { label: "25/5", work: 25 * 60, break: 5 * 60 },
    { label: "90/30", work: 90 * 60, break: 30 * 60 },
];

const Pomodoro = () => {
    const [modeIndex, setModeIndex] = useState(() => {
        const savedModeIndex = localStorage.getItem("pomodoroModeIndex");
        return savedModeIndex ? parseInt(savedModeIndex) : 0;
    });
    const [mode, setMode] = useState(() => {
        const savedMode = localStorage.getItem("pomodoroMode");
        return savedMode || "work";
    });
    const [timeLeft, setTimeLeft] = useState(() => {
        const savedTimeLeft = localStorage.getItem("pomodoroTimeLeft");
        return savedTimeLeft ? parseInt(savedTimeLeft) : MODES[modeIndex].work;
    });
    const [isRunning, setIsRunning] = useState(() => {
        const savedIsRunning = localStorage.getItem("pomodoroIsRunning");
        return savedIsRunning === "true";
    });
    const [pomodoroCount, setPomodoroCount] = useState(() => {
        const savedCount = localStorage.getItem("pomodoroCount");
        return savedCount ? parseInt(savedCount) : 0;
    });
    const [menuOpen, setMenuOpen] = useState(false);
    const intervalRef = useRef(null);
    const menuRef = useRef(null);

    // Obtener la paleta de acentos del localStorage (con soporte para SSR)
    const accentPalette =
        typeof window !== "undefined"
            ? localStorage.getItem("accentPalette") || "blue"
            : "blue";

    // Determinar el color del ícono según la paleta
    const iconColor =
        accentPalette === "white"
            ? "#000000" // Negro para white
            : accentPalette === "gray"
                ? "#ffffff" // Blanco para gray
                : "#ffffff"; // Blanco para otras paletas (blue, green, etc.)
    // Save state to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("pomodoroModeIndex", modeIndex.toString());
        localStorage.setItem("pomodoroMode", mode);
        localStorage.setItem("pomodoroTimeLeft", timeLeft.toString());
        localStorage.setItem("pomodoroIsRunning", isRunning.toString());
        localStorage.setItem("pomodoroCount", pomodoroCount.toString());
    }, [modeIndex, mode, timeLeft, isRunning, pomodoroCount]);

    // 🔔 Solicitar permiso para notificaciones al cargar la página
    useEffect(() => {
        if ("Notification" in window) {
            Notification.requestPermission();
        }
    }, []);

    // 📌 Función para enviar notificación al sistema
    const sendNotification = (title, body) => {
        if (Notification.permission === "granted") {
            new Notification(title, { body, icon: "🍅" });
        }
    };

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(
                () => setTimeLeft((prev) => prev - 1),
                1000,
            );
        }
        return () => clearInterval(intervalRef.current);
    }, [isRunning, timeLeft]);

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

            // 🚀 Notificación visual con react-toastify
            toast(message, { position: "top-right", autoClose: 4000, theme: "dark" });

            // 🔔 Notificación al sistema
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
    }, [timeLeft, mode, modeIndex]);

    const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
    };

    const handleOutsideClick = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
            setMenuOpen(false);
        }
    };

    useEffect(() => {
        // Cerrar el menú cuando se haga clic fuera de él
        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);

    // Add event listeners for external control
    useEffect(() => {
        const handleStartPomodoro = () => {
            setIsRunning(true);
        };

        const handleStopPomodoro = () => {
            setIsRunning(false);
        };

        const handleResetPomodoro = () => {
            setIsRunning(false);
            setTimeLeft(MODES[modeIndex].work);
            setMode("work");
            setPomodoroCount(0);
        };

        window.addEventListener("startPomodoro", handleStartPomodoro);
        window.addEventListener("stopPomodoro", handleStopPomodoro);
        window.addEventListener("resetPomodoro", handleResetPomodoro);

        return () => {
            window.removeEventListener("startPomodoro", handleStartPomodoro);
            window.removeEventListener("stopPomodoro", handleStopPomodoro);
            window.removeEventListener("resetPomodoro", handleResetPomodoro);
        };
    }, [modeIndex]);

    return (
        <div className="maincard">
            <div className="relative">
                <div className="text-2xl font-bold mb-6 flex items-center">
                    <div className="flex items-center">
                        <AlarmClockCheck size={24} className="mr-2" />
                        <span className="text-2xl font-bold">
                            Pomodoro ({MODES[modeIndex].label})
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
                                    onClick={() => {
                                        setModeIndex(index);
                                        setMode("work");
                                        setTimeLeft(MODES[index].work);
                                        setIsRunning(false);
                                        setMenuOpen(false);
                                    }}
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
            <div className="text-5xl font-mono mb-4 text-center">
                {formatTime(timeLeft)}
            </div>

            <div className="flex justify-center space-x-4 mb-6">
                {!isRunning ? (
                    <button
                        onClick={() => {
                            setIsRunning(true);
                            window.dispatchEvent(new CustomEvent("pomodoroPlay"));
                        }}
                        className="button"
                        style={{
                            color: "var(--text-primary)",
                            backgroundColor: "var(--accent-primary)",
                        }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "var(--accent-hover)")
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "var(--accent-primary)")
                        }
                    >
                        <Play size={20} style={{ color: iconColor }} />
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            setIsRunning(false);
                            window.dispatchEvent(new CustomEvent("pomodoroPause"));
                        }}
                        className="button"
                        style={{
                            color: "var(--text-primary)",
                            backgroundColor: "var(--accent-primary)",
                        }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "var(--accent-hover)")
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "var(--accent-primary)")
                        }
                    >
                        <Pause size={20} style={{ color: iconColor }} />
                    </button>
                )}
                <button
                    onClick={() => {
                        setIsRunning(false);
                        setTimeLeft(
                            mode === "work" ? MODES[modeIndex].work : MODES[modeIndex].break,
                        );
                        window.dispatchEvent(new CustomEvent("pomodoroReset"));
                    }}
                    className="button"
                    style={{
                        color: "var(--text-primary)",
                        backgroundColor: "var(--accent-primary)",
                    }}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "var(--accent-hover)")
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "var(--accent-primary)")
                    }
                >
                    <RotateCcw size={20} style={{ color: iconColor }} />
                </button>
            </div>

            <div className="text-center text-lg font-medium">
                Completed Pomodoros: {pomodoroCount}
            </div>
        </div>
    );
};

export default Pomodoro;
