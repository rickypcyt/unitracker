import { useCallback } from "react";

export const SYNC_EVENTS = {
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

export function useEmitSyncEvents() {
  const emitSyncEvent = useCallback((eventName: string, baseTimestamp = Date.now()) => {
    try {
      window.dispatchEvent(new CustomEvent(eventName, { detail: { baseTimestamp } }));
    } catch {}
  }, []);

  const emitMultipleSyncEvents = useCallback((events: string[], baseTimestamp = Date.now()) => {
    events.forEach((eventName) => emitSyncEvent(eventName, baseTimestamp));
  }, [emitSyncEvent]);

  return { emitSyncEvent, emitMultipleSyncEvents };
}


