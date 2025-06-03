import { Check, Clock, MoreVertical, Pause, Play, RotateCcw, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { formatStudyTime, useStudyTimer } from "../../hooks/useTimers";
import { resetTimerState, setCurrentSession } from "../../store/slices/LapSlice";
import { useDispatch, useSelector } from "react-redux";

import DeleteSessionModal from '../modals/DeleteSessionModal';
import EditSessionModal from "../modals/EditSessionModal";
import FinishSessionModal from "../modals/FinishSessionModal";
import LoginPromptModal from "../modals/LoginPromptModal";
import StartSessionModal from "../modals/StartSessionModal";
import { supabase } from '../../config/supabaseClient';
import { toast } from "react-hot-toast";
import { useAuth } from '../../hooks/useAuth';
import useEventListener from "../../hooks/useEventListener";
import useTheme from "../../hooks/useTheme";

const StudyTimer = ({ onSyncChange }) => {
  const { accentPalette } = useTheme();
  const iconColor = accentPalette === "#ffffff" ? "#000000" : "#ffffff";
  const { isLoggedIn } = useAuth();
  const dispatch = useDispatch();
  const { currentSession } = useSelector((state) => state.laps);
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

  const [studyState, setStudyState] = useState(() => {
    const savedState = localStorage.getItem("studyTimerState");
    const activeSessionId = localStorage.getItem("activeSessionId");
    if (savedState) {
      const parsed = JSON.parse(savedState);
      return {
        ...parsed,
        sessionStatus: parsed.sessionStatus || 'inactive',
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
      if (studyState.isRunning && studyState.lastStart) {
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
  }, [studyState.isRunning, studyState.lastStart, studyState.timeAtStart]);

  useEffect(() => {
    const stateToSave = {
      time: studyState.time,
      isRunning: studyState.isRunning,
      lastStart: studyState.lastStart,
      timeAtStart: studyState.timeAtStart,
      sessionStatus: studyState.sessionStatus,
    };
    localStorage.setItem("studyTimerState", JSON.stringify(stateToSave));
    if (currentSessionId) {
      localStorage.setItem("activeSessionId", currentSessionId);
    } else {
      localStorage.removeItem("activeSessionId");
    }
    onSyncChange?.(studyState.syncPomo);
  }, [studyState, onSyncChange, currentSessionId]);

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
  // useStudyTimer(
  //   studyTick,
  //   studyState.isRunning,
  //   studyState.timeAtStart,
  //   studyState.lastStart
  // );

  // Remove the pause on page change event listener
  useEventListener("pauseTimerSync", () => {
    // Do nothing - we want the timer to keep running
  }, [studyState.syncPomo, studyState.isRunning]);

  // Add a useEffect to dispatch sync state changes from StudyTimer
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("studyTimerSyncStateChanged", { detail: { isSyncedWithStudyTimer } }));
    localStorage.setItem('isSyncedWithStudyTimer', JSON.stringify(isSyncedWithStudyTimer));
  }, [isSyncedWithStudyTimer]);

  const studyControls = {
    start: async () => {
      if (!studyState.isRunning && !isHandlingEvent) {
        if (!isLoggedIn) {
          setIsLoginPromptOpen(true);
          return;
        }
        
        if (currentSessionId) {
          const now = Date.now();
          console.log('Timer Started:', {
            timestamp: new Date(now).toISOString(),
            timeAtStart: studyState.time,
            sessionId: currentSessionId
          });

          setStudyState((prev) => ({
            ...prev,
            isRunning: true,
            lastStart: now,
            timeAtStart: prev.time,
            sessionStatus: 'active'
          }));

          window.dispatchEvent(
            new CustomEvent("studyTimerStateChanged", { detail: { isRunning: true } })
          );

          // If synced with Pomodoro, start it too
          if (isSyncedWithStudyTimer) {
            window.dispatchEvent(new CustomEvent("playTimerSync"));
          }
        } else {
          setIsStartModalOpen(true);
        }
      }
    },
    pause: () => {
      if (studyState.isRunning && !isHandlingEvent) {
        const now = Date.now();
        const elapsed = studyState.timeAtStart + ((now - studyState.lastStart) / 1000);

        console.log('Timer Paused:', {
          timestamp: new Date(now).toISOString(),
          elapsedTime: elapsed.toFixed(2),
          sessionId: currentSessionId
        });

        setStudyState((prev) => ({
          ...prev,
          isRunning: false,
          time: elapsed,
          lastStart: null,
          timeAtStart: elapsed,
          sessionStatus: 'paused'
        }));

        window.dispatchEvent(
          new CustomEvent("studyTimerStateChanged", { detail: { isRunning: false } })
        );

        // If synced with Pomodoro, pause it too
        if (isSyncedWithStudyTimer) {
          window.dispatchEvent(new CustomEvent("pauseTimerSync"));
        }
      }
    },
    reset: () => {
      console.log('Timer Reset:', {
        timestamp: new Date().toISOString(),
        finalTime: studyState.time.toFixed(2),
        sessionId: currentSessionId
      });

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

      // If synced with Pomodoro, reset it too
      if (isSyncedWithStudyTimer) {
        window.dispatchEvent(new CustomEvent("resetPomodoro"));
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

  const handleFinishSession = async (completedTaskIds) => {
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

      // Calculate the total duration
      const totalDurationSeconds = studyState.time;
      // Round to the nearest whole second
      const roundedDurationSeconds = Math.round(totalDurationSeconds);

      const hours = Math.floor(roundedDurationSeconds / 3600);
      const minutes = Math.floor((roundedDurationSeconds % 3600) / 60);
      const seconds = roundedDurationSeconds % 60;
      const formattedDuration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      // Only finalize if duration is not 00:00:00
      if (formattedDuration !== '00:00:00') {
        const { error } = await supabase
          .from('study_laps')
          .update({
            duration: formattedDuration,
            tasks_completed: completedTaskIds.length,
            ended_at: new Date().toISOString()
          })
          .eq('id', currentSessionId);

        if (error) {
          console.error('Error updating study lap:', error);
          toast.error('Failed to update session details.');
          return;
        }

        // Display success message
        toast.success(`Congrats! During this session you completed ${completedTaskIds.length} tasks and studied for ${hours} hours and ${minutes} minutes.`, {
          position: 'top-right',
          style: {
            backgroundColor: 'var(--accent-primary)',
            color: '#f3f4f6',
          },
        });
      }

      // Reset session state
      studyControls.reset();
      setCurrentSessionId(null);
      dispatch(setCurrentSession(null));
      localStorage.removeItem("activeSessionId");

      // If synced with Pomodoro, reset it too
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
        sessionTitle: sessionData.title
      }));

      // Update sessions today count
      fetchSessionsTodayCount();

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

      // If synced with Pomodoro, reset it too
      if (isSyncedWithStudyTimer) {
         window.dispatchEvent(new CustomEvent("resetPomodoro"));
      }

    } catch (error) {
      console.error('Error exiting session:', error);
      toast.error('An error occurred while exiting the session.');
    }
  };

  return (
    <div className="flex flex-col items-center h-full">
      {/* Header: Icon, Title, Settings Button */}
      <div className="flex items-center justify-between w-full px-4 mb-6">
        {/* Left side: Icon and Title */}
        <div className="flex items-center gap-2">
          <Clock size={24} />
          <h2 className="text-xl font-semibold sm:text-sm">Study Timer</h2>
        </div>

        {/* Right side: Settings Button or Placeholder */}
        <div className="ml-auto">
          {currentSessionId ? (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Configure session"
            >
              <MoreVertical size={20} />
            </button>
          ) : (
            // Placeholder to maintain alignment
            <div className="w-[28px]"></div> 
          )}
        </div>
      </div>

      <div className="text-4xl sm:text-5xl font-mono mb-6 text-center" role="timer" aria-label="Current session time">
        {formatStudyTime(Math.max(0, studyState.time), false)}
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
            if (isSyncedWithStudyTimer) {
              window.dispatchEvent(new CustomEvent("adjustPomodoroTime", { detail: { adjustment: -adjustment } }));
            }
          }}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Subtract 10 minutes"
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
            if (isSyncedWithStudyTimer) {
              window.dispatchEvent(new CustomEvent("adjustPomodoroTime", { detail: { adjustment: -adjustment } }));
            }
          }}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Subtract 5 minutes"
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
            if (isSyncedWithStudyTimer) {
              window.dispatchEvent(new CustomEvent("adjustPomodoroTime", { detail: { adjustment: -adjustment } }));
            }
          }}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Add 5 minutes"
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
            if (isSyncedWithStudyTimer) {
              window.dispatchEvent(new CustomEvent("adjustPomodoroTime", { detail: { adjustment: -adjustment } }));
            }
          }}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Add 10 minutes"
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
          <RotateCcw size={20} style={{ color: "var(--accent-primary)" }} />
        </button>
        {!studyState.isRunning ? (
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
                if (studyState.isRunning) {
                  studyControls.pause();
                }
                setIsFinishModalOpen(true);
              }}
              className="control-button flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Finish session"
            >
              <Check size={20} style={{ color: "var(--accent-primary)" }} />
            </button>
          </>
        )}
      </div>

      <div className="text-base text-[var(--text-secondary)] mt-4 text-center">
        {/* Reordered session information display with Sessions Today first */}
        <div className="mb-1">
          Sessions Today: {sessionsTodayCount}
        </div>
        <div>
          Session Status: <span className={`font-semibold ${
            studyState.sessionStatus === 'inactive' ? 'text-[var(--text-secondary)]' : 
            studyState.sessionStatus === 'active' ? 'text-green-500' : 'text-yellow-500'
          }`}>
            {studyState.sessionStatus.charAt(0).toUpperCase() + studyState.sessionStatus.slice(1)}
          </span>
        </div>
        <div>
          Session Name: <span className="text-[var(--accent-primary)]">{studyState.sessionTitle || 'None yet'}</span>
        </div>
      </div>

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