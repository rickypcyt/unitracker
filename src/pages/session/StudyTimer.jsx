import { Check, CheckSquare, Clock, FileText, Link2, Link2Off, MoreVertical, Pause, Play, RotateCcw, Square, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { formatStudyTime, useStudyTimer } from "@/hooks/useTimers";
import { resetTimerState, setCurrentSession } from "@/store/slices/LapSlice";
import { setSyncCountdownWithTimer, setSyncPomodoroWithTimer } from '@/store/slices/uiSlice';
import { useDispatch, useSelector } from "react-redux";

import DeleteSessionModal from '@/modals/DeleteSessionModal';
import EditSessionModal from "@/modals/EditSessionModal";
import FinishSessionModal from "@/modals/FinishSessionModal";
import LoginPromptModal from "@/modals/LoginPromptModal";
import SectionTitle from '@/components/SectionTitle';
import StartSessionModal from "@/modals/StartSessionModal";
import moment from 'moment';
import { setStudyRunning } from "@/store/slices/uiSlice";
import { supabase } from '@/utils/supabaseClient';
import { toast } from "react-hot-toast";
import { useAuth } from '@/hooks/useAuth';
import useEventListener from "@/hooks/useEventListener";
import useTheme from "@/hooks/useTheme";

const StudyTimer = ({ onSyncChange }) => {
  const { accentPalette } = useTheme();
  const iconColor = accentPalette === "#ffffff" ? "#000000" : "#ffffff";
  const { isLoggedIn } = useAuth();
  const dispatch = useDispatch();
  const { currentSession } = useSelector((state) => state.laps);
  const isStudyRunningRedux = useSelector((state) => state.ui.isStudyRunning);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    // Try to get active session from localStorage
    const savedSessionId = localStorage.getItem("activeSessionId");
    return savedSessionId || null;
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPauseFromSync, setIsPauseFromSync] = useState(false);
  const [isHandlingEvent, setIsHandlingEvent] = useState(false);
  const [sessionsTodayCount, setSessionsTodayCount] = useState(0);
  const [isSyncedWithStudyTimer, setIsSyncedWithStudyTimer] = useState(() => {
    const savedState = localStorage.getItem('isSyncedWithStudyTimer');
    return savedState ? JSON.parse(savedState) : false;
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(null);

  // Handler para el toggle visual

  const [studyState, setStudyState] = useState(() => {
    const savedState = localStorage.getItem("studyTimerState");
    const activeSessionId = localStorage.getItem("activeSessionId");
    if (savedState) {
      let parsed;
      try {
        parsed = JSON.parse(savedState);
      } catch {
        parsed = {};
      }
      return {
        time: Number.isFinite(Number(parsed.time)) ? Number(parsed.time) : 0,
        isRunning: typeof parsed.isRunning === 'boolean' ? parsed.isRunning : false,
        lastStart: Number.isFinite(Number(parsed.lastStart)) ? Number(parsed.lastStart) : null,
        timeAtStart: Number.isFinite(Number(parsed.timeAtStart)) ? Number(parsed.timeAtStart) : 0,
        sessionStatus: typeof parsed.sessionStatus === 'string' ? parsed.sessionStatus : 'inactive',
      };
    }
    return {
      time: 0,
      isRunning: false,
      lastStart: null,
      timeAtStart: 0,
      sessionStatus: 'inactive',
    };
  });

  // Function to fetch and update current session details
  const fetchCurrentSessionDetails = useCallback(async () => {
    if (!currentSessionId) return;
    try {
      const { data: session, error } = await supabase
        .from('study_laps')
        .select('name, description')
        .eq('id', currentSessionId)
        .single();

      if (error) {
        console.error('Error fetching current session details:', error);
        return;
      }

      if (session) {
        setStudyState(prev => ({ ...prev, sessionTitle: session.name, sessionDescription: session.description }));
      }
    } catch (error) {
      console.error('Error in fetchCurrentSessionDetails:', error);
    }
  }, [currentSessionId, setStudyState]);

  // Effect to fetch details when modal closes or session ID changes
  useEffect(() => {
    // This effect will trigger fetchCurrentSessionDetails when currentSessionId changes
    // or when modals close and update a state that causes StudyTimer to re-render.
    // A more explicit way would be to pass the fetch function to modals.
    if (currentSessionId) {
       fetchCurrentSessionDetails();
    }
  }, [currentSessionId, fetchCurrentSessionDetails]); // Add fetchCurrentSessionDetails as dependency

  // Timer logic
  useEffect(() => {
    const syncTimer = () => {
      if (isStudyRunningRedux && studyState.lastStart) {
        const now = Date.now();
        const elapsed = studyState.timeAtStart + ((now - studyState.lastStart) / 1000);
        setStudyState(prev => ({
          ...prev,
          time: elapsed
        }));

        // Emit time update event for Pomodoro sync
        window.dispatchEvent(new CustomEvent("studyTimerTimeUpdate", { 
          detail: { time: elapsed } 
        }));
      }
    };

    // Sync immediately when component mounts
    syncTimer();

    // Set up interval to keep timer in sync
    const intervalId = setInterval(syncTimer, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isStudyRunningRedux, studyState.lastStart, studyState.timeAtStart]);

  useEffect(() => {
    // Solo guardar propiedades primitivas para evitar referencias circulares
    const stateToSave = {
      time: typeof studyState.time === 'number' ? studyState.time : 0,
      isRunning: typeof studyState.isRunning === 'boolean' ? studyState.isRunning : false,
      lastStart: typeof studyState.lastStart === 'number' ? studyState.lastStart : null,
      timeAtStart: typeof studyState.timeAtStart === 'number' ? studyState.timeAtStart : 0,
      sessionStatus: typeof studyState.sessionStatus === 'string' ? studyState.sessionStatus : 'inactive',
    };
    try {
      localStorage.setItem("studyTimerState", JSON.stringify(stateToSave));
    } catch (e) {
      // Si hay error de referencia circular, ignorar y loguear
      console.error('Error saving studyTimerState:', e);
    }
    if (currentSessionId) {
      localStorage.setItem("activeSessionId", currentSessionId);
    } else {
      localStorage.removeItem("activeSessionId");
    }
    onSyncChange?.(studyState.syncPomo);
  }, [studyState, onSyncChange, currentSessionId, isStudyRunningRedux]);

  useEffect(() => {
    const fetchSessionTitle = async () => {
      if (currentSessionId) {
        const { data: session, error } = await supabase
          .from('study_laps')
          .select('name')
          .eq('id', currentSessionId)
          .single();
        if (!error && session) {
          setStudyState(prev => ({
            ...prev,
            sessionTitle: session.name || 'Untitled Session'
          }));
        }
      }
    };
    fetchSessionTitle();
  }, [currentSessionId]);

  // Define studyTick function for useStudyTimer hook
  const studyTick = useCallback((elapsed) => {
    setStudyState(prev => ({
      ...prev,
      time: elapsed
    }));
  }, []);

  // Use the useStudyTimer hook for background timing
  useStudyTimer(
    studyTick,
    studyState.timeAtStart,
    studyState.lastStart
  );

  // Remove the pause on page change event listener
  useEventListener("pauseTimerSync", () => {
    // Do nothing - we want the timer to keep running
  }, [studyState.syncPomo, isStudyRunningRedux]);

  // Add a useEffect to dispatch sync state changes from StudyTimer
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("studyTimerSyncStateChanged", { detail: { isSyncedWithStudyTimer } }));
    localStorage.setItem('isSyncedWithStudyTimer', JSON.stringify(isSyncedWithStudyTimer));
  }, [isSyncedWithStudyTimer]);

  useEventListener("playTimerSync", (event) => {
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    if (lastSyncTimestamp === baseTimestamp) return;
    setLastSyncTimestamp(baseTimestamp);
    if (!isStudyRunningRedux) {
      studyControls.start(baseTimestamp, true); // true = viene de sync
    }
  }, [isStudyRunningRedux, lastSyncTimestamp]);

  useEventListener("pauseTimerSync", (event) => {
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    if (lastSyncTimestamp === baseTimestamp) return;
    setLastSyncTimestamp(baseTimestamp);
    if (isStudyRunningRedux) {
      studyControls.pause(true); // true = viene de sync
    }
  }, [isStudyRunningRedux, lastSyncTimestamp]);

  useEventListener("resetTimerSync", (event) => {
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    if (lastSyncTimestamp === baseTimestamp) return;
    setLastSyncTimestamp(baseTimestamp);
    studyControls.reset(true); // true = viene de sync
  }, [lastSyncTimestamp]);

  const studyControls = {
    start: async (baseTimestamp, fromSync) => {
      if (!isStudyRunningRedux && !isHandlingEvent) {
        if (!isLoggedIn) {
          setIsLoginPromptOpen(true);
          return;
        }
        if (currentSessionId) {
          const now = baseTimestamp || Date.now();
          dispatch(setStudyRunning(true));
          setStudyState(prev => ({
            ...prev,
            isRunning: true,
            lastStart: now,
            timeAtStart: prev.time,
            sessionStatus: 'active'
          }));
          window.dispatchEvent(
            new CustomEvent("studyTimerStateChanged", { detail: { isRunning: true } })
          );
          if (!fromSync) {
            const syncFlag = localStorage.getItem('isSyncedWithStudyTimer') === 'true';
            if (syncFlag) {
              window.dispatchEvent(new CustomEvent("playTimerSync", { detail: { baseTimestamp: now } }));
            }
          }
        } else {
          setIsStartModalOpen(true);
        }
      }
    },
    pause: (fromSync) => {
      if (isStudyRunningRedux) {
        dispatch(setStudyRunning(false));
        setStudyState(prev => ({
          ...prev,
          isRunning: false,
          time: prev.time,
          lastStart: null,
          timeAtStart: prev.time,
          sessionStatus: 'paused',
          lastPausedAt: Date.now(),
        }));
        window.dispatchEvent(
          new CustomEvent("studyTimerStateChanged", { detail: { isRunning: false } })
        );
        if (!fromSync) {
          const now = Date.now();
          if (isPomodoroSync) {
            window.dispatchEvent(new CustomEvent("pausePomodoroSync", { detail: { baseTimestamp: now } }));
          }
          if (isCountdownSync) {
            window.dispatchEvent(new CustomEvent("pauseCountdownSync", { detail: { baseTimestamp: now } }));
          }
        }
      }
    },
    reset: (fromSync) => {
      if (isStudyRunningRedux) {
        dispatch(setStudyRunning(false));
      }
      setStudyState((prev) => ({
        ...prev,
        isRunning: false,
        time: 0,
        lastStart: null,
        timeAtStart: 0,
        sessionStatus: 'inactive'
      }));
      dispatch(resetTimerState());
      window.dispatchEvent(
        new CustomEvent("studyTimerStateChanged", { detail: { isRunning: false } })
      );
      if (!fromSync) {
        const syncFlag = localStorage.getItem('isSyncedWithStudyTimer') === 'true';
        if (syncFlag) {
          const now = Date.now();
          window.dispatchEvent(new CustomEvent("resetTimerSync", { detail: { baseTimestamp: now } }));
        }
      }
    },
    resume: () => {
      if (!isStudyRunningRedux && studyState.sessionStatus === 'active' && !isHandlingEvent) {
        const now = Date.now();
        dispatch(setStudyRunning(true));
        setStudyState(prev => ({ ...prev, lastStart: now }));
        const syncFlag = localStorage.getItem('isSyncedWithStudyTimer') === 'true';
        if (syncFlag) {
          window.dispatchEvent(new CustomEvent("playTimerSync", { detail: { baseTimestamp: now } }));
        }
      }
    },
  };

  // Add useEffect to recover state on page load
  useEffect(() => {
    const savedState = localStorage.getItem("studyTimerState");
    if (savedState) {
      const parsed = JSON.parse(savedState);
      setStudyState(prev => ({
        ...prev,
        ...parsed
      }));
    }
  }, []);

  // Add effect to reset sessions count at midnight
  useEffect(() => {
    const checkAndResetSessions = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const lastReset = localStorage.getItem('lastSessionsReset');

      if (lastReset !== today) {
        setSessionsTodayCount(0);
        localStorage.setItem('lastSessionsReset', today);
        localStorage.setItem('sessionsTodayCount', '0');
      }
    };

    // Check immediately on mount
    checkAndResetSessions();

    // Set up interval to check every minute
    const interval = setInterval(checkAndResetSessions, 60000);

    return () => clearInterval(interval);
  }, []);

  // Fetch sessions count for today
  const fetchSessionsTodayCount = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('study_laps')
        .select('id')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      if (error) throw error;
      setSessionsTodayCount(data.length);
      localStorage.setItem('sessionsTodayCount', data.length.toString());
    } catch (error) {
      console.error('Error fetching sessions count:', error);
    }
  }, []); // Add empty dependency array for useCallback

  // Add effect to fetch sessions count on mount and when needed
  useEffect(() => {
    fetchSessionsTodayCount();
  }, [fetchSessionsTodayCount]); // Add fetchSessionsTodayCount as dependency

  const handleFinishSession = async () => {
    try {
      if (!currentSessionId) return;

      // Get current session data
      const { data: session, error: fetchError } = await supabase
        .from('study_laps')
        .select('*')
        .eq('id', currentSessionId)
        .single();

      if (fetchError || !session) {
        console.error('Error fetching session:', fetchError);
        return;
      }

      // Get user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      // Get session time range
      const startedAt = session.started_at;
      const endedAt = new Date().toISOString();

      // Fetch all completed tasks for the user in the session time range
      const { data: completedTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, completed_at')
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('completed_at', startedAt)
        .lte('completed_at', endedAt);

      if (tasksError) {
        console.error('Error fetching completed tasks:', tasksError);
        toast.error('Failed to fetch completed tasks.');
        return;
      }

      // Calculate the total duration
      const totalDurationSeconds = studyState.time;
      const roundedDurationSeconds = Math.round(totalDurationSeconds);
      const hours = Math.floor(roundedDurationSeconds / 3600);
      const minutes = Math.floor((roundedDurationSeconds % 3600) / 60);
      const seconds = roundedDurationSeconds % 60;
      const formattedDuration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      // Only finalize if duration is not 00:00:00
      if (formattedDuration !== '00:00:00') {
        const pomodorosThisSession = parseInt(localStorage.getItem('pomodorosThisSession') || '0', 10);
        const { error } = await supabase
          .from('study_laps')
          .update({
            duration: formattedDuration,
            tasks_completed: completedTasks.length,
            ended_at: endedAt,
            pomodoros_completed: pomodorosThisSession,
          })
          .eq('id', currentSessionId);

        if (error) {
          console.error('Error updating study lap:', error);
          toast.error('Failed to update session details.');
          return;
        }

        toast.success(`Congrats! During this session you completed ${completedTasks.length} tasks and studied for ${hours} hours and ${minutes} minutes.`, {
          position: 'top-center',
          style: {
            backgroundColor: '#000',
            color: '#fff',
            border: '2px solid var(--border-primary)',
          },
        });
        window.dispatchEvent(new CustomEvent('refreshStats'));
      }

      // Dispatch finishSession event so Pomodoro can reset its session counter
      window.dispatchEvent(new CustomEvent('finishSession'));

      // Reset session state
      studyControls.reset();
      setCurrentSessionId(null);
      dispatch(setCurrentSession(null));
      localStorage.removeItem("activeSessionId");
      setStudyState(prev => ({ ...prev, sessionTitle: undefined, sessionDescription: undefined }));

      if (isSyncedWithStudyTimer) {
         window.dispatchEvent(new CustomEvent("resetPomodoro"));
      }

    } catch (error) {
      console.error('Error finishing session:', error);
      toast.error('An error occurred while finishing the session.');
    }
  };

  const handleStartSession = async (sessionData) => {
    try {
      const now = Date.now();
      
      // Use the session that was already created by StartSessionModal
      if (!sessionData.sessionId) {
        console.error('No session ID provided');
        return;
      }

      // Set both states to ensure session is active
      dispatch(setCurrentSession(sessionData.sessionId));
      setCurrentSessionId(sessionData.sessionId);
      setStudyState((prev) => ({
        ...prev,
        isRunning: true,
        lastStart: now,
        timeAtStart: prev.time,
        sessionStatus: 'active',
        sessionTitle: sessionData.title,
        syncPomo: sessionData.syncPomo,
        syncCountdown: sessionData.syncCountdown
      }));

      // Update sssions today count
      fetchSessionsTodayCount();

      // Dispatch session started event for Pomodoro to reset session counter
      window.dispatchEvent(new CustomEvent("sessionStarted"));

      window.dispatchEvent(
        new CustomEvent("studyTimerStateChanged", { detail: { isRunning: true } })
      );
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handleExitSession = async () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (currentSessionId) {
        // Delete the session from the database
        const { error } = await supabase
          .from('study_laps')
          .delete()
          .eq('id', currentSessionId);

        if (error) {
          console.error('Error deleting session:', error);
          toast.error('Failed to delete session.');
          return;
        }
      }

      // Reset all states
      studyControls.reset();
      setCurrentSessionId(null);
      dispatch(setCurrentSession(null));
      localStorage.removeItem("activeSessionId");
      setIsDeleteModalOpen(false);
      setStudyState(prev => ({ ...prev, sessionTitle: undefined, sessionDescription: undefined }));

      // If synced with Pomodoro, reset it too
      if (isSyncedWithStudyTimer) {
         window.dispatchEvent(new CustomEvent("resetPomodoro"));
      }

    } catch (error) {
      console.error('Error exiting session:', error);
      toast.error('An error occurred while exiting the session.');
    }
  };

  // Calcular tiempo desde el último pause
  let lastPausedAgo = null;
  if (currentSessionId && studyState.sessionStatus === 'paused' && studyState.lastStart === null) {
    // Buscar el último momento en que se pausó (cuando se puso lastStart a null)
    // Usar el timestamp de cuando se pausó: no se guarda explícitamente, pero podemos guardar uno nuevo
    // Solución: guardar un campo lastPausedAt en studyState cuando se pausa
  }

  const syncPomodoroWithTimer = useSelector(state => state.ui.syncPomodoroWithTimer);
  const syncCountdownWithTimer = useSelector(state => state.ui.syncCountdownWithTimer);
  // En vez de isSyncedWithStudyTimer, usar los flags de Redux
  const isPomodoroSync = syncPomodoroWithTimer;
  const isCountdownSync = syncCountdownWithTimer;

  // Al activar sync en mitad de sesión, emitir evento para alinear Pomodoro/Countdown con el tiempo actual
  useEffect(() => {
    if (isPomodoroSync) {
      window.dispatchEvent(new CustomEvent('studyTimerTimeUpdate', { detail: { time: studyState.time } }));
    }
    if (isCountdownSync) {
      window.dispatchEvent(new CustomEvent('studyTimerTimeUpdate', { detail: { time: studyState.time } }));
    }
  }, [isPomodoroSync, isCountdownSync]);

  return (
    <div className="flex flex-col items-center h-full">
      {/* Header: Icon, Title, Settings Button */}
      <div className="section-title justify-center mb-4 relative w-full px-4 py-3">
        <Clock size={24} className="icon" style={{ color: 'var(--accent-primary)' }} />
        <span className="font-bold text-lg sm:text-xl text-[var(--text-primary)] ml-1">Study Timer</span>
        {/* Botón de configuración de sesión */}
        {currentSessionId ? (
          <button
            onClick={() => setIsEditModalOpen(true)}
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
      <div className="relative group text-4xl sm:text-5xl font-mono mb-6 text-center" role="timer" aria-label="Current session time">
        <span>{formatStudyTime(Math.max(0, studyState.time), false)}</span>
        {currentSessionId && (
          <div className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 hidden group-hover:block bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] shadow-xl min-w-[180px] text-center">
            <div className="font-semibold mb-1">Session Title</div>
            <div>{studyState.sessionTitle || 'No Session'}</div>
            {/* Last paused info */}
            {studyState.sessionStatus === 'paused' && studyState.lastPausedAt && (
              <div className="mt-2 text-xs text-[var(--text-secondary)]">
                Last paused: {(() => {
                  const diffMs = Date.now() - studyState.lastPausedAt;
                  const diffMin = Math.floor(diffMs / 60000);
                  const diffHr = Math.floor(diffMin / 60);
                  const min = diffMin % 60;
                  if (diffHr > 0) {
                    return `${diffHr} hour${diffHr > 1 ? 's' : ''}${min > 0 ? ` and ${min} minute${min > 1 ? 's' : ''}` : ''} ago`;
                  } else {
                    return `${min} minute${min !== 1 ? 's' : ''} ago`;
                  }
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => {
            const adjustment = -600;
            const now = Date.now();
            if (studyState.isRunning) {
              const elapsed = studyState.timeAtStart + ((now - studyState.lastStart) / 1000);
              setStudyState(prev => ({
                ...prev,
                timeAtStart: Math.max(0, elapsed + adjustment),
                lastStart: now
              }));
            } else {
              setStudyState(prev => ({ ...prev, time: Math.max(0, prev.time + adjustment) }));
            }
            if (isPomodoroSync) {
              window.dispatchEvent(new CustomEvent("adjustPomodoroTime", { detail: { adjustment } }));
            }
            if (isCountdownSync) {
              window.dispatchEvent(new CustomEvent("adjustCountdownTime", { detail: { adjustment } }));
            }
          }}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Subtract 10 minutes"
          disabled={!currentSessionId}
        >
          -10
        </button>
        <button
          onClick={() => {
            const adjustment = -300;
            const now = Date.now();
            if (studyState.isRunning) {
              const elapsed = studyState.timeAtStart + ((now - studyState.lastStart) / 1000);
              setStudyState(prev => ({
                ...prev,
                timeAtStart: Math.max(0, elapsed + adjustment),
                lastStart: now
              }));
            } else {
              setStudyState(prev => ({ ...prev, time: Math.max(0, prev.time + adjustment) }));
            }
            if (isPomodoroSync) {
              window.dispatchEvent(new CustomEvent("adjustPomodoroTime", { detail: { adjustment } }));
            }
            if (isCountdownSync) {
              window.dispatchEvent(new CustomEvent("adjustCountdownTime", { detail: { adjustment } }));
            }
          }}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Subtract 5 minutes"
          disabled={!currentSessionId}
        >
          -5
        </button>
        <button
          onClick={() => {
            const adjustment = 300;
            const now = Date.now();
            if (studyState.isRunning) {
              const elapsed = studyState.timeAtStart + ((now - studyState.lastStart) / 1000);
              setStudyState(prev => ({
                ...prev,
                timeAtStart: elapsed + adjustment,
                lastStart: now
              }));
            } else {
              setStudyState(prev => ({ ...prev, time: prev.time + adjustment }));
            }
            if (isPomodoroSync) {
              window.dispatchEvent(new CustomEvent("adjustPomodoroTime", { detail: { adjustment } }));
            }
            if (isCountdownSync) {
              window.dispatchEvent(new CustomEvent("adjustCountdownTime", { detail: { adjustment } }));
            }
          }}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Add 5 minutes"
          disabled={!currentSessionId}
        >
          +5
        </button>
        <button
          onClick={() => {
            const adjustment = 600;
            const now = Date.now();
            if (studyState.isRunning) {
              const elapsed = studyState.timeAtStart + ((now - studyState.lastStart) / 1000);
              setStudyState(prev => ({
                ...prev,
                timeAtStart: elapsed + adjustment,
                lastStart: now
              }));
            } else {
              setStudyState(prev => ({ ...prev, time: prev.time + adjustment }));
            }
            if (isPomodoroSync) {
              window.dispatchEvent(new CustomEvent("adjustPomodoroTime", { detail: { adjustment } }));
            }
            if (isCountdownSync) {
              window.dispatchEvent(new CustomEvent("adjustCountdownTime", { detail: { adjustment } }));
            }
          }}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Add 10 minutes"
          disabled={!currentSessionId}
        >
          +10
        </button>
      </div>

      <div className="timer-controls flex justify-center items-center gap-3">
        <button
          onClick={studyControls.reset}
          className="control-button flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Reset timer"
        >
          <RotateCcw size={24} style={{ color: "var(--accent-primary)" }} />
        </button>
        {!isStudyRunningRedux ? (
          <button
            onClick={studyControls.start}
            className="control-button flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Start timer"
          >
            <Play size={24} style={{ color: "var(--accent-primary)" }} />
          </button>
        ) : (
          <button
            onClick={studyControls.pause}
            className="control-button flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Pause timer"
          >
            <Pause size={24} style={{ color: "var(--accent-primary)" }} />
          </button>
        )}
        {currentSessionId && (
          <>
            <button
              onClick={handleExitSession}
              className="control-button flex items-center justify-center bg-[var(--bg-secondary)] transition-colors"
              aria-label="Exit session"
            >
              <X size={24} style={{ color: "var(--accent-primary)" }} />
            </button>
            <button
              onClick={() => {
                if (isStudyRunningRedux) {
                  studyControls.pause();
                }
                setIsFinishModalOpen(true);
              }}
              className="control-button flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Finish session"
            >
              <Check size={24} style={{ color: "var(--accent-primary)" }} />
            </button>
          </>
        )}
      </div>
      
      <div className="flex flex-col gap-1 mt-4">
        {/* Controles de sincronización movidos al modal */}
      </div>

      {/* Quitar visualización directa de 'Last paused' debajo del timer */}

      <StartSessionModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        onStart={handleStartSession}
      />

      <FinishSessionModal
        isOpen={isFinishModalOpen}
        onClose={() => setIsFinishModalOpen(false)}
        onFinish={handleFinishSession}
        sessionId={currentSessionId}
        onSessionDetailsUpdated={fetchCurrentSessionDetails}
      />

      <EditSessionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        sessionId={currentSessionId}
        onSessionDetailsUpdated={fetchCurrentSessionDetails}
      />

      <LoginPromptModal
        isOpen={isLoginPromptOpen}
        onClose={() => setIsLoginPromptOpen(false)}
      />

      <DeleteSessionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default StudyTimer;