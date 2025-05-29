import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "../../utils/supabaseClient";
import { resetTimerState, setCurrentSession } from "../../redux/LapSlice";
import { createLap } from "../../redux/LapActions";
import { Play, Pause, RotateCcw, Check, Clock, X, MoreVertical } from "lucide-react";
import { useTheme } from "../../utils/ThemeContext";
import { useStudyTimer, formatStudyTime } from "../../hooks/useTimers";
import useEventListener from "../../hooks/useEventListener";
import StartSessionModal from "../modals/StartSessionModal";
import FinishSessionModal from "../modals/FinishSessionModal";
import EditSessionModal from "../modals/EditSessionModal";

const StudyTimer = ({ onSyncChange }) => {
  const { iconColor } = useTheme();
  const dispatch = useDispatch();
  const { currentSession } = useSelector((state) => state.laps);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [studyState, setStudyState] = useState(() => {
    const savedState = localStorage.getItem("studyTimerState");
    const activeSessionId = localStorage.getItem("activeSessionId");
    if (savedState) {
      const parsed = JSON.parse(savedState);
      return {
        ...parsed,
        syncPomo: localStorage.getItem("syncPomoWithTimer") === "true",
        sessionStatus: parsed.sessionStatus || 'inactive',
      };
    }
    return {
      time: 0,
      isRunning: false,
      syncPomo: true,
      lastStart: null,
      timeAtStart: 0,
      sessionStatus: 'inactive',
    };
  });

  useEffect(() => {
    const stateToSave = {
      time: studyState.time,
      isRunning: studyState.isRunning,
      syncPomo: studyState.syncPomo,
      lastStart: studyState.lastStart,
      timeAtStart: studyState.timeAtStart,
      sessionStatus: studyState.sessionStatus,
    };
    localStorage.setItem("studyTimerState", JSON.stringify(stateToSave));
    localStorage.setItem("syncPomoWithTimer", studyState.syncPomo.toString());
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
          .from('sessions')
          .select('title')
          .eq('id', currentSessionId)
          .single();
        if (!error && session) {
          setStudyState(prev => ({
            ...prev,
            sessionTitle: session.title || 'Untitled Session'
          }));
        }
      }
    };
    fetchSessionTitle();
  }, [currentSessionId]);

  const studyTick = useCallback((elapsed) => {
    setStudyState(prev => ({
      ...prev,
      time: elapsed,
    }));
  }, []);

  useStudyTimer(
    studyTick,
    studyState.isRunning,
    studyState.timeAtStart,
    studyState.lastStart
  );

  useEventListener("startStudyTimer", () => studyControls.start(), [studyState.syncPomo]);
  useEventListener("stopStudyTimer", () => studyControls.pause(), [studyState.syncPomo]);
  useEventListener("pauseTimerSync", () => { 
    if (studyState.syncPomo && studyState.isRunning) {
      studyControls.pause();
    }
  }, [studyState.syncPomo, studyState.isRunning]);
  useEventListener("resetTimerSync", () => { if (studyState.syncPomo) studyControls.reset(); }, [studyState.syncPomo]);
  useEventListener("playTimerSync", () => { if (studyState.syncPomo) studyControls.start(); }, [studyState.syncPomo]);

  const studyControls = {
    start: async () => {
      if (!studyState.isRunning) {
        if (currentSessionId) {
          // Si ya hay una sesión activa, reanuda el contador
          const now = Date.now();
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

          if (studyState.syncPomo) {
            window.dispatchEvent(new CustomEvent("startPomodoro"));
          }
        } else {
          // Si no hay sesión activa, abre el modal de inicio
          setIsStartModalOpen(true);
        }
      }
    },
    pause: () => {
      if (studyState.isRunning) {
        setStudyState((prev) => {
          const now = Date.now();
          const elapsed = prev.timeAtStart + ((now - prev.lastStart) / 1000);
          const newState = {
            ...prev,
            isRunning: false,
            time: elapsed,
            lastStart: null,
            timeAtStart: elapsed,
            sessionStatus: 'paused'
          };
          localStorage.setItem("studyTimerState", JSON.stringify(newState));
          return newState;
        });

        window.dispatchEvent(
          new CustomEvent("studyTimerStateChanged", { detail: { isRunning: false } })
        );

        if (studyState.syncPomo) {
          window.dispatchEvent(new CustomEvent("pausePomodoro"));
        }
      }
    },
    reset: () => {
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

      if (studyState.syncPomo) {
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

  const getCurrentSessionNumber = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("study_laps")
      .select("session_number")
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`)
      .order("session_number", { ascending: false })
      .limit(1);
    return error || !data.length ? 0 : data[0].session_number + 1;
  };

  const handleFinishSession = async (completedTaskIds) => {
    if (!currentSession || !currentSessionId) {
      console.warn('Attempted to finish session without currentSession or currentSessionId');
      return;
    }

    console.log('Attempting to finish session:', currentSessionId);
    console.log('Tasks completed count:', completedTaskIds.length);

    try {
      // Update session end time and tasks completed count based on final active tasks from modal
      const { data, error: sessionError } = await supabase
        .from('sessions')
        .update({
          ended_at: new Date().toISOString(),
          tasks_completed: completedTaskIds.length
        })
        .eq('id', currentSessionId)
        .select(); // Select updated data to confirm success

      if (sessionError) {
        console.error('Error updating session end time/tasks completed:', sessionError);
        // Decide if we should return here or try to save lap/reset anyway
        // For now, let's proceed to try to save the lap and reset timers
      } else {
        console.log('Session updated successfully:', data);
      }

      // The FinishSessionModal already updated the session_tasks table based on user selections.
      // We no longer need to update/delete session_tasks here.

      const sessionData = {
        name: `Session ${currentSession}`, // Or use sessionTitle if we pass it from modal, but lap name is different
        duration: formatStudyTime(studyState.time, true),
        description: "", // Or use sessionDescription
        session_number: currentSession,
        session_id: currentSessionId, // Link lap to the session
      };

      // Dispatch the action to create the lap
      dispatch(createLap(sessionData));

      // Reset timer state and session ID
      studyControls.reset();
      setCurrentSessionId(null);
      dispatch(setCurrentSession(null)); // Also reset the Redux currentSession

      // Also reset Pomodoro if it's being used
      window.dispatchEvent(new CustomEvent("resetPomodoro"));

    } catch (error) {
      console.error('Error finishing session:', error);
    }
  };

  const toggleSync = () => {
    setStudyState(prev => ({
      ...prev,
      syncPomo: !prev.syncPomo
    }));
  };

  const handleStartSession = async (sessionData) => {
    const now = Date.now();
    const sessionNum = await getCurrentSessionNumber();
    
    // Set both states to ensure session is active
    dispatch(setCurrentSession(sessionNum));
    setCurrentSessionId(sessionData.sessionId);
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

    if (studyState.syncPomo) {
      window.dispatchEvent(new CustomEvent("startPomodoro"));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex items-center gap-2 mb-6">
        <Clock size={24} />
        <h2 className="text-xl font-semibold">Study Timer</h2>
        {currentSessionId && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="ml-2 p-1 rounded-full text-neutral-400 hover:text-white transition-colors"
            aria-label="Configure session"
          >
            <MoreVertical size={20} />
          </button>
        )}
      </div>

      <div className="text-4xl sm:text-5xl font-mono mb-6 text-center" role="timer" aria-label="Current session time">
        {formatStudyTime(Math.max(0, studyState.time), false)}
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setStudyState(prev => ({ ...prev, time: Math.max(0, prev.time - 600) }))}
          className="px-3 py-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          aria-label="Subtract 10 minutes"
        >
          -10
        </button>
        <button
          onClick={() => setStudyState(prev => ({ ...prev, time: Math.max(0, prev.time - 300) }))}
          className="px-3 py-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          aria-label="Subtract 5 minutes"
        >
          -5
        </button>
        <button
          onClick={() => setStudyState(prev => ({ ...prev, time: prev.time + 300 }))}
          className="px-3 py-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          aria-label="Add 5 minutes"
        >
          +5
        </button>
        <button
          onClick={() => setStudyState(prev => ({ ...prev, time: prev.time + 600 }))}
          className="px-3 py-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          aria-label="Add 10 minutes"
        >
          +10
        </button>
      </div>

      <div className="timer-controls">
        <button
          onClick={studyControls.reset}
          className="control-button w-10 h-10 flex items-center justify-center"
          aria-label="Reset timer"
        >
          <RotateCcw size={20} style={{ color: iconColor }} />
        </button>
        {!studyState.isRunning ? (
          <button
            onClick={studyControls.start}
            className="control-button w-10 h-10 flex items-center justify-center"
            aria-label="Start timer"
          >
            <Play size={20} style={{ color: iconColor }} />
          </button>
        ) : (
          <button
            onClick={studyControls.pause}
            className="control-button w-10 h-10 flex items-center justify-center"
            aria-label="Pause timer"
          >
            <Pause size={20} style={{ color: iconColor }} />
          </button>
        )}
        {currentSessionId && (
          <>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to exit this session? This will delete the session.')) {
                  studyControls.reset();
                  setCurrentSessionId(null);
                  dispatch(setCurrentSession(null));
                  window.dispatchEvent(new CustomEvent("resetPomodoro"));
                }
              }}
              className="control-button w-10 h-10 flex items-center justify-center text-red-500 hover:text-red-600"
              aria-label="Exit session"
            >
              <X size={20} />
            </button>
            <button
              onClick={() => setIsFinishModalOpen(true)}
              className="control-button w-10 h-10 flex items-center justify-center"
              aria-label="Finish session"
            >
              <Check size={20} style={{ color: iconColor }} />
            </button>
          </>
        )}
      </div>

      <div className="text-base text-neutral-400 mt-4 text-center">
        {currentSessionId && (
          <div className="mb-1">
            Session Name: <span className="text-blue-500">{studyState.sessionTitle || 'Untitled Session'}</span>
          </div>
        )}
        <div className={`mb-1 ${
          studyState.sessionStatus === 'inactive' ? 'text-neutral-400' : 
          studyState.sessionStatus === 'active' ? 'text-green-500' : 'text-yellow-500'
        }`}>
          Session Status: {studyState.sessionStatus.charAt(0).toUpperCase() + studyState.sessionStatus.slice(1)}
        </div>
        Sessions Today: {currentSession || 0}
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
      />

      <EditSessionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        sessionId={currentSessionId}
      />
    </div>
  );
};

export default StudyTimer;