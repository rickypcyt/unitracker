import {
  MoreVertical,
  Pause,
  Play,
  RefreshCw,
  RefreshCwOff,
  RotateCcw,
  Check,
  X,
} from "lucide-react";
import { formatStudyTime, useStudyTimer } from "@/hooks/useTimers";
import { resetTimerState, setCurrentSession } from "@/store/slices/LapSlice";
import {
  setStudyRunning,
  setStudyTimerState,
  setSyncCountdownWithTimer,
  setSyncPomodoroWithTimer,
} from "@/store/slices/uiSlice";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import DeleteSessionModal from "@/modals/DeleteSessionModal";
import EditSessionModal from "@/modals/EditSessionModal";
import FinishSessionModal from "@/modals/FinishSessionModal";
import LoginPromptModal from "@/modals/LoginPromptModal";
import SectionTitle from "@/components/SectionTitle";
import SessionSummaryModal from "@/modals/SessionSummaryModal";
import StartSessionModal from "@/modals/StartSessionModal";
import { supabase } from "@/utils/supabaseClient";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import useEventListener from "@/hooks/useEventListener";
import { useLapRealtimeSubscription } from "@/hooks/useLapRealtimeSubscription";

// Constantes
const STORAGE_KEYS = {
  STUDY_TIMER_STATE: "studyTimerState",
  ACTIVE_SESSION_ID: "activeSessionId",
  STUDY_TIMER_STARTED_AT: "studyTimerStartedAt",
  SYNCED_WITH_STUDY_TIMER: "isSyncedWithStudyTimer",
  LAST_SESSIONS_RESET: "lastSessionsReset",
  SESSIONS_TODAY_COUNT: "sessionsTodayCount",
  POMODOROS_THIS_SESSION: "pomodorosThisSession",
};

const TIME_ADJUSTMENTS = {
  MINUS_TEN: -600,
  MINUS_FIVE: -300,
  PLUS_FIVE: 300,
  PLUS_TEN: 600,
};

const SYNC_EVENTS = {
  PLAY_TIMER: "playTimerSync",
  PAUSE_TIMER: "pauseTimerSync",
  RESET_TIMER: "resetTimerSync",
  PLAY_POMODORO: "playPomodoroSync",
  PAUSE_POMODORO: "pausePomodoroSync",
  RESET_POMODORO: "resetPomodoroSync",
  PLAY_COUNTDOWN: "playCountdownSync",
  PAUSE_COUNTDOWN: "pauseCountdownSync",
  RESET_COUNTDOWN: "resetCountdownSync",
  STUDY_TIMER_TIME_UPDATE: "studyTimerTimeUpdate",
  STUDY_TIMER_STATE_CHANGED: "studyTimerStateChanged",
  STUDY_TIMER_SYNC_STATE_CHANGED: "studyTimerSyncStateChanged",
  ADJUST_POMODORO_TIME: "adjustPomodoroTime",
  ADJUST_COUNTDOWN_TIME: "adjustCountdownTime",
  GLOBAL_TIMER_SYNC: "globalTimerSync",
  GLOBAL_RESET_SYNC: "globalResetSync",
  REFRESH_STATS: "refreshStats",
  FINISH_SESSION: "finishSession",
};

// Utilidades
const safeNumber = (value, defaultValue = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : defaultValue;

const parseStoredState = (savedState, defaultState) => {
  if (!savedState) return defaultState;

  try {
    const parsed = JSON.parse(savedState);
    return {
      ...defaultState,
      time: safeNumber(Number(parsed.time)),
      isRunning:
        typeof parsed.isRunning === "boolean" ? parsed.isRunning : false,
      lastStart: parsed.lastStart ? safeNumber(Number(parsed.lastStart)) : null,
      timeAtStart: safeNumber(Number(parsed.timeAtStart)),
      sessionStatus: ["inactive", "active", "paused"].includes(
        parsed.sessionStatus
      )
        ? parsed.sessionStatus
        : "inactive",
      sessionTitle:
        typeof parsed.sessionTitle === "string" ? parsed.sessionTitle : "",
      sessionDescription:
        typeof parsed.sessionDescription === "string"
          ? parsed.sessionDescription
          : "",
    };
  } catch {
    console.error("Error parsing saved state, using defaults");
    return defaultState;
  }
};

const saveToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(
      key,
      typeof value === "string" ? value : JSON.stringify(value)
    );
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
  }
};

const getFromLocalStorage = (key, defaultValue = null) => {
  try {
    const value = localStorage.getItem(key);
    return value
      ? defaultValue !== null
        ? JSON.parse(value)
        : value
      : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key}:`, e);
    return defaultValue;
  }
};

// Custom hooks
const useTimestamp = () => {
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(null);

  const isNewTimestamp = useCallback(
    (timestamp) => {
      if (lastSyncTimestamp === timestamp) return false;
      setLastSyncTimestamp(timestamp);
      return true;
    },
    [lastSyncTimestamp]
  );

  return { isNewTimestamp, setLastSyncTimestamp };
};

const useStudyState = () => {
  const defaultState = {
    time: 0,
    isRunning: false,
    lastStart: null,
    timeAtStart: 0,
    sessionStatus: "inactive",
    sessionTitle: "",
    sessionDescription: "",
    lastPausedAt: null,
  };

  const [studyState, setStudyState] = useState(() => {
    const savedState = getFromLocalStorage(STORAGE_KEYS.STUDY_TIMER_STATE);
    return parseStoredState(savedState, defaultState);
  });

  const updateStudyState = useCallback((updates) => {
    setStudyState((prev) => ({ ...prev, ...updates }));
  }, []);

  return [studyState, updateStudyState, setStudyState];
};

const useSessionId = () => {
  const [currentSessionId, setCurrentSessionId] = useState(() =>
    getFromLocalStorage(STORAGE_KEYS.ACTIVE_SESSION_ID)
  );

  const updateSessionId = useCallback((id) => {
    setCurrentSessionId(id);
    if (id) {
      saveToLocalStorage(STORAGE_KEYS.ACTIVE_SESSION_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
    }
  }, []);

  return [currentSessionId, updateSessionId];
};

const useModalStates = () => {
  const [modalStates, setModalStates] = useState({
    isStartModalOpen: false,
    isFinishModalOpen: false,
    isLoginPromptOpen: false,
    isSummaryOpen: false,
    isEditModalOpen: false,
    isDeleteModalOpen: false,
  });

  const updateModal = useCallback((modalName, isOpen) => {
    setModalStates((prev) => ({ ...prev, [modalName]: isOpen }));
  }, []);

  return [modalStates, updateModal];
};

const useSyncStates = () => {
  const syncPomodoroWithTimer = useSelector(
    (state) => state.ui.syncPomodoroWithTimer
  );
  const syncCountdownWithTimer = useSelector(
    (state) => state.ui.syncCountdownWithTimer
  );

  return {
    isPomodoroSync: syncPomodoroWithTimer,
    isCountdownSync: syncCountdownWithTimer,
  };
};

const StudyTimer = ({ onSyncChange, isSynced }) => {
  const { isLoggedIn } = useAuth();
  const dispatch = useDispatch();
  const isStudyRunningRedux = useSelector((state) => state.ui.isStudyRunning);

  const [studyState, updateStudyState, setStudyState] = useStudyState();
  const [currentSessionId, updateSessionId] = useSessionId();
  const [modalStates, updateModal] = useModalStates();
  const { isPomodoroSync, isCountdownSync } = useSyncStates();
  const { isNewTimestamp } = useTimestamp();

  const [summaryData, setSummaryData] = useState({
    duration: "00:00:00",
    tasksCount: 0,
    pomodoros: 0,
  });
  const [isHandlingEvent] = useState(false);
  const [, setSessionsTodayCount] = useState(0);
  const [isSyncedWithStudyTimer] = useState(() =>
    getFromLocalStorage(STORAGE_KEYS.SYNCED_WITH_STUDY_TIMER, false)
  );
  const [localResetKey, setLocalResetKey] = useState(0);

  // Función para emitir eventos de sincronización
  const emitSyncEvent = useCallback((eventName, baseTimestamp = Date.now()) => {
    window.dispatchEvent(
      new CustomEvent(eventName, { detail: { baseTimestamp } })
    );
  }, []);

  // Función para emitir múltiples eventos de sincronización
  const emitMultipleSyncEvents = useCallback(
    (events, baseTimestamp = Date.now()) => {
      events.forEach((eventName) => emitSyncEvent(eventName, baseTimestamp));
    },
    [emitSyncEvent]
  );

  // Función para actualizar el tiempo del timer
  const updateTimerTime = useCallback(
    (time, isRunning = studyState.isRunning) => {
      updateStudyState({ time });
      window.dispatchEvent(
        new CustomEvent(SYNC_EVENTS.STUDY_TIMER_TIME_UPDATE, {
          detail: { time, isRunning },
        })
      );
    },
    [updateStudyState, studyState.isRunning]
  );

  // Función para ajustar tiempo
  const adjustTime = useCallback(
    (adjustment) => {
      const now = Date.now();
      if (studyState.isRunning) {
        const elapsed =
          studyState.timeAtStart + (now - studyState.lastStart) / 1000;
        updateStudyState({
          timeAtStart: Math.max(0, elapsed + adjustment),
          lastStart: now,
        });
      } else {
        updateStudyState({ time: Math.max(0, studyState.time + adjustment) });
      }

      // Emitir eventos de ajuste para timers sincronizados
      if (isPomodoroSync) {
        window.dispatchEvent(
          new CustomEvent(SYNC_EVENTS.ADJUST_POMODORO_TIME, {
            detail: { adjustment },
          })
        );
      }
      if (isCountdownSync) {
        window.dispatchEvent(
          new CustomEvent(SYNC_EVENTS.ADJUST_COUNTDOWN_TIME, {
            detail: { adjustment },
          })
        );
      }
    },
    [studyState, updateStudyState, isPomodoroSync, isCountdownSync]
  );

  // Función para obtener detalles de la sesión actual
  const fetchCurrentSessionDetails = useCallback(async () => {
    if (!currentSessionId) return;

    try {
      const { data: session, error } = await supabase
        .from("study_laps")
        .select("name, description")
        .eq("id", currentSessionId)
        .maybeSingle();

      if (error || !session) {
        console.error("Error fetching current session details:", error);
        return;
      }

      const updates = {
        sessionTitle: session.name || "Untitled Session",
        sessionDescription: session.description || "",
      };

      updateStudyState(updates);

      // Actualizar localStorage
      const savedState = getFromLocalStorage(STORAGE_KEYS.STUDY_TIMER_STATE);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        saveToLocalStorage(STORAGE_KEYS.STUDY_TIMER_STATE, {
          ...parsed,
          ...updates,
        });
      }
    } catch (error) {
      console.error("Error in fetchCurrentSessionDetails:", error);
    }
  }, [currentSessionId, updateStudyState]);

  // Controles del timer
  const studyControls = useMemo(
    () => ({
      start: async (baseTimestamp, fromSync = false) => {
        if (isStudyRunningRedux || isHandlingEvent) return;

        if (!isLoggedIn) {
          updateModal("isLoginPromptOpen", true);
          return;
        }

        const activeId =
          currentSessionId ||
          getFromLocalStorage(STORAGE_KEYS.ACTIVE_SESSION_ID);
        if (!activeId) {
          updateModal("isStartModalOpen", true);
          return;
        }

        const now =
          typeof baseTimestamp === "number" && Number.isFinite(baseTimestamp)
            ? baseTimestamp
            : Date.now();
        const currentTime = Number.isFinite(studyState.time)
          ? studyState.time
          : 0;

        updateStudyState({
          isRunning: true,
          lastStart: now,
          timeAtStart: currentTime,
          time: currentTime,
          sessionStatus: "active",
        });

        dispatch(setStudyRunning(true));
        dispatch(setStudyTimerState("running"));
        saveToLocalStorage(STORAGE_KEYS.STUDY_TIMER_STARTED_AT, now.toString());

        window.dispatchEvent(
          new CustomEvent(SYNC_EVENTS.STUDY_TIMER_STATE_CHANGED, {
            detail: { isRunning: true },
          })
        );

        if (!fromSync) {
          const emitTs = Date.now();
          const eventsToEmit = [];
          if (isPomodoroSync) eventsToEmit.push(SYNC_EVENTS.PLAY_POMODORO);
          if (isCountdownSync) eventsToEmit.push(SYNC_EVENTS.PLAY_COUNTDOWN);
          emitMultipleSyncEvents(eventsToEmit, emitTs);
        }
      },

      pause: (fromSync = false) => {
        if (!isStudyRunningRedux) return;

        dispatch(setStudyRunning(false));
        dispatch(setStudyTimerState("paused"));

        updateStudyState({
          isRunning: false,
          time: studyState.time,
          lastStart: null,
          timeAtStart: studyState.time,
          sessionStatus: "paused",
          lastPausedAt: Date.now(),
        });

        window.dispatchEvent(
          new CustomEvent(SYNC_EVENTS.STUDY_TIMER_STATE_CHANGED, {
            detail: { isRunning: false },
          })
        );

        if (!fromSync) {
          const emitTs = Date.now();
          const eventsToEmit = [];
          if (isPomodoroSync) eventsToEmit.push(SYNC_EVENTS.PAUSE_POMODORO);
          if (isCountdownSync) eventsToEmit.push(SYNC_EVENTS.PAUSE_COUNTDOWN);
          emitMultipleSyncEvents(eventsToEmit, emitTs);
        }
      },

      reset: (fromSync = false) => {
        updateStudyState({
          isRunning: false,
          lastStart: null,
          timeAtStart: 0,
          time: 0,
          sessionStatus: "inactive",
        });

        dispatch(setStudyRunning(false));
        dispatch(setStudyTimerState("stopped"));
        dispatch(resetTimerState());

        // Limpiar localStorage
        [
          STORAGE_KEYS.STUDY_TIMER_STATE,
          STORAGE_KEYS.ACTIVE_SESSION_ID,
          STORAGE_KEYS.STUDY_TIMER_STARTED_AT,
        ].forEach((key) => localStorage.removeItem(key));

        window.dispatchEvent(
          new CustomEvent(SYNC_EVENTS.STUDY_TIMER_STATE_CHANGED, {
            detail: { isRunning: false },
          })
        );

        if (!fromSync) {
          const emitTs = Date.now();
          console.warn("[StudyTimer] 🔄 RESET - Checking sync states:", {
            baseTimestamp: emitTs,
            isCountdownSync,
            willEmitResetCountdownSync: !!isCountdownSync,
          });

          emitSyncEvent(SYNC_EVENTS.RESET_TIMER, emitTs);

          if (isPomodoroSync) {
            console.log("[StudyTimer] ✅ Emitting resetPomodoroSync", {
              baseTimestamp: emitTs,
            });
            emitSyncEvent(SYNC_EVENTS.RESET_POMODORO, emitTs);
          }

          if (isCountdownSync) {
            console.log("[StudyTimer] ✅ EMITTING resetCountdownSync", {
              baseTimestamp: emitTs,
              isCountdownSync,
            });
            emitSyncEvent(SYNC_EVENTS.RESET_COUNTDOWN, emitTs);
          } else {
            console.log("[StudyTimer] ❌ NOT emitting resetCountdownSync", {
              isCountdownSync,
              reason: "isCountdownSync is false",
            });
          }
        }
      },
    }),
    [
      isStudyRunningRedux,
      isHandlingEvent,
      isLoggedIn,
      currentSessionId,
      studyState,
      updateStudyState,
      dispatch,
      isPomodoroSync,
      isCountdownSync,
      updateModal,
      emitSyncEvent,
      emitMultipleSyncEvents,
    ]
  );

  // Event listeners con manejo optimizado de timestamps
  const createEventHandler = useCallback(
    (action, condition = () => true) => {
      return (event) => {
        const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
        if (!isNewTimestamp(baseTimestamp) || !condition()) return;
        action(baseTimestamp);
      };
    },
    [isNewTimestamp]
  );

  useEventListener(
    SYNC_EVENTS.PLAY_TIMER,
    createEventHandler(
      (baseTimestamp) =>
        !isStudyRunningRedux && studyControls.start(baseTimestamp, true),
      () => !isStudyRunningRedux
    ),
    [isStudyRunningRedux, studyControls]
  );

  useEventListener(
    SYNC_EVENTS.PAUSE_TIMER,
    createEventHandler(
      () => isStudyRunningRedux && studyControls.pause(true),
      () => isStudyRunningRedux
    ),
    [isStudyRunningRedux, studyControls]
  );

  useEventListener(
    SYNC_EVENTS.RESET_TIMER,
    createEventHandler(() => studyControls.reset(true)),
    [studyControls]
  );

  useEventListener(
    SYNC_EVENTS.RESET_POMODORO,
    createEventHandler(
      () => isPomodoroSync && studyControls.reset(true),
      () => isPomodoroSync
    ),
    [isPomodoroSync, studyControls]
  );

  useEventListener(
    SYNC_EVENTS.RESET_COUNTDOWN,
    createEventHandler(
      () => isCountdownSync && studyControls.reset(true),
      () => isCountdownSync
    ),
    [isCountdownSync, studyControls]
  );

  // Función para formatear duración
  const formatDuration = useCallback((totalSeconds) => {
    const roundedSeconds = Math.round(totalSeconds);
    const hours = Math.floor(roundedSeconds / 3600);
    const minutes = Math.floor((roundedSeconds % 3600) / 60);
    const seconds = roundedSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  }, []);

  // Función para manejar finalización de sesión
  const handleFinishSession = useCallback(async () => {
    try {
      if (!currentSessionId) return;

      const { data: session, error: fetchError } = await supabase
        .from("study_laps")
        .select("*")
        .eq("id", currentSessionId)
        .single();

      if (fetchError || !session) {
        console.error("Error fetching session:", fetchError);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User not authenticated");
        return;
      }

      const startedAt = session.started_at;
      const endedAt = new Date().toISOString();
      const localStartedAt = getFromLocalStorage(
        STORAGE_KEYS.STUDY_TIMER_STARTED_AT
      );

      const { data: completedTasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id, completed_at")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("completed_at", startedAt)
        .lte("completed_at", endedAt);

      if (tasksError) {
        console.error("Error fetching completed tasks:", tasksError);
        toast.error("Failed to fetch completed tasks.");
        return;
      }

      const formattedDuration = formatDuration(studyState.time);

      if (formattedDuration !== "00:00:00") {
        const pomodorosThisSession = parseInt(
          getFromLocalStorage(STORAGE_KEYS.POMODOROS_THIS_SESSION, "0"),
          10
        );

        const updateData = {
          duration: formattedDuration,
          tasks_completed: completedTasks.length,
          ended_at: endedAt,
          pomodoros_completed: pomodorosThisSession,
        };

        if (localStartedAt) {
          updateData.started_at = new Date(
            Number(localStartedAt)
          ).toISOString();
        }

        const { error } = await supabase
          .from("study_laps")
          .update(updateData)
          .eq("id", currentSessionId);

        if (error) {
          console.error("Error updating study lap:", error);
          toast.error("Failed to update session details.");
          return;
        }

        setSummaryData({
          duration: formattedDuration,
          tasksCount: completedTasks.length,
          pomodoros: pomodorosThisSession,
        });

        updateModal("isSummaryOpen", true);
        window.dispatchEvent(new CustomEvent(SYNC_EVENTS.REFRESH_STATS));
      }

      window.dispatchEvent(new CustomEvent(SYNC_EVENTS.FINISH_SESSION));

      // Reset session state
      studyControls.reset();
      updateSessionId(null);
      dispatch(setCurrentSession(null));
      updateStudyState({
        sessionTitle: undefined,
        sessionDescription: undefined,
      });
      localStorage.removeItem(STORAGE_KEYS.STUDY_TIMER_STARTED_AT);

      // Emit synchronized resets
      const emitTs = Date.now();
      console.warn("[StudyTimer] Emitting reset events from finishSession()", {
        baseTimestamp: emitTs,
        willEmitResetPomodoroSync: !!isPomodoroSync,
        willEmitResetCountdownSync: !!isCountdownSync,
      });

      if (isPomodoroSync) {
        emitSyncEvent(SYNC_EVENTS.RESET_POMODORO, emitTs);
      }

      console.log(
        "[StudyTimer] Emitting resetCountdownSync (handleFinishSession)",
        { baseTimestamp: emitTs }
      );
      emitSyncEvent(SYNC_EVENTS.RESET_COUNTDOWN, emitTs);
    } catch (error) {
      console.error("Error finishing session:", error);
      toast.error("An error occurred while finishing the session.");
    }
  }, [
    currentSessionId,
    studyState.time,
    formatDuration,
    updateModal,
    studyControls,
    updateSessionId,
    dispatch,
    updateStudyState,
    isPomodoroSync,
    isCountdownSync,
    emitSyncEvent,
  ]);

  // Función para manejar salida de sesión
  const handleExitSession = useCallback(() => {
    updateModal("isDeleteModalOpen", true);
  }, [updateModal]);

  // Función para manejar inicio de sesión
  const handleStartSession = useCallback(
    ({ sessionId, title, syncPomo, syncCountdown }) => {
      try {
        if (!sessionId) return;

        updateSessionId(sessionId);
        updateStudyState({
          sessionTitle: title || studyState.sessionTitle,
          sessionDescription: studyState.sessionDescription,
          sessionStatus: "active",
        });

        if (typeof syncPomo === "boolean") {
          dispatch(setSyncPomodoroWithTimer(!!syncPomo));
        }
        if (typeof syncCountdown === "boolean") {
          dispatch(setSyncCountdownWithTimer(!!syncCountdown));
        }

        updateModal("isStartModalOpen", false);

        setTimeout(() => {
          studyControls.start(Date.now(), false);
        }, 0);
      } catch (e) {
        console.error("Error in handleStartSession:", e);
        toast.error("Could not start the session.");
      }
    },
    [
      updateSessionId,
      updateStudyState,
      studyState.sessionTitle,
      studyState.sessionDescription,
      dispatch,
      updateModal,
      studyControls,
    ]
  );

  // Función para confirmar eliminación
  const handleConfirmDelete = useCallback(async () => {
    try {
      if (currentSessionId) {
        const { error } = await supabase
          .from("study_laps")
          .delete()
          .eq("id", currentSessionId);

        if (error) {
          console.error("Error deleting session:", error);
          toast.error("Failed to delete session.");
          return;
        }
      }

      studyControls.reset();
      updateSessionId(null);
      dispatch(setCurrentSession(null));
      updateModal("isDeleteModalOpen", false);
      updateStudyState({
        sessionTitle: undefined,
        sessionDescription: undefined,
      });

      const emitTs = Date.now();
      console.warn("[StudyTimer] Emitting reset events from exitSession()", {
        baseTimestamp: emitTs,
        willEmitResetPomodoroSync: !!isPomodoroSync,
        willEmitResetCountdownSync: !!isCountdownSync,
      });

      if (isPomodoroSync) {
        emitSyncEvent(SYNC_EVENTS.RESET_POMODORO, emitTs);
      }
      emitSyncEvent(SYNC_EVENTS.RESET_COUNTDOWN, emitTs);
    } catch (error) {
      console.error("Error exiting session:", error);
      toast.error("An error occurred while exiting the session.");
    }
  }, [
    currentSessionId,
    studyControls,
    updateSessionId,
    dispatch,
    updateModal,
    updateStudyState,
    isPomodoroSync,
    isCountdownSync,
    emitSyncEvent,
  ]);

  // Función para calcular tiempo desde la última pausa
  const getTimeSinceLastPause = useCallback(() => {
    if (studyState.sessionStatus !== "paused" || !studyState.lastPausedAt)
      return "";

    const diffMs = Date.now() - studyState.lastPausedAt;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const min = diffMin % 60;

    if (diffHr > 0) {
      return `${diffHr} hour${diffHr > 1 ? "s" : ""}${
        min > 0 ? ` and ${min} minute${min > 1 ? "s" : ""}` : ""
      } ago`;
    } else {
      return `${min} minute${min !== 1 ? "s" : ""} ago`;
    }
  }, [studyState.sessionStatus, studyState.lastPausedAt]);

  // Crear botones de ajuste de tiempo
  const createAdjustButton = useCallback(
    (adjustment, label) => (
      <button
        key={label}
        onClick={() => adjustTime(adjustment)}
        className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        aria-label={`${label.startsWith("-") ? "Subtract" : "Add"} ${Math.abs(
          adjustment / 60
        )} minutes`}
        disabled={!currentSessionId}
      >
        {label}
      </button>
    ),
    [adjustTime, currentSessionId]
  );

  // Timer logic y efectos optimizados
  useEffect(() => {
    const syncTimer = () => {
      if (isStudyRunningRedux && studyState.lastStart) {
        const now = Date.now();
        const elapsed =
          studyState.timeAtStart + (now - studyState.lastStart) / 1000;
        updateTimerTime(elapsed, studyState.isRunning);
      }
    };

    syncTimer();
    const intervalId = setInterval(syncTimer, 1000);
    return () => clearInterval(intervalId);
  }, [
    isStudyRunningRedux,
    studyState.lastStart,
    studyState.timeAtStart,
    updateTimerTime,
    studyState.isRunning,
  ]);

  // Save state to localStorage
  useEffect(() => {
    const stateToSave = {
      time: studyState.time,
      isRunning: studyState.isRunning,
      lastStart: studyState.lastStart,
      timeAtStart: studyState.timeAtStart,
      sessionStatus: studyState.sessionStatus,
      sessionTitle: studyState.sessionTitle || "",
      sessionDescription: studyState.sessionDescription || "",
    };

    saveToLocalStorage(STORAGE_KEYS.STUDY_TIMER_STATE, stateToSave);
    onSyncChange?.(studyState.syncPomo);
  }, [studyState, onSyncChange, currentSessionId, isStudyRunningRedux]);

  // Otros efectos necesarios
  useEffect(() => {
    if (currentSessionId) {
      fetchCurrentSessionDetails();
    }
  }, [currentSessionId, fetchCurrentSessionDetails]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(SYNC_EVENTS.STUDY_TIMER_SYNC_STATE_CHANGED, {
        detail: { isSyncedWithStudyTimer },
      })
    );
    saveToLocalStorage(
      STORAGE_KEYS.SYNCED_WITH_STUDY_TIMER,
      isSyncedWithStudyTimer
    );
  }, [isSyncedWithStudyTimer]);

  // Sync effects para Pomodoro y Countdown
  useEffect(() => {
    if (isPomodoroSync || isCountdownSync) {
      window.dispatchEvent(
        new CustomEvent(SYNC_EVENTS.STUDY_TIMER_TIME_UPDATE, {
          detail: {
            time: studyState.time,
            isRunning: studyState.isRunning,
          },
        })
      );
    }
  }, [isPomodoroSync, isCountdownSync, studyState.time, studyState.isRunning]);

  // Global sync effects
  useEffect(() => {
    if (!isSynced) return;

    const handleGlobalSync = (event) => {
      const { isRunning: globalIsRunning } = event.detail;

      if (globalIsRunning !== isStudyRunningRedux) {
        if (globalIsRunning) {
          studyControls.start(Date.now(), true);
        } else {
          studyControls.pause(true);
        }
      }
    };

    const handleGlobalReset = (event) => {
      const { resetKey: globalResetKey } = event.detail;
      console.warn("[StudyTimer] Recibido globalResetSync:", {
        globalResetKey,
        localResetKey,
      });
      if (globalResetKey !== localResetKey) {
        console.warn("[StudyTimer] Ejecutando reset desde globalResetSync");
        setLocalResetKey(globalResetKey);
        studyControls.reset(true);
      }
    };

    window.addEventListener(SYNC_EVENTS.GLOBAL_TIMER_SYNC, handleGlobalSync);
    window.addEventListener(SYNC_EVENTS.GLOBAL_RESET_SYNC, handleGlobalReset);

    return () => {
      window.removeEventListener(
        SYNC_EVENTS.GLOBAL_TIMER_SYNC,
        handleGlobalSync
      );
      window.removeEventListener(
        SYNC_EVENTS.GLOBAL_RESET_SYNC,
        handleGlobalReset
      );
    };
  }, [isSynced, isStudyRunningRedux, localResetKey, studyControls]);

  // Session count effects
  useEffect(() => {
    const checkAndResetSessions = () => {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const lastReset = getFromLocalStorage(STORAGE_KEYS.LAST_SESSIONS_RESET);

      if (lastReset !== today) {
        setSessionsTodayCount(0);
        saveToLocalStorage(STORAGE_KEYS.LAST_SESSIONS_RESET, today);
        saveToLocalStorage(STORAGE_KEYS.SESSIONS_TODAY_COUNT, "0");
      }
    };

    checkAndResetSessions();
    const interval = setInterval(checkAndResetSessions, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch sessions count for today
  const fetchSessionsTodayCount = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("study_laps")
        .select("id")
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);

      if (error) throw error;
      setSessionsTodayCount(data.length);
      saveToLocalStorage(
        STORAGE_KEYS.SESSIONS_TODAY_COUNT,
        data.length.toString()
      );
    } catch (error) {
      console.error("Error fetching sessions count:", error);
    }
  }, []);

  useEffect(() => {
    fetchSessionsTodayCount();
  }, [fetchSessionsTodayCount]);

  // Define studyTick function for useStudyTimer hook
  const studyTick = useCallback(
    (elapsed) => {
      updateStudyState({ time: elapsed });
    },
    [updateStudyState]
  );

  // Use the useStudyTimer hook for background timing
  useStudyTimer(studyTick, studyState.timeAtStart, studyState.lastStart);

  // Render time adjustment buttons
  const timeAdjustmentButtons = [
    { adjustment: TIME_ADJUSTMENTS.MINUS_TEN, label: "-10" },
    { adjustment: TIME_ADJUSTMENTS.MINUS_FIVE, label: "-5" },
    { adjustment: TIME_ADJUSTMENTS.PLUS_FIVE, label: "+5" },
    { adjustment: TIME_ADJUSTMENTS.PLUS_TEN, label: "+10" },
  ];

  return (
    <div className="flex flex-col items-center h-min">
      {/* Header: Icon, Title, Settings Button */}
      <div className="section-title justify-center relative w-full px-4 py-3">
        <SectionTitle
          title="Timer"
          tooltip="A customizable timer for focused study sessions. Set your own duration and track your study time with detailed analytics and session management."
          size="md"
        />
        {/* Botón de configuración de sesión */}
        {currentSessionId ? (
          <button
            onClick={() => updateModal("isEditModalOpen", true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Configure session"
          >
            <MoreVertical size={20} />
          </button>
        ) : (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[28px]"></div>
        )}
      </div>

      {/* Timer display con tooltip para Session Title */}
      <div
        className="relative group text-3xl md:text-4xl xl:text-5xl font-mono mb-4 lg:mb-4 text-center"
        role="timer"
        aria-label="Current session time"
      >
        <span>{formatStudyTime(safeNumber(studyState.time), false)}</span>
        {currentSessionId && (
          <div className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 hidden group-hover:block bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] shadow-xl min-w-[180px] text-center">
            <div className="font-semibold mb-1">Session Title</div>
            <div>{studyState.sessionTitle || "No Session"}</div>
            {/* Last paused info */}
            {studyState.sessionStatus === "paused" &&
              studyState.lastPausedAt && (
                <div className="mt-2 text-sm text-[var(--text-secondary)]">
                  Last paused: {getTimeSinceLastPause()}
                </div>
              )}
          </div>
        )}
      </div>

      {/* Time adjustment buttons */}
      <div className="flex gap-2 mb-6 md:mb-6 lg:mb-6">
        {timeAdjustmentButtons.map(({ adjustment, label }) =>
          createAdjustButton(adjustment, label)
        )}
      </div>

      {/* Timer controls */}
      <div className="timer-controls flex justify-center items-center gap-1 lg:mb-0">
        {!isSynced && (
          <>
            <button
              onClick={studyControls.reset}
              className="control-button flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Reset timer"
            >
              <RotateCcw size={20} style={{ color: "var(--accent-primary)" }} />
            </button>
            {!isStudyRunningRedux ? (
              <button
                onClick={studyControls.start}
                className="control-button flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Start timer"
              >
                <Play size={20} style={{ color: "var(--accent-primary)" }} />
              </button>
            ) : (
              <button
                onClick={studyControls.pause}
                className="control-button flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Pause timer"
              >
                <Pause size={20} style={{ color: "var(--accent-primary)" }} />
              </button>
            )}
          </>
        )}
        {currentSessionId && (
          <>
            <button
              onClick={handleExitSession}
              className="control-button flex items-center justify-center bg-[var(--bg-secondary)] transition-colors"
              aria-label="Exit session"
            >
              <X size={20} style={{ color: "var(--accent-primary)" }} />
            </button>
            <button
              onClick={() => {
                if (isStudyRunningRedux) {
                  studyControls.pause();
                }
                updateModal("isFinishModalOpen", true);
              }}
              className="control-button flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Finish session"
            >
              <Check size={20} style={{ color: "var(--accent-primary)" }} />
            </button>
          </>
        )}
      </div>

      <div className="flex flex-col gap-1 mt-4">
        {/* Controles de sincronización movidos al modal */}
      </div>

      {/* Modals */}
      <StartSessionModal
        isOpen={modalStates.isStartModalOpen}
        onClose={() => updateModal("isStartModalOpen", false)}
        onStart={handleStartSession}
      />

      <FinishSessionModal
        isOpen={modalStates.isFinishModalOpen}
        onClose={() => updateModal("isFinishModalOpen", false)}
        onFinish={handleFinishSession}
        sessionId={currentSessionId}
        onSessionDetailsUpdated={fetchCurrentSessionDetails}
      />

      <EditSessionModal
        isOpen={modalStates.isEditModalOpen}
        onClose={() => updateModal("isEditModalOpen", false)}
        sessionId={currentSessionId}
        onSessionDetailsUpdated={fetchCurrentSessionDetails}
      />

      <LoginPromptModal
        isOpen={modalStates.isLoginPromptOpen}
        onClose={() => updateModal("isLoginPromptOpen", false)}
      />

      <DeleteSessionModal
        isOpen={modalStates.isDeleteModalOpen}
        onClose={() => updateModal("isDeleteModalOpen", false)}
        onConfirm={handleConfirmDelete}
      />

      <SessionSummaryModal
        isOpen={modalStates.isSummaryOpen}
        onClose={() => updateModal("isSummaryOpen", false)}
        title={studyState.sessionTitle}
        durationFormatted={summaryData.duration}
        completedTasksCount={summaryData.tasksCount}
        pomodorosCompleted={summaryData.pomodoros}
      />
    </div>
  );
};

export default StudyTimer;
