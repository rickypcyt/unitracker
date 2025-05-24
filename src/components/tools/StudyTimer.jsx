// src/components/StudyTimer.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "../../utils/supabaseClient";
import { resetTimerState, setCurrentSession } from "../../redux/LapSlice";
import { fetchLaps, createLap, updateLap, deleteLap } from "../../redux/LapActions";
import { Play, Pause, RotateCcw, Flag, Edit2, Check, Trash2, ChevronDown, ChevronUp, LibraryBig, X, Save, CheckCircle2, Circle, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import moment from "moment";
import { toast } from "react-toastify";
import { useTheme } from "../../utils/ThemeContext";
import { colorClasses, hoverClasses } from "../../utils/colors";
import { useStudyTimer, formatTime, getMonthYear } from "../../hooks/useTimers";
import useEventListener from "../../hooks/useEventListener";


const StudyTimer = () => {

    const { accentPalette, iconColor } = useTheme();
    const dispatch = useDispatch();
    const { laps, error, currentSession } = useSelector((state) => state.laps);

    const [showMonthsList, setShowMonthsList] = useState(false);

    const [state, setState] = useState(() => {
        const savedState = localStorage.getItem("studyTimerState");
        if (savedState) {
            const parsed = JSON.parse(savedState);
            let time = parsed.timeAtStart || 0;
            if (parsed.isRunning && parsed.lastStart) {
                time += (performance.now() - parsed.lastStart) / 1000;
            }
            return {
                ...parsed,
                time,
                localUser: null,
                expandedMonths: {},
                selectedSession: null,
                isEditingDetails: false,
                editedSession: null,
                syncPomo: localStorage.getItem("syncPomoWithTimer") === "true",
                lastStart: parsed.lastStart || null,
                timeAtStart: parsed.timeAtStart || 0,
            };
        }
        return {
            isEditing: null,
            time: 0,
            isRunning: false,
            description: "",
            localUser: null,
            expandedMonths: {},
            selectedSession: null,
            isEditingDetails: false,
            editedSession: null,
            syncPomo: true,
            lastStart: null,
            timeAtStart: 0,
        };
    });

    // Save state to localStorage whenever it changes
    useEffect(() => {
        const stateToSave = {
            time: state.time,
            isRunning: state.isRunning,
            description: state.description,
            syncPomo: state.syncPomo,
            lastStart: state.lastStart,      // <-- Añadido
            timeAtStart: state.timeAtStart,  // <-- Añadido
        };
        localStorage.setItem("studyTimerState", JSON.stringify(stateToSave));
        localStorage.setItem("syncPomoWithTimer", state.syncPomo.toString());
    }, [
        state.time,
        state.isRunning,
        state.description,
        state.syncPomo,
        state.lastStart,
        state.timeAtStart,
    ]);

    const [isRunning, setIsRunning] = useState(false);
    const [startTime, setStartTime] = useState(() => {
        const saved = localStorage.getItem("interval_start");
        return saved ? parseInt(saved, 10) : null;
    });

    useEffect(() => {
        if (isRunning && !startTime) {
            const now = performance.now();
            setStartTime(now);
            localStorage.setItem("interval_start", now);
        }
    }, [isRunning, startTime]);

    useEffect(() => {
        if (!localStorage.getItem("syncPomoWithTimer")) {
            localStorage.setItem("syncPomoWithTimer", "true");
        }
    }, []);

    // Restore timer if it was running
    const tick = useCallback((elapsed) => {
        setState(prev => ({
            ...prev,
            time: elapsed,
        }));
    }, []);


    useStudyTimer(
        tick,
        state.isRunning,
        state.timeAtStart,
        state.lastStart
    );



    useEffect(() => {
        const loadUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setState((prev) => ({ ...prev, localUser: user }));
            if (user) dispatch(fetchLaps());
        };
        loadUser();
    }, [dispatch]);



    useEventListener("startStudyTimer", () => timerControls.start(), [state.syncPomo]);
    useEventListener("stopStudyTimer", () => timerControls.pause(), [state.syncPomo]);
    useEventListener("pauseTimerSync", () => { if (state.syncPomo) timerControls.pause(); }, [state.syncPomo]);
    useEventListener("resetTimerSync", () => { if (state.syncPomo) timerControls.reset(); }, [state.syncPomo]);
    useEventListener("playTimerSync", () => { if (state.syncPomo) timerControls.start(); }, [state.syncPomo]);

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
                setState((prev) => ({
                    ...prev,
                    isRunning: true,
                    lastStart: performance.now(),        // Marca el momento de inicio/reanudación
                    timeAtStart: prev.time,       // Guarda el tiempo acumulado antes de este inicio
                }));
                if (state.syncPomo) {
                    window.dispatchEvent(new CustomEvent("playPomoSync"));
                }
                window.dispatchEvent(
                    new CustomEvent("studyTimerStateChanged", { detail: { isRunning: true } })
                );
            }
        },
        pause: () => {
            if (state.isRunning) {
                setState((prev) => {
                    const now = performance.now();
                    const elapsed = prev.timeAtStart + ((now - prev.lastStart) / 1000);
                    return {
                        ...prev,
                        isRunning: false,
                        time: elapsed,           // Actualiza el tiempo total acumulado
                        lastStart: null,         // Limpia el marcador de inicio
                        timeAtStart: elapsed,    // Actualiza el acumulado para la próxima reanudación
                    };
                });
                if (state.syncPomo) {
                    window.dispatchEvent(new CustomEvent("pausePomoSync"));
                }
                window.dispatchEvent(
                    new CustomEvent("studyTimerStateChanged", { detail: { isRunning: false } })
                );
            }
        },
        reset: () => {
            setState((prev) => ({
                ...prev,
                isRunning: false,
                time: 0,
                description: "",
                lastStart: null,
                timeAtStart: 0,
            }));

            dispatch(resetTimerState());

            localStorage.removeItem("interval_start");
            localStorage.removeItem("interval_elapsed");

            if (state.syncPomo) {
                window.dispatchEvent(new CustomEvent("resetPomoSync"));
            }
            window.dispatchEvent(
                new CustomEvent("studyTimerStateChanged", { detail: { isRunning: false } })
            );
        },
    };


    const lapHandlers = {
        add: async () => {
            if (!currentSession) return;
            const lapNumber = laps.filter((l) => l.session_number === currentSession).length + 1;
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

    const changeTime = (deltaSeconds) => {
        setState((prev) => {
            let newTime = prev.time + deltaSeconds;
            if (newTime < 0) newTime = 0;
            return { ...prev, time: newTime };
        });
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

    const groupSessionsByMonth = () => {
        return laps.reduce((groups, lap) => {
            const monthYear = getMonthYear(lap.created_at);
            if (!groups[monthYear]) {
                groups[monthYear] = [];
            }
            groups[monthYear].push(lap);
            return groups;
        }, {});
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
                const updateData = {
                    name: state.editedSession.name,
                    description: state.editedSession.description || "",
                    session_number: state.editedSession.session_number,
                    duration: state.editedSession.duration,
                };
                await dispatch(updateLap(state.editedSession.id, updateData));
                setState((prev) => ({
                    ...prev,
                    isEditingDetails: false,
                    selectedSession: { ...state.editedSession },
                }));
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
        const newValue = e.target.checked ?? !state.syncPomo;
        localStorage.setItem("syncPomoWithTimer", newValue);
        setState((prev) => ({ ...prev, syncPomo: newValue }));
    };

    if (!state.localUser) {
        return (
            <div className="maincard">
                <h2 className="text-2xl font-bold mb-12">Session</h2>
                <div className="plslogin">Please log in to use the Study Timer</div>
            </div>
        );
    }

    const groupedLaps = groupSessionsByMonth();

    return (
        <div className="maincard">
            <div className="text-2xl font-bold mb-6 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <LibraryBig size={24} />
                    <span>Session</span>
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
                                    target: { checked: !state.syncPomo },
                                });
                            }}
                            className="bg-transparent border-none cursor-pointer flex items-center rounded-full group"
                            aria-label={
                                state.syncPomo ? "Disable Pomodoro" : "Enable Pomodoro"
                            }
                        >
                            {state.syncPomo ? (
                                <CheckCircle2 size={24} style={{ color: "var(--accent-primary)" }} />) : (
                                <Circle size={24} style={{ color: "var(--accent-primary)" }} />)}
                        </button>
                    </label>
                </div>
            </div>

            {error && <div className="text-red-500 mb-4">{error}</div>}

            <div className="text-5xl font-mono mb-6 text-center">
                {formatTime(Math.max(0, Math.ceil(state.time)), false)}
            </div>

            <div className="flex justify-center space-x-4 mb-8">
                <button
                    onClick={timerControls.reset}
                    className={`button ${colorClasses[accentPalette]} text-white hover:${hoverClasses[accentPalette]} `}

                >
                    <RotateCcw size={20} style={{ color: iconColor }} />
                </button>
                <button
                    onClick={() => changeTime(-600)}
                    className={`button ${colorClasses[accentPalette]} text-white hover:${hoverClasses[accentPalette]} flex items-center justify-center gap-1 text-lg font-bold`}
                    title="Rewind 10 mins"
                >
                    -10
                </button>
                <button
                    onClick={() => changeTime(-300)}
                    className={`button ${colorClasses[accentPalette]} text-white hover:${hoverClasses[accentPalette]} flex items-center justify-center gap-1 text-lg font-bold`}
                    title="Rewind 5 mins"
                >
                    -5
                </button>

                {!state.isRunning ? (
                    <button
                        onClick={() => {
                            timerControls.start(); // Tu lógica local
                            if (state.syncPomo) {
                                window.dispatchEvent(new CustomEvent("studyPlay"));
                            }
                        }}
                        className={`button ${colorClasses[accentPalette]} text-white hover:${hoverClasses[accentPalette]}`}
                    >
                        <Play size={20} style={{ color: iconColor }} />
                    </button>

                ) : (
                    <button
                        onClick={timerControls.pause}
                        className={`button ${colorClasses[accentPalette]} text-white hover:${hoverClasses[accentPalette]} `}

                    >
                        <Pause size={20} style={{ color: iconColor }} />
                    </button>
                )}
                <button
                    onClick={() => changeTime(300)}
                    className={`button ${colorClasses[accentPalette]} text-white hover:${hoverClasses[accentPalette]} flex items-center justify-center gap-1 text-lg font-bold`}
                    title="Add 5 mins"
                >
                    +5
                </button>
                <button
                    onClick={() => changeTime(600)}
                    className={`button ${colorClasses[accentPalette]} text-white hover:${hoverClasses[accentPalette]} flex items-center justify-center gap-1 text-lg font-bold`}
                    title="Add 10 mins"
                >
                    +10
                </button>



                <button
                    onClick={lapHandlers.finish}
                    className={`button ${colorClasses[accentPalette]} text-white hover:${hoverClasses[accentPalette]} `}

                >
                    <Check size={20} style={{ color: iconColor }} />
                </button>
            </div>

            <div className="py-4">
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
            <div className="py-4">
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
                Object.entries(groupedLaps).map(([monthYear, lapsOfMonth]) => (
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
                        {state.expandedMonths[monthYear] && (
                            <div className="space-y-4 mt-3">
                                {lapsOfMonth.length === 0 ? (
                                    <div className="text-gray-400 ml-4">No logs this month</div>
                                ) : (
                                    lapsOfMonth.map((lap) => (
                                        <div
                                            key={lap.id}
                                            className="mt-2 ml-4 relative p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg border-2 border-border-primary mx-auto"
                                            onDoubleClick={() => handleSessionDoubleClick(lap)}
                                        >
                                            <div className="flex justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-lg text-accent-primary">
                                                            #{lap.session_number} {lap.name}
                                                        </span>
                                                    </div>
                                                    <p className="text-lg text-text-secondary mb-1">
                                                        {moment(lap.created_at).format("MMM D, YYYY h:mm A")}
                                                    </p>
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
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                ))
            }



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
