import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

export const STORAGE_KEYS = {
  STUDY_TIMER_STATE: "studyTimerState",
  ACTIVE_SESSION_ID: "activeSessionId",
  STUDY_TIMER_STARTED_AT: "studyTimerStartedAt"
};

const safeNumber = (value: unknown, defaultValue = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : defaultValue;

const parseStoredState = (savedState: string | null, defaultState: any) => {
  // If there's no active session, always return the default state
  const hasActiveSession = typeof window !== 'undefined' && 
    (localStorage.getItem('activeSessionId') || 
     localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID));
     
  if (!savedState || !hasActiveSession) return defaultState;
  
  try {
    const parsed = JSON.parse(savedState);
    // Only use saved state if there's an active session
    if (hasActiveSession) {
      return {
        ...defaultState,
        time: safeNumber(Number(parsed.time)),
        isRunning: typeof parsed.isRunning === "boolean" ? parsed.isRunning : false,
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
    }
    return defaultState;
  } catch {
    return defaultState;
  }
};

const saveToLocalStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  } catch {}
};

export type StudyState = {
  time: number;
  isRunning: boolean;
  lastStart: number | null;
  timeAtStart: number;
  sessionStatus: "inactive" | "active" | "paused";
  sessionTitle?: string;
  sessionDescription?: string;
  lastPausedAt: number | null;
};

export function useStudyTimerState(): [StudyState, (updates: Partial<StudyState>) => void, Dispatch<SetStateAction<StudyState>>] {
  const defaultState: StudyState = {
    time: 0,
    isRunning: false,
    lastStart: null,
    timeAtStart: 0,
    sessionStatus: "inactive",
    sessionTitle: "",
    sessionDescription: "",
    lastPausedAt: null,
  };

  const [studyState, setStudyState] = useState<StudyState>(() => {
    const savedState = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.STUDY_TIMER_STATE) : null;
    return parseStoredState(savedState, defaultState);
  });

  const updateStudyState = useCallback((updates: Partial<StudyState>) => {
    setStudyState((prev) => ({ ...prev, ...updates }));
  }, []);

  // persist minimal state whenever it changes (call this from caller to avoid extra effect in hook)
  const persist = (state: StudyState) => {
    const stateToSave = {
      time: state.time,
      isRunning: state.isRunning,
      lastStart: state.lastStart,
      timeAtStart: state.timeAtStart,
      sessionStatus: state.sessionStatus,
      sessionTitle: state.sessionTitle || "",
      sessionDescription: state.sessionDescription || "",
    };
    saveToLocalStorage(STORAGE_KEYS.STUDY_TIMER_STATE, stateToSave);
  };

  // expose persist via function property to avoid additional return item
  // @ts-ignore attach for consumers who import module directly
  (updateStudyState as any).persist = persist;

  return [studyState, updateStudyState, setStudyState];
}


