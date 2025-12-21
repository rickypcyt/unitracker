import {
  Check,
  MoreVertical,
  Pause,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
// moved to hooks/study-timer/useStudySync
import { SYNC_EVENTS, useEmitSyncEvents } from "@/hooks/study-timer/useStudySync";
import { formatStudyTime, useStudyTimer } from "@/hooks/useTimers";
import { useAppStore, useSessionSyncSettings } from "@/store/appStore";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import DeleteSessionModal from "@/modals/DeleteSessionModal";
import EditSessionModal from "@/modals/EditSessionModal";
import ExitSessionChoiceModal from "@/modals/ExitSessionChoiceModal";
import FinishSessionModal from "@/modals/FinishSessionModal";
import LoginPromptModal from "@/modals/LoginPromptModal";
import SectionTitle from "@/components/SectionTitle";
import SessionSummaryModal from "@/modals/SessionSummaryModal";
import SessionsModal from "@/modals/TodaysSessionsModal";
import StartSessionModal from "@/modals/StartSessionModal";
import { supabase } from "@/utils/supabaseClient";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import useEventListener from "@/hooks/useEventListener";
// moved to hooks/study-timer/useSessionId
import { useSessionId } from "@/hooks/study-timer/useSessionId";
// moved to hooks/study-timer/useStudyTimerState
import { useStudyTimerState, type StudyState } from "@/hooks/study-timer/useStudyTimerState";

// Constantes
const STORAGE_KEYS = {
  STUDY_TIMER_STATE: "studyTimerState",
  ACTIVE_SESSION_ID: "activeSessionId",
  STUDY_TIMER_STARTED_AT: "studyTimerStartedAt",
  SYNCED_WITH_STUDY_TIMER: "isSyncedWithStudyTimer",
  LAST_SESSIONS_RESET: "lastSessionsReset",
  SESSIONS_TODAY_COUNT: "sessionsTodayCount",
};

const TIME_ADJUSTMENTS = {
  MINUS_TEN: -600,
  MINUS_FIVE: -300,
  PLUS_FIVE: 300,
  PLUS_TEN: 600,
  PLUS_NINETY: 90,
};


// Utilidades
const safeNumber = (value: any, defaultValue: number = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : defaultValue;

const saveToLocalStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(
      key,
      typeof value === "string" ? value : JSON.stringify(value)
    );
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
  }
};

const getFromLocalStorage = (key: string, defaultValue: any = null): any => {
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
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(null);

  const isNewTimestamp = useCallback(
    (timestamp: number): boolean => {
      if (lastSyncTimestamp === timestamp) return false;
      setLastSyncTimestamp(timestamp);
      return true;
    },
    [lastSyncTimestamp]
  );

  return { isNewTimestamp, setLastSyncTimestamp };
};



const useModalStates = () => {
  const [modalStates, setModalStates] = useState({
    isStartModalOpen: false,
    isSessionsModalOpen: false,
    isFinishModalOpen: false,
    isLoginPromptOpen: false,
    isSummaryOpen: false,
    isEditModalOpen: false,
    isDeleteModalOpen: false,
  });

  const updateModal = useCallback((modalName: string, isOpen: boolean) => {
    setModalStates((prev) => ({ ...prev, [modalName]: isOpen }));
  }, []);

  return [modalStates, updateModal] as [typeof modalStates, typeof updateModal];
};

const useSyncStates = (currentSessionId: string | null) => {
  const { syncSettings, setSessionSyncSettings } = useAppStore();
  const sessionSyncSettings = useSessionSyncSettings(currentSessionId);
  const syncPomodoroWithTimer = syncSettings.syncPomodoroWithTimer;
  const syncCountdownWithTimer = syncSettings.syncCountdownWithTimer;

  const saveSessionSyncSettings = useCallback((sessionId: string) => {
    if (sessionId) {
      setSessionSyncSettings(sessionId, syncSettings);
    }
  }, [syncSettings, setSessionSyncSettings]);

  const loadSessionSyncSettings = useCallback(() => {
    return sessionSyncSettings || syncSettings;
  }, [sessionSyncSettings, syncSettings]);

  return {
    isPomodoroSync: syncPomodoroWithTimer,
    isCountdownSync: syncCountdownWithTimer,
    saveSessionSyncSettings,
    loadSessionSyncSettings
  };
};

interface StudyTimerProps {
  onSyncChange?: (isSynced: boolean) => void;
  isSynced?: boolean;
}

const StudyTimer = ({ onSyncChange, isSynced }: StudyTimerProps) => {
  const { isLoggedIn } = useAuth();
  const {
    resetTimerState,
    setCurrentSession,
    setStudyTimerState,
    setSyncCountdownWithTimer,
    setSyncPomodoroWithTimer,
    setStudyRunning,
  } = useAppStore();
  const { ui } = useAppStore();
  const isStudyRunningRedux = ui.isStudyRunning;

  const { syncSettings, setSessionSyncSettings } = useAppStore();
  const [studyState, updateStudyState] = useStudyTimerState();
  const [, forceUpdate] = useState({});
  
  // Verificar si hay una sesión activa al cargar
  React.useEffect(() => {
    const checkActiveSession = async () => {
      const hasActiveSession = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
      if (!hasActiveSession) {
        // Si no hay sesión activa, forzar el reinicio del timer
        updateStudyState({
          time: 0,
          isRunning: false,
          lastStart: null,
          timeAtStart: 0,
          sessionStatus: "inactive",
          lastPausedAt: null,
        });
        updateTimerTime(0, false);
      }
    };
    checkActiveSession();
  }, []);
  
  const [currentSessionId, updateSessionId] = useSessionId();
  const [modalStates, updateModal] = useModalStates();
  const [isExitChoiceOpen, setExitChoiceOpen] = useState(false);
  const { isPomodoroSync, isCountdownSync } = useSyncStates(currentSessionId);
  
  // Restore running state on component mount
  useEffect(() => {
    // Check if there's an active session and timer was running
    const savedState = getFromLocalStorage(STORAGE_KEYS.STUDY_TIMER_STATE);
    const activeSessionId = getFromLocalStorage(STORAGE_KEYS.ACTIVE_SESSION_ID);
    
    if (savedState && activeSessionId) {
      try {
        const parsed = JSON.parse(savedState);
        const wasRunning = parsed.isRunning === true;
        const lastStart = parsed.lastStart;
        const timeAtStart = parsed.timeAtStart;
        
        // Restore the current session in the global store
        setCurrentSession(activeSessionId);
        
        // Restore session details from saved state
        if (parsed.sessionTitle || parsed.sessionDescription) {
          updateStudyState({
            sessionTitle: parsed.sessionTitle || "",
            sessionDescription: parsed.sessionDescription || "",
          });
        }
        
        // Get Pomodoro current mode for console logging
        let pomodoroMode = 'N/A';
        try {
          const pomodoroState = localStorage.getItem('pomodoroState');
          if (pomodoroState) {
            const pomoParsed = JSON.parse(pomodoroState);
            pomodoroMode = pomoParsed.currentMode || 'work';
            
            // Get mode name for better readability
            const modeNames: Record<string, string> = {
              'work': 'Work',
              'break': 'Break', 
              'longBreak': 'Long Break'
            };
            pomodoroMode = modeNames[pomodoroMode] || pomodoroMode;
          }
        } catch (e) {
          console.warn('[StudyTimer] Could not read Pomodoro mode:', e);
        }
        
        if (wasRunning && lastStart && timeAtStart >= 0) {
          // Restore the running state in the global store
          setStudyRunning(true);
          setStudyTimerState("running");
          
          // Update the local state to match
          updateStudyState({
            isRunning: true,
            lastStart: lastStart,
            timeAtStart: timeAtStart,
            sessionStatus: "active",
          });
          
          // Load session sync settings and emit sync events to restart other timers
          const sessionSyncSettings = useSessionSyncSettings(activeSessionId);
          const currentSyncSettings = sessionSyncSettings || syncSettings;
          const shouldSyncPomodoro = currentSyncSettings.syncPomodoroWithTimer;
          const shouldSyncCountdown = currentSyncSettings.syncCountdownWithTimer;
          
          // Emit sync events to restart other timers if they were synced
          const emitTs = Date.now();
          if (shouldSyncPomodoro) {
            window.dispatchEvent(new CustomEvent(SYNC_EVENTS.PLAY_POMODORO, {
              detail: { baseTimestamp: emitTs }
            }));
          }
          if (shouldSyncCountdown) {
            window.dispatchEvent(new CustomEvent(SYNC_EVENTS.PLAY_COUNTDOWN, {
              detail: { baseTimestamp: emitTs }
            }));
          }
          
          console.log('[StudyTimer] Restored running state after refresh:', {
            wasRunning,
            lastStart,
            timeAtStart,
            activeSessionId,
            shouldSyncPomodoro,
            shouldSyncCountdown,
            pomodoroMode: pomodoroMode
          });
        } else {
          // Log session info even if not running
          console.log('[StudyTimer] Session restored after refresh:', {
            wasRunning,
            activeSessionId,
            pomodoroMode: pomodoroMode
          });
        }
      } catch (error) {
        console.error('[StudyTimer] Error restoring running state:', error);
      }
    }
  }, [setStudyRunning, setStudyTimerState, updateStudyState, setCurrentSession, syncSettings, useSessionSyncSettings]);

  // Log current Pomodoro mode when session is active
  useEffect(() => {
    if (currentSessionId) {
      // Get Pomodoro current mode for console logging
      let pomodoroMode = 'N/A';
      let pomodoroRunning = false;
      try {
        const pomodoroState = localStorage.getItem('pomodoroState');
        if (pomodoroState) {
          const pomoParsed = JSON.parse(pomodoroState);
          pomodoroMode = pomoParsed.currentMode || 'work';
          pomodoroRunning = pomoParsed.isRunning || false;
          
          // Get mode name for better readability
          const modeNames: Record<string, string> = {
            'work': 'Work',
            'break': 'Break', 
            'longBreak': 'Long Break'
          };
          pomodoroMode = modeNames[pomodoroMode] || pomodoroMode;
        }
      } catch (e) {
        console.warn('[StudyTimer] Could not read Pomodoro mode:', e);
      }
      
      // Only log when session starts or important changes happen (not every second)
      if (studyState.isRunning && !studyState.lastStart) {
        console.log('[StudyTimer] 📚 Active session started:', {
          sessionId: currentSessionId,
          sessionTitle: studyState.sessionTitle,
          currentTime: formatStudyTime(studyState.time, false),
          pomodoroMode: pomodoroMode,
          pomodoroRunning: pomodoroRunning,
          syncPomodoro: isPomodoroSync,
          syncCountdown: isCountdownSync
        });
      }
    }
  }, [currentSessionId, studyState.sessionTitle, studyState.isRunning, studyState.time, isPomodoroSync, isCountdownSync]);

  // Log Pomodoro mode changes (even without active session)
  useEffect(() => {
    let lastLoggedMode = '';
    let lastLoggedIndex = '';
    let lastLoggedRunning = false;
    
    const handlePomodoroModeChange = () => {
      let pomodoroMode = 'N/A';
      let pomodoroRunning = false;
      let pomodoroModeIndex = 'N/A';
      let modeDetails = null;
      
      try {
        const pomodoroState = localStorage.getItem('pomodoroState');
        if (pomodoroState) {
          const pomoParsed = JSON.parse(pomodoroState);
          pomodoroMode = pomoParsed.currentMode || 'work';
          pomodoroRunning = pomoParsed.isRunning || false;
          pomodoroModeIndex = pomoParsed.modeIndex || 0;
          
          // Get mode name for better readability
          const modeNames: Record<string, string> = {
            'work': 'Work',
            'break': 'Break', 
            'longBreak': 'Long Break'
          };
          pomodoroMode = modeNames[pomodoroMode] || pomodoroMode;
          
          // Get mode details from store (more reliable than localStorage)
          try {
            // Try to get modes from the store first
            const pomodoroModesStr = localStorage.getItem('pomodoroModes');
            let modes = [];
            
            if (pomodoroModesStr) {
              modes = JSON.parse(pomodoroModesStr);
            } else {
              // Fallback to default modes if not in localStorage
              modes = [
                { label: 'Traditional', work: 1500, break: 300, longBreak: 900, description: 'Classic 25-5-15 Pomodoro technique' },
                { label: 'Extended Focus', work: 3000, break: 600, longBreak: 1800, description: 'Longer sessions for deep work' },
                { label: 'Ultra Focus', work: 3600, break: 900, longBreak: 2700, description: 'Maximum focus for complex projects' },
                { label: 'Custom', work: 1500, break: 300, longBreak: 900, description: 'Your personalized settings' }
              ];
            }
            
            const currentModeData = modes[pomodoroModeIndex];
            if (currentModeData) {
              modeDetails = {
                label: currentModeData.label || 'Unknown',
                work: currentModeData.work || 0,
                break: currentModeData.break || 0,
                longBreak: currentModeData.longBreak || 0,
                description: currentModeData.description || ''
              };
            }
          } catch (e) {
            console.warn('[StudyTimer] Could not read pomodoro modes:', e);
          }
        }
      } catch (e) {
        console.warn('[StudyTimer] Could not read Pomodoro mode:', e);
      }
      
      // Only log if something actually changed
      if (pomodoroMode !== lastLoggedMode || 
          pomodoroModeIndex !== lastLoggedIndex || 
          pomodoroRunning !== lastLoggedRunning) {
        
        const logData: any = {
          previousMode: lastLoggedMode || 'None',
          newMode: pomodoroMode,
          modeIndex: pomodoroModeIndex,
          isRunning: pomodoroRunning,
          hasActiveSession: !!currentSessionId
        };
        
        // Always add mode details (even if fallback)
        if (modeDetails) {
          logData.workMinutes = modeDetails.work / 60;
          logData.breakMinutes = modeDetails.break / 60;
          logData.longBreakMinutes = modeDetails.longBreak / 60;
          logData.modeName = modeDetails.label;
          logData.description = modeDetails.description;
        } else {
          // Fallback if no mode details found
          logData.workMinutes = 'Unknown';
          logData.breakMinutes = 'Unknown';
          logData.longBreakMinutes = 'Unknown';
          logData.modeName = 'Unknown';
        }
        
        // Notify when a work session ends (Work -> Break or Long Break)
        if (lastLoggedMode === 'Work' && (pomodoroMode === 'Break' || pomodoroMode === 'Long Break')) {
          
          // Inform Pomodoro UI to sync counts from localStorage immediately
          try {
            window.dispatchEvent(new CustomEvent('pomodoroWorkCompleteNotice', {
              detail: {
                previousMode: lastLoggedMode,
                newMode: pomodoroMode,
                modeIndex: pomodoroModeIndex,
                timestamp: Date.now(),
              }
            }));
          } catch (e) {
            // no-op
          }
        }

        console.log('[StudyTimer] 🍅 Pomodoro mode changed:', logData);
        
        lastLoggedMode = pomodoroMode;
        lastLoggedIndex = pomodoroModeIndex;
        lastLoggedRunning = pomodoroRunning;
      }
    };

    // Check immediately on mount
    handlePomodoroModeChange();
    
    // Listen for Pomodoro mode changes
    const intervalId = setInterval(handlePomodoroModeChange, 1000);
    
    return () => clearInterval(intervalId);
  }, [currentSessionId]);

  // Save sync settings when they change and there's an active session
  useEffect(() => {
    if (currentSessionId) {
      setSessionSyncSettings(currentSessionId, syncSettings);
      console.log('[StudyTimer] Saved session sync settings:', { sessionId: currentSessionId });
    }
  }, [currentSessionId, syncSettings]);
  const { isNewTimestamp } = useTimestamp();

  const [summaryData, setSummaryData] = useState({
    duration: "00:00:00",
    tasksCount: 0,
    pomodoros: 0,
    title: "",
  });
  const [isHandlingEvent] = useState(false);
  const [, setSessionsTodayCount] = useState(0);
  const [isSyncedWithStudyTimer] = useState<boolean>(() =>
    getFromLocalStorage(STORAGE_KEYS.SYNCED_WITH_STUDY_TIMER, false)
  );
  const [localResetKey, setLocalResetKey] = useState(0);

  // Emitters
  const { emitSyncEvent, emitMultipleSyncEvents } = useEmitSyncEvents();

  // Función para actualizar el tiempo del timer
  const updateTimerTime = useCallback(
    (time: number, isRunning: boolean = studyState.isRunning) => {
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
    (adjustment: number) => {
      const now = Date.now();
      if (studyState.isRunning) {
        const elapsed =
          studyState.timeAtStart + (now - (studyState.lastStart || 0)) / 1000;
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
      start: async (baseTimestamp: number, fromSync: boolean = false, seedTime?: number) => {
        if (isStudyRunningRedux || isHandlingEvent) return;

        if (!isLoggedIn) {
          updateModal("isLoginPromptOpen", true);
          return;
        }

        const activeId =
          currentSessionId ||
          getFromLocalStorage(STORAGE_KEYS.ACTIVE_SESSION_ID);
        if (!activeId) {
          updateModal("isSessionsModalOpen", true); // Show SessionsModal first
          return;
        }

        const now =
          typeof baseTimestamp === "number" && Number.isFinite(baseTimestamp)
            ? baseTimestamp
            : Date.now();
        const currentTime = Number.isFinite(seedTime as number)
          ? (seedTime as number)
          : Number.isFinite(studyState.time)
          ? studyState.time
          : 0;

        updateStudyState({
          isRunning: true,
          lastStart: now,
          timeAtStart: currentTime,
          time: currentTime,
          sessionStatus: "active",
        });

        setStudyRunning(true);
        setStudyTimerState("running");
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

        setStudyRunning(false);
        setStudyTimerState("paused");

        updateStudyState({
          isRunning: false,
          time: studyState.time,
          lastStart: null,
          timeAtStart: studyState.time,
          sessionStatus: "paused",
          lastPausedAt: Date.now(),
        });

        // Persist duration to DB on every pause
        (async () => {
          try {
            if (currentSessionId) {
              const formatted = formatDuration(studyState.time);
              if (formatted && formatted !== "00:00:00") {
                const { error } = await supabase
                  .from("study_laps")
                  .update({ duration: formatted })
                  .eq("id", currentSessionId);
                if (error) {
                  console.error("Error updating duration on pause:", error);
                }
              }
            }
          } catch (e) {
            console.error("Unexpected error updating duration on pause:", e);
          }
        })();

        if (!fromSync) {
          const emitTs = Date.now();
          const eventsToEmit = [];
          if (isPomodoroSync) eventsToEmit.push(SYNC_EVENTS.PAUSE_POMODORO);
          if (isCountdownSync) eventsToEmit.push(SYNC_EVENTS.PAUSE_COUNTDOWN);
          emitMultipleSyncEvents(eventsToEmit, emitTs);
        }
      },

      reset: (fromSync = false) => {
        // Check if there's an active session - if so, don't terminate it
        const hasActiveSession = !!currentSessionId;
        
        // Preserve current sync settings before reset
        const currentSyncSettings = {
          isPomodoroSync,
          isCountdownSync
        };
        
        updateStudyState({
          isRunning: false,
          lastStart: null,
          timeAtStart: 0,
          time: 0,
          // Only set sessionStatus to inactive if there's no active session
          sessionStatus: hasActiveSession ? studyState.sessionStatus : "inactive",
        });

        setStudyRunning(false);
        setStudyTimerState("stopped");
        resetTimerState();

        // Limpiar localStorage - but preserve active session if it exists
        if (!hasActiveSession) {
          [
            STORAGE_KEYS.STUDY_TIMER_STATE,
            STORAGE_KEYS.ACTIVE_SESSION_ID,
            STORAGE_KEYS.STUDY_TIMER_STARTED_AT,
          ].forEach((key) => localStorage.removeItem(key));
        } else {
          // Only clear timer-related state, preserve session
          [
            STORAGE_KEYS.STUDY_TIMER_STATE,
            STORAGE_KEYS.STUDY_TIMER_STARTED_AT,
          ].forEach((key) => localStorage.removeItem(key));
        }

        window.dispatchEvent(
          new CustomEvent(SYNC_EVENTS.STUDY_TIMER_STATE_CHANGED, {
            detail: { isRunning: false },
          })
        );

        if (!fromSync) {
          const emitTs = Date.now();
          console.warn("[StudyTimer] 🔄 RESET - Checking sync states:", {
            baseTimestamp: emitTs,
            isCountdownSync: currentSyncSettings.isCountdownSync,
            hasActiveSession,
            willEmitResetCountdownSync: !!currentSyncSettings.isCountdownSync,
            syncSettingsPreserved: true,
          });

          emitSyncEvent(SYNC_EVENTS.RESET_TIMER, emitTs);

          if (currentSyncSettings.isPomodoroSync) {
            console.log("[StudyTimer] ✅ Emitting resetPomodoroSync", {
              baseTimestamp: emitTs,
            });
            emitSyncEvent(SYNC_EVENTS.RESET_POMODORO, emitTs);
          }

          if (currentSyncSettings.isCountdownSync) {
            console.log("[StudyTimer] ✅ EMITTING resetCountdownSync", {
              baseTimestamp: emitTs,
              isCountdownSync: currentSyncSettings.isCountdownSync,
            });
            emitSyncEvent(SYNC_EVENTS.RESET_COUNTDOWN, emitTs);
          } else {
            console.log("[StudyTimer] ❌ NOT emitting resetCountdownSync", {
              isCountdownSync: currentSyncSettings.isCountdownSync,
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
      isPomodoroSync,
      isCountdownSync,
      updateModal,
      emitSyncEvent,
      emitMultipleSyncEvents,
    ]
  );

  // Event listeners con manejo optimizado de timestamps
  const createEventHandler = useCallback(
    (action: (baseTimestamp: number) => void, condition: () => boolean = () => true) => {
      return (event: CustomEvent) => {
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

  // Event listener for loading session duration
  useEventListener('loadSessionDuration', useCallback((event: CustomEvent) => {
    console.log('[StudyTimer] 📡 loadSessionDuration event received:', event.detail);
    const { duration, sessionId } = event.detail || {};
    
    if (typeof duration === 'number' && duration > 0) {
      console.log('[StudyTimer] 📊 Loading session duration:', { duration, sessionId });
      
      // Update the timer state with the loaded duration
      updateStudyState({
        time: duration,
        timeAtStart: duration,
        isRunning: false,
        lastStart: null,
        sessionStatus: "active",
      });
      
      console.log('[StudyTimer] ✅ Updated study state with duration');
      
      // Update timer time display
      updateTimerTime(duration, false);
      
      console.log('[StudyTimer] ✅ Updated timer time display');
      
      // Save to localStorage for persistence
      const savedState = getFromLocalStorage(STORAGE_KEYS.STUDY_TIMER_STATE);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        saveToLocalStorage(STORAGE_KEYS.STUDY_TIMER_STATE, {
          ...parsed,
          time: duration,
          timeAtStart: duration,
          isRunning: false,
          lastStart: null,
        });
        
        console.log('[StudyTimer] 💾 Saved duration to localStorage');
      }
    } else {
      console.log('[StudyTimer] ❌ Invalid duration or duration is 0:', { duration, sessionId });
    }
  }, [updateStudyState, updateTimerTime]));

  // Función para formatear duración
  const formatDuration = useCallback((totalSeconds: number): string => {
    const roundedSeconds = Math.round(totalSeconds);
    const hours = Math.floor(roundedSeconds / 3600);
    const minutes = Math.floor((roundedSeconds % 3600) / 60);
    const seconds = roundedSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  }, []);

  // Función para calcular pomodoros automáticamente basados en la duración
  // Un pomodoro = 60 minutos (50 trabajo + 10 descanso)
  // Solo aplica a sesiones de estudio, no a sesiones de pomodoro específicas
  const calculatePomodorosFromDuration = useCallback((totalSeconds: number, sessionType: string = 'study'): number => {
    if (sessionType === 'pomodoro') {
      // Para sesiones de pomodoro específicas, no calcular automáticamente
      // ya que usan su propio sistema de conteo manual
      return 0;
    }
    const totalMinutes = Math.floor(totalSeconds / 60);
    return Math.floor(totalMinutes / 60); // Un pomodoro cada 60 minutos
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
        // Obtener pomodoros DIARIOS desde la fuente autoritativa local
        let pomodorosToday = 0;
        try {
          const today = new Date().toISOString().split('T')[0];
          pomodorosToday = parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || '0', 10) || 0;
        } catch {}

        const updateData: any = {
          duration: formattedDuration,
          tasks_completed: completedTasks.length,
          ended_at: endedAt,
          pomodoros_completed: pomodorosToday,
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

        // Ensure title is accurate: refetch session name right before opening summary
        let latestTitle: string | undefined;
        try {
          const { data: latest, error: latestErr } = await supabase
            .from("study_laps")
            .select("name")
            .eq("id", currentSessionId)
            .maybeSingle();
          if (!latestErr && latest?.name) {
            latestTitle = latest.name;
            updateStudyState({ sessionTitle: latestTitle as string });
          }
        } catch (e) {
          console.warn("Could not refresh session name for summary:", e);
        }

        setSummaryData({
          duration: formattedDuration,
          tasksCount: completedTasks.length,
          pomodoros: pomodorosToday,
          title: latestTitle || studyState.sessionTitle || "Untitled Session",
        });

        // Dispatch event to notify that a session was completed
        window.dispatchEvent(new CustomEvent('sessionCompleted', {
          detail: {
            sessionId: currentSessionId,
            duration: formattedDuration,
            pomodoros: pomodorosToday,
            tasksCompleted: completedTasks.length
          }
        }));

        updateModal("isSummaryOpen", true);
        window.dispatchEvent(new CustomEvent(SYNC_EVENTS.REFRESH_STATS));
      }

      window.dispatchEvent(new CustomEvent(SYNC_EVENTS.FINISH_SESSION));

      // Reset session state - ensure timer shows 00:00:00 immediately
      studyControls.reset();
      updateSessionId(null);
      setCurrentSession(null);
      
      // Force immediate timer display update to 00:00:00
      updateStudyState({
        time: 0,
        isRunning: false,
        lastStart: null,
        timeAtStart: 0,
        sessionStatus: "inactive",
        lastPausedAt: null,
      });
      
      // Also update the timer time directly to ensure immediate UI update
      updateTimerTime(0, false);
      
      // Clear any stored timer state in localStorage
      [
        STORAGE_KEYS.STUDY_TIMER_STATE,
        STORAGE_KEYS.STUDY_TIMER_STARTED_AT,
      ].forEach((key) => localStorage.removeItem(key));
      
      // Force a re-render of the timer display
      forceUpdate({});
      
      // Remove optional properties instead of setting to undefined
      const { sessionTitle, sessionDescription, ...resetState } = studyState;
      updateStudyState(resetState);
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
    calculatePomodorosFromDuration,
    updateModal,
    studyControls,
    updateSessionId,
    updateStudyState,
    isPomodoroSync,
    isCountdownSync,
    emitSyncEvent,
    updateTimerTime,
  ]);

  // Función para manejar salida de sesión
  const handleExitSession = useCallback(() => {
    setExitChoiceOpen(true);
  }, []);

  const handleJustExit = useCallback(() => {
    // Do not delete; just stop tracking current session locally
    studyControls.reset();
    updateSessionId(null);
    setCurrentSession(null);
    
    // Force immediate timer display update to 00:00:00
    updateStudyState({
      time: 0,
      isRunning: false,
      lastStart: null,
      timeAtStart: 0,
      sessionStatus: "inactive",
    });
    
    // Also update the timer time directly to ensure immediate UI update
    updateTimerTime(0, false);
    
    // Remove optional properties instead of setting to undefined
    const { sessionTitle, sessionDescription, ...resetState } = studyState;
    updateStudyState(resetState);
    setExitChoiceOpen(false);
  }, [studyControls, updateSessionId, updateStudyState, studyState, updateTimerTime]);

  const handleExitAndDelete = useCallback(() => {
    setExitChoiceOpen(false);
    updateModal("isDeleteModalOpen", true);
  }, [updateModal]);

  // Función para manejar inicio de sesión
  const handleStartSession = useCallback(
    async ({ sessionId, title, description, syncPomo, syncCountdown }: {
      sessionId?: string;
      title: string;
      description?: string;
      syncPomo?: boolean;
      syncCountdown?: boolean;
    }) => {
      console.log('[StudyTimer] 🚀 handleStartSession called with:', {
        sessionId,
        title,
        description,
        syncPomo,
        syncCountdown
      });
      
      try {
        if (!sessionId) {
          console.log('[StudyTimer] ❌ No sessionId provided, returning early');
          return;
        }

        console.log('[StudyTimer] 📝 Updating session ID:', sessionId);
        updateSessionId(sessionId);

        // Fetch started_at, ended_at and duration to seed timer time appropriately
        let initialSeconds = 0;
        try {
          console.log('[StudyTimer] 📊 Fetching session data from database...');
          const { data: lap, error } = await supabase
            .from("study_laps")
            .select("started_at, ended_at, duration")
            .eq("id", sessionId)
            .maybeSingle();
            
          console.log('[StudyTimer] 📋 Database response:', { lap, error });
          
          if (error) throw error;

          const parseHms = (hms?: string | null): number => {
            if (!hms) return 0;
            const parts = hms.split(":");
            if (parts.length !== 3) return 0;
            const [hh, mm, ss] = parts.map((p) => parseInt(p, 10));
            if ([hh, mm, ss].some((v) => Number.isNaN(v) || v === undefined)) return 0;
            return (hh || 0) * 3600 + (mm || 0) * 60 + (ss || 0);
          };

          const durationSeconds = parseHms(lap?.duration);
          const isUnfinished = !lap?.ended_at;

          console.log('[StudyTimer] ⏱️ Parsed session data:', {
            duration: lap?.duration,
            durationSeconds,
            started_at: lap?.started_at,
            ended_at: lap?.ended_at,
            isUnfinished
          });

          if (isUnfinished) {
            // Unfinished session: trust the accumulated duration from DB
            initialSeconds = durationSeconds;
            console.log('[StudyTimer] ⏰ Using unfinished session duration:', initialSeconds);
          } else {
            // Finished session: prefer stored duration, fallback to timestamps
            if (durationSeconds > 0) {
              initialSeconds = durationSeconds;
              console.log('[StudyTimer] ⏰ Using finished session duration:', initialSeconds);
            } else if (lap?.started_at && lap?.ended_at) {
              initialSeconds = Math.max(
                0,
                Math.floor(
                  (new Date(lap.ended_at).getTime() - new Date(lap.started_at).getTime()) / 1000
                )
              );
              console.log('[StudyTimer] ⏰ Calculated duration from timestamps:', initialSeconds);
            } else {
              console.log('[StudyTimer] ⏰ No duration data found, using 0');
            }
          }
        } catch (fe) {
          console.warn("Could not seed timer from DB, falling back to 0:", fe);
        }

        const stateUpdates: Partial<StudyState> = {
          sessionStatus: "active",
          time: initialSeconds,
        };
        
        if (title) {
          stateUpdates.sessionTitle = title;
        } else if (studyState.sessionTitle) {
          stateUpdates.sessionTitle = studyState.sessionTitle;
        }
        if (description) {
          stateUpdates.sessionDescription = description;
        } else if (studyState.sessionDescription) {
          stateUpdates.sessionDescription = studyState.sessionDescription;
        }
        
        console.log('[StudyTimer] 📊 Updating study state:', stateUpdates);
        updateStudyState(stateUpdates);

        if (typeof syncPomo === "boolean") {
          console.log('[StudyTimer] 🔄 Setting syncPomodoroWithTimer:', syncPomo);
          setSyncPomodoroWithTimer(!!syncPomo);
        }
        if (typeof syncCountdown === "boolean") {
          console.log('[StudyTimer] 🔄 Setting syncCountdownWithTimer:', syncCountdown);
          setSyncCountdownWithTimer(!!syncCountdown);
        }

        console.log('[StudyTimer] 📱 Closing start modal');
        updateModal("isStartModalOpen", false);

        // Auto-start the timer when session begins
        console.log('[StudyTimer] ▶️ Auto-starting timer with initial seconds:', initialSeconds);
        studyControls.start(Date.now(), true, initialSeconds);
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
      updateModal,
      studyControls,
    ]
  );

  // SessionsModal handlers
  const handleSessionSelected = useCallback(async (sessionId: string) => {
    console.log('[StudyTimer] 📅 Session selected:', sessionId);
    
    if (!sessionId) {
      console.log('[StudyTimer] ❌ No sessionId provided');
      return;
    }

    try {
      const { data: session, error: fetchError } = await supabase
        .from('study_laps')
        .select('name, description, duration, pomodoros_completed')
        .eq('id', sessionId)
        .single();

      if (fetchError) {
        console.error("Error fetching session details:", fetchError);
        toast.error("Error loading session");
        return;
      }

      // Update the session to resume it
      const { error: updateError } = await supabase
        .from('study_laps')
        .update({
          ended_at: null,
          started_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error("Error resuming session:", updateError);
        toast.error("Error resuming session");
        return;
      }

      console.log('[StudyTimer] ✅ Session resumed successfully');

      // Load existing session data
      if (session.duration) {
        const [hours, minutes, seconds] = session.duration.split(':').map(Number);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        window.dispatchEvent(new CustomEvent('loadSessionDuration', { detail: totalSeconds }));
      }

      if (session.pomodoros_completed !== null && session.pomodoros_completed !== undefined) {
        window.dispatchEvent(new CustomEvent('loadSessionPomodoros', {
          detail: {
            pomodoros: session.pomodoros_completed,
            sessionId,
          }
        }));
      }

      // Update session ID and start
      updateSessionId(sessionId);
      updateModal("isSessionsModalOpen", false);

      // Auto-start the timer
      const initialSeconds = session.duration ? 
        session.duration.split(':').reduce((acc: number, time: string, idx: number) => acc + parseInt(time) * Math.pow(60, 2 - idx), 0) : 0;
      
      studyControls.start(Date.now(), true, initialSeconds);

    } catch (error) {
      console.error('[StudyTimer] 💥 Error in handleSessionSelected:', error);
      toast.error("Error starting session");
    }
  }, [updateSessionId, updateModal, studyControls]);

  const handleStartNewSession = useCallback(() => {
    console.log('[StudyTimer] 🆕 Start New Session requested');
    updateModal("isSessionsModalOpen", false);
    updateModal("isStartModalOpen", true);
  }, [updateModal]);

  const handleFinishAllSessions = useCallback(async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) return;

      const now = new Date().toISOString();
      const { data: sessions, error: fetchError } = await supabase
        .from("study_laps")
        .select("id, started_at, duration")
        .is("ended_at", null)
        .eq("user_id", authData.user.id);

      if (fetchError) throw fetchError;
      if (!sessions || sessions.length === 0) return;

      const toHMS = (totalSeconds: number) => {
        const s = Math.max(0, Math.floor(totalSeconds));
        const h = Math.floor(s / 3600).toString().padStart(2, "0");
        const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
        const sec = (s % 60).toString().padStart(2, "0");
        return `${h}:${m}:${sec}`;
      };

      const parseHMS = (hms: string) => {
        const parts = hms.split(":");
        if (parts.length !== 3) return 0;
        const [h, m, s] = parts.map((p) => parseInt(p, 10));
        return (Number.isFinite(h || 0) ? (h || 0) : 0) * 3600 + (Number.isFinite(m || 0) ? (m || 0) : 0) * 60 + (Number.isFinite(s || 0) ? (s || 0) : 0);
      };

      const updates = sessions.map((session) => {
        const existingSec = parseHMS(session.duration as any);
        const payload: any = { ended_at: now };
        if (!existingSec || existingSec <= 0) {
          const seconds = Math.floor((Date.now() - new Date(session.started_at as any).getTime()) / 1000);
          payload.duration = toHMS(seconds);
        }
        return supabase.from("study_laps").update(payload).eq("id", session.id).eq("user_id", authData.user.id);
      });

      await Promise.all(updates);
      toast.success("All unfinished sessions finished");
    } catch (error) {
      console.error("Error finishing all sessions:", error);
      toast.error("Error finishing sessions");
    }
  }, []);

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
      setCurrentSession(null);
      
      // Force immediate timer display update to 00:00:00
      updateStudyState({
        time: 0,
        isRunning: false,
        lastStart: null,
        timeAtStart: 0,
        sessionStatus: "inactive",
      });
      
      // Also update the timer time directly to ensure immediate UI update
      updateTimerTime(0, false);
      
      updateModal("isDeleteModalOpen", false);
      // Remove optional properties instead of setting to undefined
      const { sessionTitle, sessionDescription, ...resetState } = studyState;
      updateStudyState(resetState);

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
    updateModal,
    updateStudyState,
    isPomodoroSync,
    isCountdownSync,
    emitSyncEvent,
    updateTimerTime,
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
    (adjustment: number, label: string) => (
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
    onSyncChange?.(isPomodoroSync);
  }, [studyState, onSyncChange, currentSessionId, isStudyRunningRedux]);

  // Otros efectos necesarios
  useEffect(() => {
    if (currentSessionId) {
      // Fetch session details directly instead of using function dependency
      const fetchDetails = async () => {
        try {
          console.log('[StudyTimer] 📋 Fetching session details for:', currentSessionId);
          const { data: session, error } = await supabase
            .from('study_laps')
            .select('name, description')
            .eq('id', currentSessionId)
            .single();
          
          if (session && !error) {
            console.log('[StudyTimer] ✅ Session details fetched:', {
              name: session.name,
              description: session.description
            });
            
            // Update both summaryData and studyState
            setSummaryData(prev => ({
              ...prev,
              title: session.name || '',
              description: session.description || ''
            }));
            
            // Also update studyState.sessionTitle to ensure hover shows correct title
            updateStudyState({
              sessionTitle: session.name || '',
              sessionDescription: session.description || ''
            });
          } else if (error) {
            console.error('[StudyTimer] ❌ Error fetching session details:', error);
          } else {
            console.warn('[StudyTimer] ⚠️ No session data found for ID:', currentSessionId);
          }
        } catch (error) {
          console.error('Error fetching session details:', error);
        }
      };
      
      fetchDetails();
    }
  }, [currentSessionId, updateStudyState]);

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

    const handleGlobalSync = (event: Event) => {
      const { isRunning: globalIsRunning } = (event as CustomEvent).detail;

      if (globalIsRunning !== isStudyRunningRedux) {
        if (globalIsRunning) {
          studyControls.start(Date.now(), true);
        } else {
          studyControls.pause(true);
        }
      }
    };

    const handleGlobalReset = (event: Event) => {
      const { resetKey: globalResetKey } = (event as CustomEvent).detail;
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

  // Fetch sessions count for today - logic now inlined in useEffect below

  useEffect(() => {
    // Fetch sessions count directly instead of using function dependency
    const fetchCount = async () => {
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
    };
    
    fetchCount();
  }, []);

  // Define studyTick function for useStudyTimer hook
  const studyTick = useCallback(
    (elapsed: number) => {
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
        className="relative group text-3xl md:text-4xl xl:text-5xl font-mono mb-4 lg:mb-4 text-center text-[var(--text-primary)]"
        role="timer"
        aria-label="Current session time"
      >
        <span>{formatStudyTime(safeNumber(studyState.time), false)}</span>
        {currentSessionId && (
          <div className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 hidden group-hover:block bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] shadow-xl min-w-[180px] text-center">
            <div className="font-semibold mb-1">Session Title</div>
            <div 
              onMouseEnter={() => console.log('[StudyTimer] 🖱️ Hover - sessionTitle:', studyState.sessionTitle, 'summaryData.title:', summaryData.title)}
            >
              {studyState.sessionTitle || summaryData.title || "No Session"}
            </div>
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
              onClick={() => studyControls.reset()}
              className="control-button flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Reset timer"
              title="Reset timer"
            >
              <RotateCcw size={20} style={{ color: "var(--accent-primary)" }} />
            </button>
            {!isStudyRunningRedux ? (
              <button
                onClick={() => studyControls.start(Date.now(), false)}
                className="control-button flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label={currentSessionId ? "Resume timer" : "Start session"}
                title={currentSessionId ? "Resume timer" : "Start session"}
              >
                <Play size={20} style={{ color: "var(--accent-primary)" }} />
              </button>
            ) : (
              <button
                onClick={() => studyControls.pause()}
                className="control-button flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Pause timer"
                title="Pause timer"
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
              title="Exit session"
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
              title="Finish session"
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
      <SessionsModal
        isOpen={modalStates.isSessionsModalOpen}
        onClose={() => updateModal("isSessionsModalOpen", false)}
        onSessionSelected={handleSessionSelected}
        onFinishAllSessions={handleFinishAllSessions}
        onStartNewSession={handleStartNewSession}
      />

      <StartSessionModal
        isOpen={modalStates.isStartModalOpen}
        onClose={() => updateModal("isStartModalOpen", false)}
        onStart={handleStartSession}
      />

      {currentSessionId && (
        <FinishSessionModal
          isOpen={modalStates.isFinishModalOpen}
          onClose={() => updateModal("isFinishModalOpen", false)}
          onFinish={handleFinishSession}
          sessionId={currentSessionId}
          onSessionDetailsUpdated={fetchCurrentSessionDetails}
        />
      )}

      {currentSessionId && (
        <EditSessionModal
          isOpen={modalStates.isEditModalOpen}
          onClose={() => updateModal("isEditModalOpen", false)}
          sessionId={currentSessionId}
          onSessionDetailsUpdated={fetchCurrentSessionDetails}
        />
      )}

      <LoginPromptModal
        isOpen={modalStates.isLoginPromptOpen}
        onClose={() => updateModal("isLoginPromptOpen", false)}
      />

      <DeleteSessionModal
        isOpen={modalStates.isDeleteModalOpen}
        onClose={() => updateModal("isDeleteModalOpen", false)}
        onConfirm={handleConfirmDelete}
      />

      <ExitSessionChoiceModal
        isOpen={isExitChoiceOpen}
        onClose={() => setExitChoiceOpen(false)}
        onJustExit={handleJustExit}
        onExitAndDelete={handleExitAndDelete}
      />

      <SessionSummaryModal
        isOpen={modalStates.isSummaryOpen}
        onClose={() => updateModal("isSummaryOpen", false)}
        durationFormatted={summaryData.duration}
        completedTasksCount={summaryData.tasksCount}
        pomodorosCompleted={summaryData.pomodoros}
      />
    </div>
  );
};

export default StudyTimer;
