import { Clock, MoreVertical, Pause, Play, RotateCcw } from "lucide-react";
import { SYNC_EVENTS, useEmitSyncEvents } from "@/hooks/study-timer/useStudySync";
import { useStudyTimer } from "@/hooks/useTimers";
import { useAppStore, useSessionSyncSettings } from "@/store/appStore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useSessionId } from "@/hooks/study-timer/useSessionId";
import { useStudyTimerState, type StudyState } from "@/hooks/study-timer/useStudyTimerState";
import type { PauseEntry } from "@/schemas/timer";
import { getLocalDateString } from "@/utils/dateUtils";
import { StudyService } from "@/services/StudyService";
import { TaskService } from "@/services/TaskService";

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  STUDY_TIMER_STATE: "studyTimerState",
  ACTIVE_SESSION_ID: "activeSessionId",
  STUDY_TIMER_STARTED_AT: "studyTimerStartedAt",
  SYNCED_WITH_STUDY_TIMER: "isSyncedWithStudyTimer",
  LAST_SESSIONS_RESET: "lastSessionsReset",
  SESSIONS_TODAY_COUNT: "sessionsTodayCount"
} as const;
const TIME_ADJUSTMENTS = {
  MINUS_TEN: -600,
  MINUS_FIVE: -300,
  PLUS_FIVE: 300,
  PLUS_TEN: 600
} as const;
const isDev = import.meta.env.DEV;

// ─── Utilities ───────────────────────────────────────────────────────────────

const safeNumber = (value: unknown, defaultValue = 0): number => typeof value === "number" && Number.isFinite(value) ? value : defaultValue;
const saveToLocalStorage = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
  }
};

/**
 * Reads a value from localStorage.
 * If `parseJson` is true (default), attempts JSON.parse on the stored string.
 * Returns `defaultValue` when the key is absent or parsing fails.
 */
const getFromLocalStorage = <T = unknown,>(key: string, defaultValue: T, parseJson = true): T => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    if (!parseJson) return raw as unknown as T;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Error reading ${key}:`, e);
    return defaultValue;
  }
};

/** Converts an "HH:MM:SS" string to total seconds. Returns 0 on invalid input. */
const parseHms = (hms?: string | null): number => {
  if (!hms) return 0;
  const parts = hms.split(":");
  if (parts.length !== 3) return 0;
  const [hh, mm, ss] = parts.map(Number);
  if (hh === undefined || mm === undefined || ss === undefined) return 0;
  if ([hh, mm, ss].some(v => !Number.isFinite(v))) return 0;
  return hh * 3600 + mm * 60 + ss;
};

/** Converts total seconds to "HH:MM:SS". */
const formatDuration = (totalSeconds: number): string => {
  const s = Math.max(0, Math.round(totalSeconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor(s % 3600 / 60);
  const sec = s % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};
const devLog = (..._args: unknown[]) => {
  if (isDev) {}
};

const formatPauseDuration = (seconds: number): string => {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const remS = s % 60;
  if (m > 0) return `${m}m ${remS.toString().padStart(2, "0")}s`;
  return `${remS}s`;
};

const formatPauseTime = (timestamp: number): string =>
  new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

const openPauseEntry = (history: PauseEntry[]): PauseEntry[] => [
  ...history,
  { startedAt: Date.now(), endedAt: null, durationSeconds: null }
];

const closeLastPauseEntry = (history: PauseEntry[]): PauseEntry[] => {
  if (history.length === 0) return history;
  const lastIndex = history.length - 1;
  const last = history[lastIndex];
  if (!last || last.endedAt !== null) return history;
  const endedAt = Date.now();
  const durationSeconds = (endedAt - last.startedAt) / 1000;
  return [...history.slice(0, lastIndex), { ...last, endedAt, durationSeconds }];
};

// ─── Internal hooks ───────────────────────────────────────────────────────────

/**
 * Deduplicates incoming sync events by their baseTimestamp so the same event
 * cannot trigger the same handler twice.
 */
const useTimestamp = () => {
  const lastRef = useRef<number | null>(null);
  const isNewTimestamp = useCallback((timestamp: number): boolean => {
    if (lastRef.current === timestamp) return false;
    lastRef.current = timestamp;
    return true;
  }, []);
  return {
    isNewTimestamp
  };
};
const useModalStates = () => {
  const [modalStates, setModalStates] = useState({
    isStartModalOpen: false,
    isSessionsModalOpen: false,
    isFinishModalOpen: false,
    isLoginPromptOpen: false,
    isSummaryOpen: false,
    isEditModalOpen: false,
    isDeleteModalOpen: false
  });
  const updateModal = useCallback((modalName: keyof typeof modalStates, isOpen: boolean) => {
    setModalStates(prev => ({
      ...prev,
      [modalName]: isOpen
    }));
  }, []);
  return [modalStates, updateModal] as const;
};

// ─── Component ────────────────────────────────────────────────────────────────

interface StudyTimerProps {
  onSyncChange?: (isSynced: boolean) => void;
  isSynced?: boolean | undefined;
  hideHeader?: boolean;
}
const StudyTimer = ({
  onSyncChange,
  isSynced,
  hideHeader = false
}: StudyTimerProps) => {
  const {
    isLoggedIn
  } = useAuth();
  const {
    resetTimerState,
    setCurrentSession,
    setStudyTimerState,
    setSyncCountdownWithTimer,
    setSyncPomodoroWithTimer,
    setStudyRunning,
    syncSettings,
    setSessionSyncSettings,
    ui
  } = useAppStore();
  const isStudyRunningRedux = ui.isStudyRunning;
  const [studyState, updateStudyState] = useStudyTimerState();
  const [currentSessionId, updateSessionId] = useSessionId();
  const [modalStates, updateModal] = useModalStates();
  const [isExitChoiceOpen, setExitChoiceOpen] = useState(false);
  const [localResetKey, setLocalResetKey] = useState(0);

  // Listen for settings open from UnifiedTimer
  useEffect(() => {
    const handler = () => {
      if (currentSessionId) updateModal("isEditModalOpen", true);
    };
    window.addEventListener("study-open-settings", handler);
    return () => window.removeEventListener("study-open-settings", handler);
  }, [currentSessionId, updateModal]);

  // Listen for exit session from SessionPage header
  useEffect(() => {
    const handler = () => {
      if (currentSessionId) setExitChoiceOpen(true);
    };
    window.addEventListener("study-exit-session", handler);
    return () => window.removeEventListener("study-exit-session", handler);
  }, [currentSessionId]);

  // Listen for delete session from SessionPage header
  useEffect(() => {
    const handler = () => {
      if (currentSessionId) updateModal("isDeleteModalOpen", true);
    };
    window.addEventListener("study-delete-session", handler);
    return () => window.removeEventListener("study-delete-session", handler);
  }, [currentSessionId, updateModal]);
  const [, setSessionsTodayCount] = useState(0);
  // Tracks "N minutes ago" re-renders when paused
  const [, tickPausedDisplay] = useState(0);
  const [summaryData, setSummaryData] = useState({
    duration: "00:00:00",
    tasksCount: 0,
    pomodoros: 0,
    title: ""
  });
  const isSyncedWithStudyTimer = useMemo(() => getFromLocalStorage<boolean>(STORAGE_KEYS.SYNCED_WITH_STUDY_TIMER, false), []);

  // Resolved sync settings for the current session
  const sessionSyncSettings = useSessionSyncSettings(currentSessionId);
  const effectiveSyncSettings = sessionSyncSettings ?? syncSettings;
  const isPomodoroSync = effectiveSyncSettings.syncPomodoroWithTimer;
  const isCountdownSync = effectiveSyncSettings.syncCountdownWithTimer;
  const {
    emitSyncEvent,
    emitMultipleSyncEvents
  } = useEmitSyncEvents();
  const {
    isNewTimestamp
  } = useTimestamp();

  // ── Persist sync settings whenever they change and a session is active ──
  useEffect(() => {
    if (currentSessionId) {
      setSessionSyncSettings(currentSessionId, syncSettings);
    }
  }, [currentSessionId, syncSettings, setSessionSyncSettings]);

  // ── Restore timer state after a page refresh ──────────────────────────────
  useEffect(() => {
    const savedStateRaw = getFromLocalStorage<string | null>(STORAGE_KEYS.STUDY_TIMER_STATE, null, false);
    const activeSessionId = getFromLocalStorage<string | null>(STORAGE_KEYS.ACTIVE_SESSION_ID, null, false);
    if (!savedStateRaw || !activeSessionId) {
      // No active session → ensure clean slate
      updateStudyState({
        time: 0,
        isRunning: false,
        lastStart: null,
        timeAtStart: 0,
        sessionStatus: "inactive",
        lastPausedAt: null
      });
      return;
    }
    try {
      const parsed = JSON.parse(savedStateRaw);
      const wasRunning: boolean = parsed.isRunning === true;
      const lastStart: number | null = parsed.lastStart ?? null;
      const timeAtStart: number = parsed.timeAtStart ?? 0;
      setCurrentSession({ id: activeSessionId, title: parsed.sessionTitle ?? '', description: parsed.sessionDescription ?? '', syncPomo: false, syncCountdown: false });
      if (parsed.sessionTitle || parsed.sessionDescription) {
        updateStudyState({
          sessionTitle: parsed.sessionTitle ?? "",
          sessionDescription: parsed.sessionDescription ?? ""
        });
      }
      if (wasRunning && lastStart !== null && timeAtStart >= 0) {
        setStudyRunning(true);
        setStudyTimerState("running");
        updateStudyState({
          isRunning: true,
          lastStart,
          timeAtStart,
          sessionStatus: "active"
        });

        // Re-emit sync events so linked timers also resume
        const emitTs = Date.now();
        const stored = getFromLocalStorage<typeof syncSettings | null>(`sessionSync_${activeSessionId}`, null);
        const resolvedSync = stored ?? syncSettings;
        if (resolvedSync.syncPomodoroWithTimer) {
          window.dispatchEvent(new CustomEvent(SYNC_EVENTS.PLAY_POMODORO, {
            detail: {
              baseTimestamp: emitTs
            }
          }));
        }
        if (resolvedSync.syncCountdownWithTimer) {
          window.dispatchEvent(new CustomEvent(SYNC_EVENTS.PLAY_COUNTDOWN, {
            detail: {
              baseTimestamp: emitTs
            }
          }));
        }
        devLog("[StudyTimer] Restored running state after refresh:", {
          wasRunning,
          lastStart,
          timeAtStart,
          activeSessionId
        });
      } else if (parsed.sessionStatus === "paused") {
        // Restore paused state so "Last paused N ago" survives refresh
        setStudyTimerState("paused");
        updateStudyState({
          isRunning: false,
          sessionStatus: "paused",
          lastPausedAt: parsed.lastPausedAt ? safeNumber(Number(parsed.lastPausedAt)) : Date.now(),
          time: safeNumber(Number(parsed.time)),
          timeAtStart: safeNumber(Number(parsed.timeAtStart)),
          lastStart: null
        });
        devLog("[StudyTimer] Restored paused state after refresh:", {
          lastPausedAt: parsed.lastPausedAt,
          time: parsed.time,
          activeSessionId
        });
      }
    } catch (error) {
      console.error("[StudyTimer] Error restoring running state:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally runs once on mount only

  // ── Pomodoro mode-change detector (polling) ───────────────────────────────
  useEffect(() => {
    let lastMode = "";
    let lastIndex: string | number = "";
    let lastRunning = false;
    const check = () => {
      try {
        const raw = localStorage.getItem("pomodoroState");
        if (!raw) return;
        const state = JSON.parse(raw);
        const mode: string = state.currentMode ?? "work";
        const idx: string | number = state.modeIndex ?? 0;
        const running: boolean = state.isRunning ?? false;
        if (mode === lastMode && idx === lastIndex && running === lastRunning) return;

        // Detect work → break transition
        const modeLabels: Record<string, string> = {
          work: "Work",
          break: "Break",
          longBreak: "Long Break"
        };
        const readableMode = modeLabels[mode] ?? mode;
        const readableLast = modeLabels[lastMode] ?? lastMode;
        if (readableLast === "Work" && (readableMode === "Break" || readableMode === "Long Break")) {
          window.dispatchEvent(new CustomEvent("pomodoroWorkCompleteNotice", {
            detail: {
              previousMode: readableLast,
              newMode: readableMode,
              modeIndex: idx,
              timestamp: Date.now()
            }
          }));
        }
        lastMode = mode;
        lastIndex = idx;
        lastRunning = running;
      } catch {
        // silent – localStorage may be unavailable
      }
    };
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, []); // No deps – uses only localStorage, no React state

  // ── "Paused N minutes ago" ticker ─────────────────────────────────────────
  useEffect(() => {
    if (studyState.sessionStatus !== "paused" || !studyState.lastPausedAt) return;
    const id = setInterval(() => tickPausedDisplay(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [studyState.sessionStatus, studyState.lastPausedAt]);

  // ── Daily session counter reset ───────────────────────────────────────────
  useEffect(() => {
    const check = () => {
      const today = getLocalDateString();
      const lastReset = getFromLocalStorage<string | null>(STORAGE_KEYS.LAST_SESSIONS_RESET, null, false);
      if (lastReset !== today) {
        setSessionsTodayCount(0);
        saveToLocalStorage(STORAGE_KEYS.LAST_SESSIONS_RESET, today);
        saveToLocalStorage(STORAGE_KEYS.SESSIONS_TODAY_COUNT, "0");
      }
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Fetch today's session count ───────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        const count = await StudyService.getSessionsToday();
        setSessionsTodayCount(count);
        saveToLocalStorage(STORAGE_KEYS.SESSIONS_TODAY_COUNT, String(count));
      } catch (error) {
        console.error("Error fetching sessions count:", error);
      }
    };
    fetch();
  }, []);

  // ── Fetch & cache session details whenever the active session changes ──────
  useEffect(() => {
    if (!currentSessionId) return;
    const fetchDetails = async () => {
      try {
        const session = await StudyService.getSessionById(currentSessionId);
        if (!session) {
          console.error("[StudyTimer] Error fetching session details:");
          return;
        }
        setSummaryData(prev => ({
          ...prev,
          title: session.name ?? ""
        }));
        updateStudyState({
          sessionTitle: session.name ?? "",
          sessionDescription: session.description ?? ""
        });
      } catch (error) {
        console.error("[StudyTimer] Error fetching session details:", error);
      }
    };
    fetchDetails();
  }, [currentSessionId, updateStudyState]);

  // ── Broadcast isSyncedWithStudyTimer changes ──────────────────────────────
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(SYNC_EVENTS.STUDY_TIMER_SYNC_STATE_CHANGED, {
      detail: {
        isSyncedWithStudyTimer
      }
    }));
    saveToLocalStorage(STORAGE_KEYS.SYNCED_WITH_STUDY_TIMER, isSyncedWithStudyTimer);
  }, [isSyncedWithStudyTimer]);

  // ── Broadcast timer state to synced timers ────────────────────────────────
  useEffect(() => {
    if (!isPomodoroSync && !isCountdownSync) return;
    window.dispatchEvent(new CustomEvent(SYNC_EVENTS.STUDY_TIMER_TIME_UPDATE, {
      detail: {
        time: studyState.time,
        isRunning: studyState.isRunning
      }
    }));
  }, [isPomodoroSync, isCountdownSync, studyState.time, studyState.isRunning]);

  // ── Persist timer state to localStorage & notify parent ──────────────────
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.STUDY_TIMER_STATE, {
      time: studyState.time,
      isRunning: studyState.isRunning,
      lastStart: studyState.lastStart,
      timeAtStart: studyState.timeAtStart,
      sessionStatus: studyState.sessionStatus,
      sessionTitle: studyState.sessionTitle ?? "",
      sessionDescription: studyState.sessionDescription ?? "",
      lastPausedAt: studyState.lastPausedAt,
      pauseHistory: studyState.pauseHistory
    });
    onSyncChange?.(isPomodoroSync);
  }, [studyState, onSyncChange, isPomodoroSync]);

  // ── Real-time elapsed timer ───────────────────────────────────────────────
  const updateTimerTime = useCallback((time: number, running = studyState.isRunning) => {
    updateStudyState({
      time
    });
    window.dispatchEvent(new CustomEvent(SYNC_EVENTS.STUDY_TIMER_TIME_UPDATE, {
      detail: {
        time,
        isRunning: running
      }
    }));
  }, [updateStudyState, studyState.isRunning]);
  useEffect(() => {
    if (!isStudyRunningRedux || studyState.lastStart === null) return;
    const tick = () => {
      const elapsed = studyState.timeAtStart + (Date.now() - (studyState.lastStart as number)) / 1000;
      updateTimerTime(elapsed, true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isStudyRunningRedux, studyState.lastStart, studyState.timeAtStart, updateTimerTime]);
  const studyTick = useCallback((elapsed: number) => updateStudyState({
    time: elapsed
  }), [updateStudyState]);
  useStudyTimer(studyTick, studyState.timeAtStart, studyState.lastStart);

  // ── Fetch current session title (used by FinishSession / EditSession) ─────
  const fetchCurrentSessionDetails = useCallback(async () => {
    if (!currentSessionId) return;
    try {
      const session = await StudyService.getSessionById(currentSessionId);
      if (!session) return;
      const updates = {
        sessionTitle: session.name ?? "Untitled Session",
        sessionDescription: session.description ?? ""
      };
      updateStudyState(updates);
      const savedRaw = getFromLocalStorage<string | null>(STORAGE_KEYS.STUDY_TIMER_STATE, null, false);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        saveToLocalStorage(STORAGE_KEYS.STUDY_TIMER_STATE, {
          ...parsed,
          ...updates
        });
      }
    } catch (error) {
      console.error("[StudyTimer] Error in fetchCurrentSessionDetails:", error);
    }
  }, [currentSessionId, updateStudyState]);

  // ── Adjust time (and propagate to synced timers) ──────────────────────────
  const adjustTime = useCallback((adjustment: number) => {
    const now = Date.now();
    if (studyState.isRunning && studyState.lastStart !== null) {
      const elapsed = studyState.timeAtStart + (now - studyState.lastStart) / 1000;
      updateStudyState({
        timeAtStart: Math.max(0, elapsed + adjustment),
        lastStart: now
      });
    } else {
      updateStudyState({
        time: Math.max(0, studyState.time + adjustment)
      });
    }
    if (isPomodoroSync) {
      window.dispatchEvent(new CustomEvent(SYNC_EVENTS.ADJUST_POMODORO_TIME, {
        detail: {
          adjustment
        }
      }));
    }
    if (isCountdownSync) {
      window.dispatchEvent(new CustomEvent(SYNC_EVENTS.ADJUST_COUNTDOWN_TIME, {
        detail: {
          adjustment
        }
      }));
    }
  }, [studyState, updateStudyState, isPomodoroSync, isCountdownSync]);

  // ── Helper: reset state to a clean stopped state ──────────────────────────
  const applyStoppedState = useCallback((preserveSession: boolean) => {
    updateStudyState({
      isRunning: false,
      lastStart: null,
      timeAtStart: 0,
      time: 0,
      sessionStatus: preserveSession ? studyState.sessionStatus : "inactive",
      lastPausedAt: null,
      pauseHistory: preserveSession ? studyState.pauseHistory : []
    });
    setStudyRunning(false);
    setStudyTimerState("stopped");
    resetTimerState();
    const keysToRemove: string[] = [STORAGE_KEYS.STUDY_TIMER_STARTED_AT];
    if (!preserveSession) {
      keysToRemove.push(STORAGE_KEYS.STUDY_TIMER_STATE, STORAGE_KEYS.ACTIVE_SESSION_ID);
    } else {
      keysToRemove.push(STORAGE_KEYS.STUDY_TIMER_STATE);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    window.dispatchEvent(new CustomEvent(SYNC_EVENTS.STUDY_TIMER_STATE_CHANGED, {
      detail: {
        isRunning: false
      }
    }));
  }, [studyState.sessionStatus, studyState.pauseHistory, updateStudyState, setStudyRunning, setStudyTimerState, resetTimerState]);

  // ── Core controls ─────────────────────────────────────────────────────────
  const start = useCallback(async (baseTimestamp: number, fromSync = false, seedTime?: number) => {
    if (isStudyRunningRedux) return;
    if (!isLoggedIn) {
      updateModal("isLoginPromptOpen", true);
      return;
    }
    const activeId = currentSessionId ?? getFromLocalStorage<string | null>(STORAGE_KEYS.ACTIVE_SESSION_ID, null, false);
    if (!activeId) {
      updateModal("isSessionsModalOpen", true);
      return;
    }
    const now = typeof baseTimestamp === "number" && Number.isFinite(baseTimestamp) ? baseTimestamp : Date.now();
    const currentTime = typeof seedTime === "number" && Number.isFinite(seedTime) ? seedTime : safeNumber(studyState.time);
    updateStudyState({
      isRunning: true,
      lastStart: now,
      timeAtStart: currentTime,
      time: currentTime,
      sessionStatus: "active",
      pauseHistory: closeLastPauseEntry(studyState.pauseHistory),
      lastPausedAt: null
    });
    setStudyRunning(true);
    setStudyTimerState("running");
    saveToLocalStorage(STORAGE_KEYS.STUDY_TIMER_STARTED_AT, String(now));
    window.dispatchEvent(new CustomEvent(SYNC_EVENTS.STUDY_TIMER_STATE_CHANGED, {
      detail: {
        isRunning: true
      }
    }));
    if (!fromSync) {
      const eventsToEmit: string[] = [];
      if (isPomodoroSync) eventsToEmit.push(SYNC_EVENTS.PLAY_POMODORO);
      if (isCountdownSync) eventsToEmit.push(SYNC_EVENTS.PLAY_COUNTDOWN);
      emitMultipleSyncEvents(eventsToEmit, Date.now());
    }
  }, [isStudyRunningRedux, isLoggedIn, currentSessionId, studyState.time, studyState.pauseHistory, updateStudyState, setStudyRunning, setStudyTimerState, isPomodoroSync, isCountdownSync, updateModal, emitMultipleSyncEvents]);
  const pause = useCallback(async (fromSync = false) => {
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
      pauseHistory: openPauseEntry(studyState.pauseHistory)
    });

    // Persist accumulated duration to DB on every pause
    if (currentSessionId) {
      const formatted = formatDuration(studyState.time);
      if (formatted !== "00:00:00") {
        try {
          await StudyService.updateLap(currentSessionId, { duration: formatted });
        } catch (e) {
          console.error("[StudyTimer] Unexpected error updating duration on pause:", e);
        }
      }
    }
    if (!fromSync) {
      const eventsToEmit: string[] = [];
      if (isPomodoroSync) eventsToEmit.push(SYNC_EVENTS.PAUSE_POMODORO);
      if (isCountdownSync) eventsToEmit.push(SYNC_EVENTS.PAUSE_COUNTDOWN);
      emitMultipleSyncEvents(eventsToEmit, Date.now());
    }
  }, [isStudyRunningRedux, currentSessionId, studyState.time, studyState.pauseHistory, updateStudyState, setStudyRunning, setStudyTimerState, isPomodoroSync, isCountdownSync, emitMultipleSyncEvents]);
  const reset = useCallback((fromSync = false) => {
    const hasActiveSession = !!currentSessionId;
    applyStoppedState(hasActiveSession);
    if (!fromSync) {
      const emitTs = Date.now();
      emitSyncEvent(SYNC_EVENTS.RESET_TIMER, emitTs);
      if (isPomodoroSync) emitSyncEvent(SYNC_EVENTS.RESET_POMODORO, emitTs);
      if (isCountdownSync) emitSyncEvent(SYNC_EVENTS.RESET_COUNTDOWN, emitTs);
    }
  }, [currentSessionId, applyStoppedState, emitSyncEvent, isPomodoroSync, isCountdownSync]);

  // ── Event listeners ───────────────────────────────────────────────────────
  const makeHandler = useCallback((action: (ts: number) => void, condition?: () => boolean) => (event: CustomEvent) => {
    const ts = event?.detail?.baseTimestamp ?? Date.now();
    if (!isNewTimestamp(ts)) return;
    if (condition && !condition()) return;
    action(ts);
  }, [isNewTimestamp]);
  useEventListener(SYNC_EVENTS.PLAY_TIMER, makeHandler(ts => start(ts, true), () => !isStudyRunningRedux), [isStudyRunningRedux, start]);
  useEventListener(SYNC_EVENTS.PAUSE_TIMER, makeHandler(() => pause(true), () => isStudyRunningRedux), [isStudyRunningRedux, pause]);
  useEventListener(SYNC_EVENTS.RESET_TIMER, makeHandler(() => reset(true)), [reset]);
  useEventListener(SYNC_EVENTS.RESET_POMODORO, makeHandler(() => isPomodoroSync && reset(true), () => isPomodoroSync), [isPomodoroSync, reset]);
  useEventListener(SYNC_EVENTS.RESET_COUNTDOWN, makeHandler(() => isCountdownSync && reset(true), () => isCountdownSync), [isCountdownSync, reset]);

  // Load accumulated session duration from event (fired by SessionsModal)
  useEventListener("loadSessionDuration", useCallback((event: CustomEvent) => {
    // Expects { duration: number, sessionId: string }
    const {
      duration,
      sessionId
    } = event.detail ?? {};
    if (typeof duration !== "number" || duration <= 0) return;
    devLog("[StudyTimer] loadSessionDuration received:", {
      duration,
      sessionId
    });
    updateStudyState({
      time: duration,
      timeAtStart: duration,
      isRunning: false,
      lastStart: null,
      sessionStatus: "active"
    });
    updateTimerTime(duration, false);
    const savedRaw = getFromLocalStorage<string | null>(STORAGE_KEYS.STUDY_TIMER_STATE, null, false);
    if (savedRaw) {
      const parsed = JSON.parse(savedRaw);
      saveToLocalStorage(STORAGE_KEYS.STUDY_TIMER_STATE, {
        ...parsed,
        time: duration,
        timeAtStart: duration,
        isRunning: false,
        lastStart: null
      });
    }
  }, [updateStudyState, updateTimerTime]));

  // ── Finish session ────────────────────────────────────────────────────────
  const handleFinishSession = useCallback(async () => {
    if (!currentSessionId) return;
    try {
      const session = await StudyService.getSessionById(currentSessionId);
      if (!session) {
        console.error("[StudyTimer] Error fetching session:");
        return;
      }
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User not authenticated");
        return;
      }
      const startedAt = session.started_at ?? new Date(0).toISOString();
      const endedAt = new Date().toISOString();
      const completedTasks = await TaskService.getCompletedTasksInRange(user.id, startedAt, endedAt);
      const formattedDuration = formatDuration(studyState.time);
      if (formattedDuration === "00:00:00") return;
      const today = getLocalDateString();
      const pomodorosToday = parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) ?? "0", 10) || 0;
      const localStartedAt = getFromLocalStorage<string | null>(STORAGE_KEYS.STUDY_TIMER_STARTED_AT, null, false);
      const updateData: Record<string, unknown> = {
        duration: formattedDuration,
        tasks_completed: completedTasks?.length ?? 0,
        ended_at: endedAt,
        pomodoros_completed: pomodorosToday
      };
      if (localStartedAt) {
        updateData['started_at'] = new Date(Number(localStartedAt)).toISOString();
      }
      await StudyService.updateLap(currentSessionId, updateData);

      // Refresh title right before showing summary
      let finalTitle = studyState.sessionTitle ?? "Untitled Session";
      try {
        const latest = await StudyService.getSessionById(currentSessionId);
        if (latest?.name) {
          finalTitle = latest.name;
          updateStudyState({
            sessionTitle: finalTitle
          });
        }
      } catch {
        // non-critical
      }
      setSummaryData({
        duration: formattedDuration,
        tasksCount: completedTasks?.length ?? 0,
        pomodoros: pomodorosToday,
        title: finalTitle
      });
      window.dispatchEvent(new CustomEvent("sessionCompleted", {
        detail: {
          sessionId: currentSessionId,
          duration: formattedDuration,
          pomodoros: pomodorosToday,
          tasksCompleted: completedTasks?.length ?? 0
        }
      }));
      updateModal("isSummaryOpen", true);
      window.dispatchEvent(new CustomEvent(SYNC_EVENTS.REFRESH_STATS));
      window.dispatchEvent(new CustomEvent(SYNC_EVENTS.FINISH_SESSION));

      // Tear down session
      reset();
      updateSessionId(null);
      setCurrentSession(null);
      updateTimerTime(0, false);
      [STORAGE_KEYS.STUDY_TIMER_STATE, STORAGE_KEYS.STUDY_TIMER_STARTED_AT].forEach(k => localStorage.removeItem(k));

      // Emit resets for linked timers
      const emitTs = Date.now();
      if (isPomodoroSync) emitSyncEvent(SYNC_EVENTS.RESET_POMODORO, emitTs);
      emitSyncEvent(SYNC_EVENTS.RESET_COUNTDOWN, emitTs);
    } catch (error) {
      console.error("[StudyTimer] Error finishing session:", error);
      toast.error("An error occurred while finishing the session.");
    }
  }, [currentSessionId, studyState.time, studyState.sessionTitle, updateModal, reset, updateSessionId, updateStudyState, isPomodoroSync, isCountdownSync, emitSyncEvent, updateTimerTime]);

  // ── Exit session ──────────────────────────────────────────────────────────
  const handleExitSession = useCallback(() => setExitChoiceOpen(true), []);
  const handleJustExit = useCallback(() => {
    reset();
    updateSessionId(null);
    setCurrentSession(null);
    updateTimerTime(0, false);
    updateStudyState({
      time: 0,
      isRunning: false,
      lastStart: null,
      timeAtStart: 0,
      sessionStatus: "inactive"
    });
    setExitChoiceOpen(false);
  }, [reset, updateSessionId, setCurrentSession, updateTimerTime, updateStudyState]);
  const handleExitAndDelete = useCallback(() => {
    setExitChoiceOpen(false);
    updateModal("isDeleteModalOpen", true);
  }, [updateModal]);

  // ── Delete session ────────────────────────────────────────────────────────
  const handleConfirmDelete = useCallback(async () => {
    try {
      if (currentSessionId) {
        await StudyService.deleteLap(currentSessionId);
      }
      reset();
      updateSessionId(null);
      setCurrentSession(null);
      updateTimerTime(0, false);
      updateStudyState({
        time: 0,
        isRunning: false,
        lastStart: null,
        timeAtStart: 0,
        sessionStatus: "inactive"
      });
      updateModal("isDeleteModalOpen", false);
      const emitTs = Date.now();
      if (isPomodoroSync) emitSyncEvent(SYNC_EVENTS.RESET_POMODORO, emitTs);
      emitSyncEvent(SYNC_EVENTS.RESET_COUNTDOWN, emitTs);
    } catch (error) {
      console.error("[StudyTimer] Error deleting session:", error);
      toast.error("An error occurred while deleting the session.");
    }
  }, [currentSessionId, reset, updateSessionId, setCurrentSession, updateModal, updateStudyState, isPomodoroSync, isCountdownSync, emitSyncEvent, updateTimerTime]);

  // ── Start session ─────────────────────────────────────────────────────────
  const handleStartSession = useCallback(async ({
    sessionId,
    title,
    description,
    syncPomo,
    syncCountdown
  }: {
    sessionId?: string;
    title: string;
    description?: string;
    syncPomo?: boolean;
    syncCountdown?: boolean;
  }) => {
    if (!sessionId) return;
    try {
      updateSessionId(sessionId);

      // Seed timer from DB duration
      let initialSeconds = 0;
      try {
        const lap = await StudyService.getSessionById(sessionId);
        if (!lap) throw new Error("Session not found");
        const durationSeconds = parseHms(lap.duration);
        const isUnfinished = !lap.ended_at;
        if (isUnfinished) {
          initialSeconds = durationSeconds;
        } else if (durationSeconds > 0) {
          initialSeconds = durationSeconds;
        } else if (lap?.started_at && lap?.ended_at) {
          initialSeconds = Math.max(0, Math.floor((new Date(lap.ended_at).getTime() - new Date(lap.started_at).getTime()) / 1000));
        }
      } catch (fe) {
        console.warn("[StudyTimer] Could not seed timer from DB:", fe);
      }
      const stateUpdates: Partial<StudyState> = {
        sessionStatus: "active",
        time: initialSeconds,
        sessionTitle: title || studyState.sessionTitle || "",
        sessionDescription: description || studyState.sessionDescription || ""
      };
      updateStudyState(stateUpdates);
      if (typeof syncPomo === "boolean") setSyncPomodoroWithTimer(syncPomo);
      if (typeof syncCountdown === "boolean") setSyncCountdownWithTimer(syncCountdown);
      updateModal("isStartModalOpen", false);
      start(Date.now(), true, initialSeconds);
    } catch (e) {
      console.error("[StudyTimer] Error in handleStartSession:", e);
      toast.error("Could not start the session.");
    }
  }, [updateSessionId, updateStudyState, studyState.sessionTitle, studyState.sessionDescription, updateModal, start, setSyncPomodoroWithTimer, setSyncCountdownWithTimer]);

  // ── Session selected from SessionsModal ───────────────────────────────────
  const handleSessionSelected = useCallback(async (sessionId: string) => {
    if (!sessionId) return;
    try {
      const session = await StudyService.getSessionById(sessionId);
      if (!session) {
        console.error("[StudyTimer] Error fetching session:");
        toast.error("Error loading session");
        return;
      }
      await StudyService.updateLap(sessionId, {
        ended_at: null,
        started_at: new Date().toISOString()
      });
      const initialSeconds = parseHms(session.duration);

      // Notify other components with correct event shape
      window.dispatchEvent(new CustomEvent("loadSessionDuration", {
        detail: {
          duration: initialSeconds,
          sessionId
        }
      }));
      if (session.pomodoros_completed !== null && session.pomodoros_completed !== undefined) {
        window.dispatchEvent(new CustomEvent("loadSessionPomodoros", {
          detail: {
            pomodoros: session.pomodoros_completed,
            sessionId
          }
        }));
      }
      updateSessionId(sessionId);
      updateModal("isSessionsModalOpen", false);
      start(Date.now(), true, initialSeconds);
    } catch (error) {
      console.error("[StudyTimer] Error in handleSessionSelected:", error);
      toast.error("Error starting session");
    }
  }, [updateSessionId, updateModal, start]);
  const handleStartNewSession = useCallback(() => {
    updateModal("isSessionsModalOpen", false);
    updateModal("isStartModalOpen", true);
  }, [updateModal]);
  const handleFinishAllSessions = useCallback(async () => {
    try {
      await StudyService.finishAllUnfinishedSessions();
    } catch (error) {
      console.error("[StudyTimer] Error finishing all sessions:", error);
      toast.error("Error finishing sessions");
    }
  }, []);

  // ── Global sync (isSynced prop) ───────────────────────────────────────────
  useEffect(() => {
    if (!isSynced) return;
    const handleGlobalSync = (event: Event) => {
      const {
        isRunning: globalIsRunning
      } = (event as CustomEvent).detail;
      if (globalIsRunning !== isStudyRunningRedux) {
        globalIsRunning ? start(Date.now(), true) : pause(true);
      }
    };
    const handleGlobalReset = (event: Event) => {
      const {
        resetKey: globalKey
      } = (event as CustomEvent).detail;
      if (globalKey !== localResetKey) {
        setLocalResetKey(globalKey);
        reset(true);
      }
    };
    window.addEventListener(SYNC_EVENTS.GLOBAL_TIMER_SYNC, handleGlobalSync);
    window.addEventListener(SYNC_EVENTS.GLOBAL_RESET_SYNC, handleGlobalReset);
    return () => {
      window.removeEventListener(SYNC_EVENTS.GLOBAL_TIMER_SYNC, handleGlobalSync);
      window.removeEventListener(SYNC_EVENTS.GLOBAL_RESET_SYNC, handleGlobalReset);
    };
  }, [isSynced, isStudyRunningRedux, localResetKey, start, pause, reset]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getTimeSinceLastPause = useCallback((): string => {
    if (studyState.sessionStatus !== "paused" || !studyState.lastPausedAt) return "";
    const diffSec = Math.floor((Date.now() - studyState.lastPausedAt) / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const min = diffMin % 60;
    const sec = diffSec % 60;
    if (diffHr > 0) return `${diffHr} hour${diffHr > 1 ? "s" : ""}${min > 0 ? ` and ${min} minute${min > 1 ? "s" : ""} ago` : ""} ago`;
    if (diffMin > 0) return `${diffMin} minute${diffMin !== 1 ? "s" : ""}${sec > 0 ? ` and ${sec} second${sec !== 1 ? "s" : ""} ago` : " ago"}`;
    return `${sec} second${sec !== 1 ? "s" : ""} ago`;
  }, [studyState.sessionStatus, studyState.lastPausedAt]);

  // ── Render ────────────────────────────────────────────────────────────────
  const timeAdjustmentButtons = [{
    adjustment: TIME_ADJUSTMENTS.MINUS_TEN,
    label: "-10"
  }, {
    adjustment: TIME_ADJUSTMENTS.MINUS_FIVE,
    label: "-5"
  }, {
    adjustment: TIME_ADJUSTMENTS.PLUS_FIVE,
    label: "+5"
  }, {
    adjustment: TIME_ADJUSTMENTS.PLUS_TEN,
    label: "+10"
  }];
  return <div className="flex flex-col items-center h-min">
      {/* Header */}
      {hideHeader ? null : <div className="section-title justify-center relative w-full px-4 py-3">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--accent-primary)]" />
            <SectionTitle title="Sessions" tooltip="Track your focus sessions. Start a session, pick a task, and your time is automatically logged for analytics." size="md" />
          </div>
          {!currentSessionId && (
            <p className="text-xs text-[var(--text-secondary)] text-center">
              Your sessions will appear here. Start one to track your focus time.
            </p>
          )}
        </div>
        {currentSessionId ? <button onClick={() => updateModal("isEditModalOpen", true)} className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label="Configure session">
            <MoreVertical size={20} />
          </button> : <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[28px]" />}
      </div>}

      {/* Timer display - circular progress ring */}
      <div className="relative group w-full flex flex-col items-center py-2" role="timer" aria-label="Current session time">
        {(() => {
          const totalSec = safeNumber(studyState.time);
          const h = Math.floor(totalSec / 3600);
          const m = Math.floor((totalSec % 3600) / 60);
          const s = Math.floor(totalSec % 60);
          const isRunning = studyState.isRunning;
          const isPaused = studyState.sessionStatus === 'paused';
          const radius = 52;
          const circumference = 2 * Math.PI * radius;
          const secondsInHour = totalSec % 3600;
          const hourProgress = secondsInHour / 3600;
          return (
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--border-primary)" strokeWidth="5" opacity="0.5" />
                <circle
                  cx="60" cy="60" r={radius} fill="none"
                  stroke="var(--accent-primary)" strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={isPaused ? circumference * 0.25 : circumference}
                  strokeDashoffset={isPaused ? circumference * 0.5 : circumference * (1 - hourProgress)}
                  className={`transition-all duration-300 ${isPaused ? 'animate-spin origin-center' : ''}`}
                  style={{ transformOrigin: '60px 60px', animationDuration: isPaused ? '2s' : undefined }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex items-center gap-0.5">
                  {h > 0 ? (
                    <>
                      <span className={`text-2xl font-mono font-bold tabular-nums leading-none ${
                        isStudyRunningRedux ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                      }`}>
                        {h.toString().padStart(2, '0')}
                      </span>
                      <span className={`text-xl font-mono font-bold leading-none ${
                        isStudyRunningRedux ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'
                      }`}>:</span>
                      <span className={`text-2xl font-mono font-bold tabular-nums leading-none ${
                        isStudyRunningRedux ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                      }`}>
                        {m.toString().padStart(2, '0')}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className={`text-2xl font-mono font-bold tabular-nums leading-none ${
                        isStudyRunningRedux ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                      }`}>
                        {m.toString().padStart(2, '0')}
                      </span>
                      <span className={`text-xl font-mono font-bold leading-none ${
                        isStudyRunningRedux ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'
                      }`}>:</span>
                      <span className={`text-2xl font-mono font-bold tabular-nums leading-none ${
                        isStudyRunningRedux ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                      }`}>
                        {s.toString().padStart(2, '0')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {currentSessionId && <div className="absolute left-1/2 -translate-x-1/2 top-full z-50 hidden group-hover:block bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] shadow-xl min-w-[220px] text-left">
            <div className="font-semibold mb-1">Session Title</div>
            <div>{studyState.sessionTitle || summaryData.title || "No Session"}</div>
            {studyState.sessionStatus === "paused" && studyState.lastPausedAt && <div className="mt-2 text-sm text-[var(--text-secondary)]">
                Last paused: {getTimeSinceLastPause()}
              </div>}
            {studyState.pauseHistory.length > 0 && <>
                <div className="font-semibold mt-3 mb-1">Pause history</div>
                <ul className="space-y-1 max-h-32 overflow-y-auto text-xs">
                  {studyState.pauseHistory.map((entry, idx) => {
                    const isOngoing = entry.endedAt === null;
                    const duration = isOngoing ? (Date.now() - entry.startedAt) / 1000 : (entry.durationSeconds ?? 0);
                    return <li key={`${entry.startedAt}-${idx}`} className="flex justify-between text-[var(--text-secondary)]">
                        <span>Pause #{idx + 1}</span>
                        <span>
                          {formatPauseTime(entry.startedAt)}
                          {" - "}
                          {entry.endedAt === null ? "ongoing" : formatPauseTime(entry.endedAt)}
                          {" ("}{formatPauseDuration(duration)}{")"}
                        </span>
                      </li>;
                  })}
                </ul>
              </>}
          </div>}
      </div>

      {/* Controls with side adjustment buttons */}
      <div className="flex justify-center items-center gap-2 mt-3">
        <div className="flex gap-1">
          {timeAdjustmentButtons.filter(b => b.adjustment < 0).map(({
            adjustment,
            label
          }) => <button key={label} onClick={() => adjustTime(adjustment)} className="timer-adjust-btn" aria-label={`Subtract ${Math.abs(adjustment / 60)} minutes`} disabled={!currentSessionId}>
              {label}
            </button>)}
        </div>
        {!isSynced && <>
            <button onClick={() => reset()} className="timer-ctrl-btn" aria-label="Reset timer" title="Reset timer">
              <RotateCcw size={18} className="text-[var(--text-secondary)]" />
            </button>

            {!isStudyRunningRedux ? <button onClick={() => start(Date.now(), false)} className="timer-ctrl-btn timer-ctrl-btn-primary" aria-label={currentSessionId ? "Resume timer" : "Start session"} title={currentSessionId ? "Resume timer" : "Start session"}>
                <Play size={18} />
              </button> : <button onClick={() => pause()} className="timer-ctrl-btn timer-ctrl-btn-primary" aria-label="Pause timer" title="Pause timer">
                <Pause size={18} />
              </button>}
          </>}

        <div className="flex gap-1">
          {timeAdjustmentButtons.filter(b => b.adjustment > 0).map(({
            adjustment,
            label
          }) => <button key={label} onClick={() => adjustTime(adjustment)} className="timer-adjust-btn" aria-label={`Add ${adjustment / 60} minutes`} disabled={!currentSessionId}>
              {label}
            </button>)}
        </div>
      </div>

      {/* Modals */}
      <SessionsModal isOpen={modalStates.isSessionsModalOpen} onClose={() => updateModal("isSessionsModalOpen", false)} onSessionSelected={handleSessionSelected} onFinishAllSessions={handleFinishAllSessions} onStartNewSession={handleStartNewSession} />

      <StartSessionModal isOpen={modalStates.isStartModalOpen} onClose={() => updateModal("isStartModalOpen", false)} onStart={handleStartSession} />

      {currentSessionId && <FinishSessionModal isOpen={modalStates.isFinishModalOpen} onClose={() => updateModal("isFinishModalOpen", false)} onFinish={handleFinishSession} sessionId={currentSessionId} onSessionDetailsUpdated={fetchCurrentSessionDetails} />}

      {currentSessionId && <EditSessionModal isOpen={modalStates.isEditModalOpen} onClose={() => updateModal("isEditModalOpen", false)} sessionId={currentSessionId} onSessionDetailsUpdated={fetchCurrentSessionDetails} />}

      <LoginPromptModal isOpen={modalStates.isLoginPromptOpen} onClose={() => updateModal("isLoginPromptOpen", false)} />

      <DeleteSessionModal isOpen={modalStates.isDeleteModalOpen} onClose={() => updateModal("isDeleteModalOpen", false)} onConfirm={handleConfirmDelete} />

      <ExitSessionChoiceModal isOpen={isExitChoiceOpen} onClose={() => setExitChoiceOpen(false)} onJustExit={handleJustExit} onExitAndDelete={handleExitAndDelete} />

      <SessionSummaryModal isOpen={modalStates.isSummaryOpen} onClose={() => updateModal("isSummaryOpen", false)} durationFormatted={summaryData.duration} completedTasksCount={summaryData.tasksCount} pomodorosCompleted={summaryData.pomodoros} />
    </div>;
};
export default StudyTimer;