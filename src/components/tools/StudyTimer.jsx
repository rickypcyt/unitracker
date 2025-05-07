import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "../../utils/supabaseClient";
import { resetTimerState, setCurrentSession } from "../../redux/LapSlice";
import {
    fetchLaps,
    createLap,
    updateLap,
    deleteLap,
} from "../../redux/LapActions";
import {
    Play,
    Pause,
    RotateCcw,
    Flag,
    Edit2,
    Check,
    Trash2,
    ChevronDown,
    ChevronUp,
    LibraryBig,
    X,
    Save,
    CheckCircle2,
    Circle,
} from "lucide-react";
import { motion } from "framer-motion";
import moment from "moment";
import { toast } from "react-toastify";

const StudyTimer = () => {
    const dispatch = useDispatch();
    const { laps, error, currentSession } = useSelector((state) => state.laps);

    const [showMonthsList, setShowMonthsList] = useState(false);

    const [state, setState] = useState(() => {
        // Load saved state from localStorage or use defaults
        const savedState = localStorage.getItem("studyTimerState");
        if (savedState) {
            const parsed = JSON.parse(savedState);
            return {
                ...parsed,
                localUser: null, // Don't restore user state, it will be loaded separately
                expandedMonths: {},
                expandedWeeks: {},
                selectedSession: null,
                isEditingDetails: false,
                editedSession: null,
                startPomodoro:
                    localStorage.getItem("startPomodoroWithTimer") === "true",
            };
        }
        return {
            isEditing: null,
            time: 0,
            isRunning: false,
            description: "",
            localUser: null,
            expandedMonths: {},
            expandedWeeks: {},
            selectedSession: null,
            isEditingDetails: false,
            editedSession: null,
            startPomodoro: true, // Changed to true by default
        };
    });

    const intervalRef = useRef(null);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        const stateToSave = {
            time: state.time,
            isRunning: state.isRunning,
            description: state.description,
            startPomodoro: state.startPomodoro,
        };
        localStorage.setItem("studyTimerState", JSON.stringify(stateToSave));
        localStorage.setItem(
            "startPomodoroWithTimer",
            state.startPomodoro.toString(),
        );
    }, [state.time, state.isRunning, state.description, state.startPomodoro]);

    // Set default value in localStorage on mount
    useEffect(() => {
        if (!localStorage.getItem("startPomodoroWithTimer")) {
            localStorage.setItem("startPomodoroWithTimer", "true");
        }
    }, []);

    // Restore timer if it was running
    useEffect(() => {
        if (state.isRunning) {
            intervalRef.current = setInterval(() => {
                setState((prev) => ({ ...prev, time: prev.time + 1 }));
            }, 1000);
            // Restart Pomodoro if it was enabled
            if (state.startPomodoro) {
                window.dispatchEvent(new CustomEvent("startPomodoro"));
            }
            // Update StartSessionMenu state
            window.dispatchEvent(
                new CustomEvent("studyTimerStateChanged", {
                    detail: { isRunning: true },
                }),
            );
        }
        return () => clearInterval(intervalRef.current);
    }, []); // Only run once on mount

    useEffect(() => {
        const loadUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            setState((prev) => ({ ...prev, localUser: user }));
            if (user) dispatch(fetchLaps());
        };
        loadUser();
    }, [dispatch]);

    // Add event listeners for StudyTimer control
    useEffect(() => {
        const handleStartStudyTimer = () => {
            timerControls.start();
        };

        const handleStopStudyTimer = () => {
            timerControls.pause();
        };

        const handlePomodoroPause = () => {
            if (state.startPomodoro) {
                timerControls.pause();
            }
        };

        const handlePomodoroReset = () => {
            if (state.startPomodoro) {
                timerControls.reset();
            }
        };

        const handlePomodoroPlay = () => {
            if (state.startPomodoro) {
                timerControls.start();
            }
        };

        window.addEventListener("startStudyTimer", handleStartStudyTimer);
        window.addEventListener("stopStudyTimer", handleStopStudyTimer);
        window.addEventListener("pomodoroPause", handlePomodoroPause);
        window.addEventListener("pomodoroReset", handlePomodoroReset);
        window.addEventListener("pomodoroPlay", handlePomodoroPlay);

        return () => {
            window.removeEventListener("startStudyTimer", handleStartStudyTimer);
            window.removeEventListener("stopStudyTimer", handleStopStudyTimer);
            window.removeEventListener("pomodoroPause", handlePomodoroPause);
            window.removeEventListener("pomodoroReset", handlePomodoroReset);
            window.removeEventListener("pomodoroPlay", handlePomodoroPlay);
        };
    }, [state.startPomodoro]);

    // Handle escape key to close modal
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape") {
                handleCloseSessionDetails();
            }
        };

        if (state.selectedSession) {
            window.addEventListener("keydown", handleEscape);
        }

        return () => {
            window.removeEventListener("keydown", handleEscape);
        };
    }, [state.selectedSession]);

    const toggleVisibility = (type, key) => {
        setState((prev) => ({
            ...prev,
            [`expanded${type}`]: {
                ...prev[`expanded${type}`],
                [key]: !prev[`expanded${type}`][key],
            },
        }));
    };

    const timerControls = {
        start: async () => {
            if (!state.isRunning) {
                const sessionNum = await getCurrentSessionNumber();
                dispatch(setCurrentSession(sessionNum));
                setState((prev) => ({ ...prev, isRunning: true }));
                intervalRef.current = setInterval(() => {
                    setState((prev) => ({ ...prev, time: prev.time + 1 }));
                }, 1000);
                // Start Pomodoro if checkbox is checked
                if (state.startPomodoro) {
                    window.dispatchEvent(new CustomEvent("startPomodoro"));
                }
                // Dispatch event to update StartSessionMenu state
                window.dispatchEvent(
                    new CustomEvent("studyTimerStateChanged", {
                        detail: { isRunning: true },
                    }),
                );
            }
        },
        pause: () => {
            clearInterval(intervalRef.current);
            setState((prev) => ({ ...prev, isRunning: false }));
            // Stop Pomodoro if it was started
            if (state.startPomodoro) {
                window.dispatchEvent(new CustomEvent("stopPomodoro"));
            }
            // Dispatch event to update StartSessionMenu state
            window.dispatchEvent(
                new CustomEvent("studyTimerStateChanged", {
                    detail: { isRunning: false },
                }),
            );
        },
        reset: () => {
            clearInterval(intervalRef.current);
            setState((prev) => ({
                ...prev,
                isRunning: false,
                time: 0,
                description: "",
            }));
            dispatch(resetTimerState());
            // Stop and reset Pomodoro if it was started
            if (state.startPomodoro) {
                window.dispatchEvent(new CustomEvent("stopPomodoro"));
                window.dispatchEvent(new CustomEvent("resetPomodoro"));
            }
            // Dispatch event to update StartSessionMenu state
            window.dispatchEvent(
                new CustomEvent("studyTimerStateChanged", {
                    detail: { isRunning: false },
                }),
            );
        },
    };

    const lapHandlers = {
        add: async () => {
            if (!currentSession) return;
            const lapNumber =
                laps.filter((l) => l.session_number === currentSession).length + 1;
            const lapData = {
                name: `Lap ${lapNumber}`,
                duration: formatTime(state.time),
                description: state.description,
                session_number: currentSession,
            };
            dispatch(createLap(lapData));
        },
        finish: async () => {
            if (!currentSession) return;
            const sessionData = {
                name: state.description || `Session ${currentSession}`,
                duration: formatTime(state.time),
                description: state.description,
                session_number: currentSession,
            };
            dispatch(createLap(sessionData));
            timerControls.reset();
        },
    };

    const getCurrentSessionNumber = async () => {
        const today = new Date().toISOString().split("T")[0];
        const { data, error } = await supabase
            .from("study_laps")
            .select("session_number")
            .gte("created_at", `${today}T00:00:00`)
            .lte("created_at", `${today}T23:59:59`)
            .order("session_number", { ascending: false })
            .limit(1);

        return error || !data.length ? 1 : data[0].session_number + 1;
    };

    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    const groupSessionsByMonthWeek = () => {
        return laps.reduce((groups, lap) => {
            const monthYear = getMonthYear(lap.created_at);
            const weekKey = getWeekKey(lap.created_at);

            groups[monthYear] = groups[monthYear] || {};
            groups[monthYear][weekKey] = groups[monthYear][weekKey] || [];
            groups[monthYear][weekKey].push(lap);

            return groups;
        }, {});
    };

    const getMonthYear = (date) => {
        const d = new Date(date);
        return `${d.toLocaleString("default", { month: "long" })} ${d.getFullYear()}`;
    };

    const getWeekKey = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((d - yearStart) / 86400000 / 7);
        return `Week ${weekNo}`;
    };

    const handleSessionDoubleClick = (session) => {
        setState((prev) => ({
            ...prev,
            selectedSession: session,
            editedSession: { ...session },
        }));
    };

    const handleCloseSessionDetails = () => {
        setState((prev) => ({
            ...prev,
            selectedSession: null,
            isEditingDetails: false,
            editedSession: null,
        }));
    };

    const handleStartEditingDetails = () => {
        setState((prev) => ({ ...prev, isEditingDetails: true }));
    };

    const handleSaveEditDetails = async () => {
        if (state.editedSession) {
            try {
                // Create update object with all necessary fields
                const updateData = {
                    name: state.editedSession.name,
                    description: state.editedSession.description || "", // Ensure description is at least an empty string
                    session_number: state.editedSession.session_number,
                    duration: state.editedSession.duration,
                };

                // Update in database through Redux action
                await dispatch(updateLap(state.editedSession.id, updateData));

                // Update local state
                setState((prev) => ({
                    ...prev,
                    isEditingDetails: false,
                    selectedSession: { ...state.editedSession },
                }));

                // Fetch updated laps to refresh the list
                await dispatch(fetchLaps());

                toast.success("Session updated successfully");
            } catch (error) {
                console.error("Error updating session:", error);
                toast.error("Failed to update session");
            }
        }
    };

    const handleEditChange = (field, value) => {
        setState((prev) => ({
            ...prev,
            editedSession: {
                ...prev.editedSession,
                [field]: value,
            },
        }));
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            handleCloseSessionDetails();
        }
    };

    const handlePomodoroToggle = (e) => {
        const newValue = e.target.checked;
        localStorage.setItem("startPomodoroWithTimer", newValue);
        setState((prev) => ({ ...prev, startPomodoro: newValue }));
    };

    // Detectar tema/accentPalette
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

    if (!state.localUser) {
        return (
            <div className="maincard">
                <h2 className="text-2xl font-bold mb-6">Study Timer</h2>
                <div className="plslogin">Please log in to use the Study Timer</div>
            </div>
        );
    }

    const groupedLaps = groupSessionsByMonthWeek();

    return (
        <div className="maincard">
            <div className="text-2xl font-bold mb-6 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <LibraryBig size={24} />
                    <span>Study Timer</span>
                </div>
                <div className="flex justify-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-lg text-text-secondary font-normal">
                            Sync with Pomodoro?
                        </span>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                handlePomodoroToggle({
                                    target: { checked: !state.startPomodoro },
                                });
                            }}
                            className="bg-transparent border-none cursor-pointer flex items-center rounded-full group"
                            aria-label={
                                state.startPomodoro ? "Disable Pomodoro" : "Enable Pomodoro"
                            }
                        >
                            {state.startPomodoro ? (
                                <CheckCircle2 size={24} style={{ color: iconColor }} />
                            ) : (
                                <Circle size={24} style={{ color: "var" }} />
                            )}
                        </button>
                    </label>
                </div>
            </div>

            {error && <div className="text-red-500 mb-4">{error}</div>}

            <div className="text-5xl font-mono mb-6 text-center">
                {formatTime(state.time)}
            </div>

            <div className="flex justify-center space-x-4 mb-6">
                {!state.isRunning ? (
                    <button
                        onClick={timerControls.start}
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
                        onClick={timerControls.pause}
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
                    onClick={timerControls.reset}
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
                <button
                    onClick={lapHandlers.add}
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
                    <Flag size={20} style={{ color: iconColor }} />
                </button>
                <button
                    onClick={lapHandlers.finish}
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
                    <Check size={20} style={{ color: iconColor }} />
                </button>
            </div>

            <div className="mb-4">
                <input
                    value={state.description}
                    onChange={(e) =>
                        setState((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Session title"
                    className="textinput"
                />
            </div>

            {/* Botón y lista de meses colapsable */}
            <div className="py-2">
                {" "}
                <button
                    className="infomenu"
                    onClick={() => setShowMonthsList(!showMonthsList)}
                >
                    <span className="text-xl">Months</span>
                    {showMonthsList ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </button>
            </div>

            {showMonthsList &&
                Object.entries(groupedLaps).map(([monthYear, weeks]) => (
                    <div className="mt-2">
                        {" "}
                        <div key={monthYear} className="mb-4">
                            <button
                                className="infomenu"
                                onClick={() => toggleVisibility("Months", monthYear)}
                            >
                                <span className="text-base">{monthYear}</span>
                                {state.expandedMonths[monthYear] ? (
                                    <ChevronUp size={22} />
                                ) : (
                                    <ChevronDown size={22} />
                                )}
                            </button>
                        </div>
                        {state.expandedMonths[monthYear] && (
                            <div className="space-y-4 mt-2">
                                {Object.entries(weeks).map(([weekKey, sessions]) => (
                                    <div key={`${monthYear}-${weekKey}`} className="mb-2 ml-4">
                                        <button
                                            className="flex items-center justify-between w-full py-2 px-3 bg-bg-tertiary rounded-lg text-left font-semibold hover:bg-bg-secondary transition-colors duration-200"
                                            onClick={() =>
                                                toggleVisibility("Weeks", `${monthYear}-${weekKey}`)
                                            }
                                        >
                                            <span>{weekKey}</span>
                                            {state.expandedWeeks[`${monthYear}-${weekKey}`] ? (
                                                <ChevronUp size={20} />
                                            ) : (
                                                <ChevronDown size={20} />
                                            )}
                                        </button>
                                        {state.expandedWeeks[`${monthYear}-${weekKey}`] &&
                                            sessions.map((lap) => (
                                                <div
                                                    key={lap.id}
                                                    className="flex items-center justify-between bg-bg-secondary p-3 rounded-lg mt-2 cursor-pointer hover:bg-bg-tertiary transition-colors duration-200"
                                                    onDoubleClick={() => handleSessionDoubleClick(lap)}
                                                >
                                                    <div className="flex-1">
                                                        <p className="text-lg text-text-secondary mb-1">
                                                            {moment(lap.created_at).format(
                                                                "MMM D, YYYY h:mm A",
                                                            )}
                                                        </p>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-lg text-accent-primary">
                                                                #{lap.session_number}
                                                            </span>
                                                            <span>{lap.name}</span>
                                                        </div>
                                                        {lap.description && (
                                                            <p className="text-lg text-text-secondary">
                                                                {lap.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-text-secondary text-lg">
                                                            {lap.duration}
                                                        </span>
                                                        <button
                                                            onClick={() => dispatch(deleteLap(lap.id))}
                                                            className="text-red-500 transition-all duration-200 hover:text-red-600 hover:scale-110"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

            {/* Session Details Modal */}
            {state.selectedSession && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm"
                    onClick={handleOverlayClick}
                >
                    <div className="maincard max-w-2xl w-full mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-center flex-1">
                                Session Details
                            </h3>
                            <div className="flex items-center gap-2">
                                {state.isEditingDetails ? (
                                    <button
                                        onClick={handleSaveEditDetails}
                                        className="text-green-500 hover:text-green-600 transition duration-200 flex items-center gap-2"
                                    >
                                        <Save size={20} />
                                        Save
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleStartEditingDetails}
                                        className="text-accent-primary hover:text-accent-secondary transition duration-200 flex items-center gap-2"
                                    >
                                        <Edit2 size={20} />
                                        Edit
                                    </button>
                                )}
                                <button
                                    className="text-gray-400 hover:text-white transition duration-200"
                                    onClick={handleCloseSessionDetails}
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-lg font-semibold text-text-primary mb-2">
                                    Title
                                </h4>
                                {state.isEditingDetails ? (
                                    <input
                                        type="text"
                                        value={state.editedSession.name}
                                        onChange={(e) => handleEditChange("name", e.target.value)}
                                        className="w-full bg-bg-surface border border-border-primary rounded px-3 py-2 text-text-primary"
                                    />
                                ) : (
                                    <p className="text-text-secondary">
                                        {state.selectedSession.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <h4 className="text-lg font-semibold text-text-primary mb-2">
                                    Description
                                </h4>
                                {state.isEditingDetails ? (
                                    <textarea
                                        value={state.editedSession.description || ""}
                                        onChange={(e) =>
                                            handleEditChange("description", e.target.value)
                                        }
                                        className="w-full bg-bg-surface border border-border-primary rounded px-3 py-2 text-text-primary min-h-[100px]"
                                        placeholder="Add a description..."
                                    />
                                ) : (
                                    <p className="text-text-secondary whitespace-pre-wrap">
                                        {state.selectedSession.description || "No description"}
                                    </p>
                                )}
                            </div>

                            <div>
                                <h4 className="text-lg font-semibold text-text-primary mb-2">
                                    Duration
                                </h4>
                                <p className="text-text-secondary">
                                    {state.selectedSession.duration}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-lg font-semibold text-text-primary mb-2">
                                    Created At
                                </h4>
                                <p className="text-text-secondary">
                                    {moment(state.selectedSession.created_at).format(
                                        "MMMM D, YYYY h:mm A",
                                    )}
                                </p>
                            </div>

                            <div className="flex justify-end gap-4 mt-6">
                                <button
                                    onClick={() => dispatch(deleteLap(state.selectedSession.id))}
                                    className="text-red-500 hover:text-red-600 transition-colors duration-200 flex items-center gap-2"
                                >
                                    <Trash2 size={20} />
                                    Delete Session
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default StudyTimer;
