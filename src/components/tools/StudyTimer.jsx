import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "../../utils/supabaseClient";
import { resetTimerState, setCurrentSession } from "../../redux/LapSlice";
import { createLap } from "../../redux/LapActions";
import { Play, Pause, RotateCcw, Check, Clock } from "lucide-react";
import { useTheme } from "../../utils/ThemeContext";
import { useStudyTimer, formatStudyTime } from "../../hooks/useTimers";
import useEventListener from "../../hooks/useEventListener";
import StartSessionModal from "../modals/StartSessionModal";

const StudyTimer = ({ onSyncChange }) => {
  const { iconColor } = useTheme();
  const dispatch = useDispatch();
  const { currentSession } = useSelector((state) => state.laps);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);

  const [studyState, setStudyState] = useState(() => {
    const savedState = localStorage.getItem("studyTimerState");
    if (savedState) {
      const parsed = JSON.parse(savedState);
      return {
        ...parsed,
        syncPomo: localStorage.getItem("syncPomoWithTimer") === "true",
      };
    }
    return {
      time: 0,
      isRunning: false,
      syncPomo: true,
      lastStart: null,
      timeAtStart: 0,
    };
  });

  useEffect(() => {
    const stateToSave = {
      time: studyState.time,
      isRunning: studyState.isRunning,
      syncPomo: studyState.syncPomo,
      lastStart: studyState.lastStart,
      timeAtStart: studyState.timeAtStart,
    };
    localStorage.setItem("studyTimerState", JSON.stringify(stateToSave));
    localStorage.setItem("syncPomoWithTimer", studyState.syncPomo.toString());
    onSyncChange?.(studyState.syncPomo);
  }, [studyState, onSyncChange]);

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
  useEventListener("pauseTimerSync", () => { if (studyState.syncPomo) studyControls.pause(); }, [studyState.syncPomo]);
  useEventListener("resetTimerSync", () => { if (studyState.syncPomo) studyControls.reset(); }, [studyState.syncPomo]);
  useEventListener("playTimerSync", () => { if (studyState.syncPomo) studyControls.start(); }, [studyState.syncPomo]);

  const studyControls = {
    start: async () => {
      if (!studyState.isRunning) {
        setIsStartModalOpen(true);
      }
    },
    pause: () => {
      if (studyState.isRunning) {
        setStudyState((prev) => {
          const now = Date.now();
          const elapsed = prev.timeAtStart + ((now - prev.lastStart) / 1000);
          return {
            ...prev,
            isRunning: false,
            time: elapsed,
            lastStart: null,
            timeAtStart: elapsed,
          };
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

  const handleFinishSession = async () => {
    if (!currentSession) return;
    const sessionData = {
      name: `Session ${currentSession}`,
      duration: formatStudyTime(studyState.time, true),
      description: "",
      session_number: currentSession,
    };
    dispatch(createLap(sessionData));
    studyControls.reset();
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
    dispatch(setCurrentSession(sessionNum));

    setStudyState((prev) => ({
      ...prev,
      isRunning: true,
      lastStart: now,
      timeAtStart: prev.time,
    }));

    window.dispatchEvent(
      new CustomEvent("studyTimerStateChanged", { detail: { isRunning: true } })
    );

    if (studyState.syncPomo) {
      window.dispatchEvent(new CustomEvent("startPomodoro"));
    }

    // Save session data to database
    const { error } = await supabase
      .from('study_laps')
      .insert([
        {
          name: sessionData.title,
          description: sessionData.description,
          session_number: sessionNum,
          task_ids: sessionData.taskIds,
        }
      ]);

    if (error) {
      console.error('Error saving session:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex items-center gap-2 mb-6">
        <Clock size={24} />
        <h2 className="text-xl font-semibold">Study Timer</h2>
        <button
          onClick={toggleSync}
          className={`ml-2 p-1 rounded-full transition-colors ${
            studyState.syncPomo ? "text-accent-primary" : "text-neutral-400"
          }`}
          aria-label={studyState.syncPomo ? "Disable Pomodoro sync" : "Enable Pomodoro sync"}
        >
          {studyState.syncPomo ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12l2 2 6-6" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
            </svg>
          )}
        </button>
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
        <button
          onClick={handleFinishSession}
          className="control-button w-10 h-10 flex items-center justify-center"
          aria-label="Finish session"
        >
          <Check size={20} style={{ color: iconColor }} />
        </button>
      </div>

      <div className="text-sm text-neutral-400 mt-4">
        Session Today: {currentSession || 0}
      </div>

      <StartSessionModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        onStart={handleStartSession}
      />
    </div>
  );
};

export default StudyTimer; 