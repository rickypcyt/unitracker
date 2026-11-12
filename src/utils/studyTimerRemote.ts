import { SYNC_EVENTS } from "@/hooks/session/useStudySync";
import { STORAGE_KEYS } from "@/hooks/session/useStudyTimerState";
import { StudyService } from "@/services/StudyService";
import { useAppStore } from "@/store/appStore";
import { formatHMS } from "@/utils/timeUtils";
import type { PauseEntry } from "@/schemas/timer";

/**
 * Remote control for the study timer.
 *
 * The canonical timer state lives in localStorage (`studyTimerState`) and in
 * the Zustand `ui.isStudyRunning` flag. `StudyTimer` owns the state while it is
 * mounted and listens to `playTimerSync`/`pauseTimerSync`. When it is NOT
 * mounted (user navigated away), nothing listens — so after dispatching the
 * sync events we re-check the state shortly after and apply the transition
 * ourselves as a fallback.
 */

export const MINI_PLAYER_OPEN_EVENT = "miniTimerPlayer:open";

export interface StudyTimerSnapshot {
  time: number;
  isRunning: boolean;
  lastStart: number | null;
  timeAtStart: number;
  sessionStatus: "inactive" | "active" | "paused";
  sessionTitle: string;
  lastPausedAt: number | null;
  pauseHistory: PauseEntry[];
}

const EMPTY_SNAPSHOT: StudyTimerSnapshot = {
  time: 0,
  isRunning: false,
  lastStart: null,
  timeAtStart: 0,
  sessionStatus: "inactive",
  sessionTitle: "",
  lastPausedAt: null,
  pauseHistory: [],
};

const safeNumber = (value: unknown, defaultValue = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : defaultValue;

const parsePauseHistory = (raw: unknown): PauseEntry[] => (Array.isArray(raw) ? (raw as PauseEntry[]) : []);

export const readStudyTimerSnapshot = (): StudyTimerSnapshot => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDY_TIMER_STATE);
    if (!raw) return EMPTY_SNAPSHOT;
    const parsed = JSON.parse(raw);
    return {
      time: safeNumber(Number(parsed.time)),
      isRunning: parsed.isRunning === true,
      lastStart: parsed.lastStart ? safeNumber(Number(parsed.lastStart)) : null,
      timeAtStart: safeNumber(Number(parsed.timeAtStart)),
      sessionStatus: ["inactive", "active", "paused"].includes(parsed.sessionStatus)
        ? parsed.sessionStatus
        : "inactive",
      sessionTitle: typeof parsed.sessionTitle === "string" ? parsed.sessionTitle : "",
      lastPausedAt: parsed.lastPausedAt ? safeNumber(Number(parsed.lastPausedAt)) : null,
      pauseHistory: parsePauseHistory(parsed.pauseHistory),
    };
  } catch {
    return EMPTY_SNAPSHOT;
  }
};

const writeStudyTimerSnapshot = (s: StudyTimerSnapshot): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDY_TIMER_STATE, JSON.stringify(s));
  } catch {}
};

/** Elapsed seconds right now — works whether or not StudyTimer is mounted. */
export const getElapsedSeconds = (s: StudyTimerSnapshot): number =>
  s.isRunning && s.lastStart ? s.timeAtStart + (Date.now() - s.lastStart) / 1000 : s.time;

export const getActiveSessionId = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID) || localStorage.getItem("activeSessionId");
  } catch {
    return null;
  }
};

const openPauseEntry = (history: PauseEntry[]): PauseEntry[] => [
  ...history,
  { startedAt: Date.now(), endedAt: null, durationSeconds: null },
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

// ── Synced timers (pomodoro / countdown) ────────────────────────────────────

export interface SyncedTimerReading {
  id: "pomodoro" | "countdown";
  /** Remaining seconds to display. */
  seconds: number;
}

const readPomodoroSeconds = (): number | null => {
  try {
    const raw = localStorage.getItem("pomodoroState");
    if (!raw) return null;
    const s = JSON.parse(raw);
    const timeLeft = safeNumber(Number(s.timeLeft));
    const isRunning = s.isRunning === true && s.manuallyPaused !== true;
    const lastStart = typeof s.lastStart === "number" && Number.isFinite(s.lastStart) ? s.lastStart : null;
    if (!isRunning || !lastStart) return Math.max(0, timeLeft);

    // Running: extrapolate remaining from the mode duration and elapsed time
    const modeKey = typeof s.currentMode === "string" ? s.currentMode : "work";
    let duration = modeKey === "break" ? 300 : modeKey === "longBreak" ? 900 : 1500;
    try {
      const modes = JSON.parse(localStorage.getItem("pomodoroModes") || "null");
      const cfg = Array.isArray(modes) ? modes[safeNumber(Number(s.modeIndex))] : null;
      if (cfg && typeof cfg[modeKey] === "number" && Number.isFinite(cfg[modeKey])) {
        duration = cfg[modeKey];
      }
    } catch {}
    const elapsed = safeNumber(Number(s.timeAtStart)) + (Date.now() - lastStart) / 1000;
    return Math.max(0, duration - elapsed);
  } catch {
    return null;
  }
};

const readCountdownSeconds = (): number | null => {
  try {
    const state = localStorage.getItem("countdownState");
    if (state === "running") {
      const endTs = Number(localStorage.getItem("countdownEndTs"));
      return Number.isFinite(endTs) ? Math.max(0, (endTs - Date.now()) / 1000) : null;
    }
    if (state === "paused") {
      const left = Number(localStorage.getItem("countdownPausedLeft"));
      return Number.isFinite(left) ? Math.max(0, left) : null;
    }
    const baseline = JSON.parse(localStorage.getItem("countdownBaseline") || "null");
    if (baseline) {
      return (
        safeNumber(Number(baseline.hours)) * 3600 +
        safeNumber(Number(baseline.minutes)) * 60 +
        safeNumber(Number(baseline.seconds))
      );
    }
    return null;
  } catch {
    return null;
  }
};

/** Readings for the timers currently synced to the study timer. */
export const readSyncedTimers = (): SyncedTimerReading[] => {
  const { syncPomodoroWithTimer, syncCountdownWithTimer } = useAppStore.getState().syncSettings;
  const readings: SyncedTimerReading[] = [];
  if (syncPomodoroWithTimer) {
    const seconds = readPomodoroSeconds();
    if (seconds !== null) readings.push({ id: "pomodoro", seconds });
  }
  if (syncCountdownWithTimer) {
    const seconds = readCountdownSeconds();
    if (seconds !== null) readings.push({ id: "countdown", seconds });
  }
  return readings;
};

/** How many timers the mini player will show (study + synced extras). */
export const syncedTimerCount = (): number => {
  const { syncPomodoroWithTimer, syncCountdownWithTimer } = useAppStore.getState().syncSettings;
  return 1 + (syncPomodoroWithTimer ? 1 : 0) + (syncCountdownWithTimer ? 1 : 0);
};

const emit = (eventName: string): void => {
  try {
    window.dispatchEvent(new CustomEvent(eventName, { detail: { baseTimestamp: Date.now() } }));
  } catch {}
};

const emitStateChanged = (isRunning: boolean): void => {
  try {
    window.dispatchEvent(
      new CustomEvent(SYNC_EVENTS.STUDY_TIMER_STATE_CHANGED, { detail: { isRunning } })
    );
  } catch {}
};

/** Forward pause/play to synced pomodoro/countdown (same as StudyTimer's own controls do). */
const emitCompanions = (play: boolean): void => {
  const { syncPomodoroWithTimer, syncCountdownWithTimer } = useAppStore.getState().syncSettings;
  if (syncPomodoroWithTimer) emit(play ? SYNC_EVENTS.PLAY_POMODORO : SYNC_EVENTS.PAUSE_POMODORO);
  if (syncCountdownWithTimer) emit(play ? SYNC_EVENTS.PLAY_COUNTDOWN : SYNC_EVENTS.PAUSE_COUNTDOWN);
};

// ── Fallbacks (used only when StudyTimer is unmounted and can't handle the events) ──

const fallbackPause = async (): Promise<void> => {
  const s = readStudyTimerSnapshot();
  if (!s.isRunning) return;
  const elapsed = getElapsedSeconds(s);
  writeStudyTimerSnapshot({
    ...s,
    isRunning: false,
    time: elapsed,
    timeAtStart: elapsed,
    lastStart: null,
    sessionStatus: "paused",
    lastPausedAt: Date.now(),
    pauseHistory: openPauseEntry(s.pauseHistory),
  });
  const store = useAppStore.getState();
  store.setStudyRunning(false);
  store.setStudyTimerState("paused");
  emitStateChanged(false);

  const sessionId = getActiveSessionId();
  if (sessionId) {
    try {
      await StudyService.updateLap(sessionId, { duration: formatHMS(elapsed) });
    } catch (e) {
      console.error("[studyTimerRemote] Error updating duration on pause:", e);
    }
  }
};

const fallbackResume = (): void => {
  const s = readStudyTimerSnapshot();
  if (s.isRunning) return;
  if (!getActiveSessionId()) return;
  const now = Date.now();
  writeStudyTimerSnapshot({
    ...s,
    isRunning: true,
    lastStart: now,
    timeAtStart: s.time,
    sessionStatus: "active",
    pauseHistory: closeLastPauseEntry(s.pauseHistory),
    lastPausedAt: null,
  });
  const store = useAppStore.getState();
  store.setStudyRunning(true);
  store.setStudyTimerState("running");
  try {
    localStorage.setItem(STORAGE_KEYS.STUDY_TIMER_STARTED_AT, String(now));
  } catch {}
  emitStateChanged(true);
};

/**
 * Toggle play/pause. Emits the same sync events the in-app buttons emit, then
 * applies a fallback transition if nothing handled them (StudyTimer unmounted).
 *
 * Returns the requested action, or "none" when there is no session to resume —
 * the caller should send the user to the session page in that case.
 */
export const requestToggleStudyTimer = (): "pause" | "play" | "none" => {
  const s = readStudyTimerSnapshot();
  if (s.isRunning) {
    emit(SYNC_EVENTS.PAUSE_TIMER);
    emitCompanions(false);
    setTimeout(() => {
      const stillRunning =
        readStudyTimerSnapshot().isRunning || useAppStore.getState().ui.isStudyRunning;
      if (stillRunning) void fallbackPause();
    }, 100);
    return "pause";
  }
  if (!getActiveSessionId()) return "none";
  emit(SYNC_EVENTS.PLAY_TIMER);
  emitCompanions(true);
  setTimeout(() => {
    const nowRunning =
      readStudyTimerSnapshot().isRunning || useAppStore.getState().ui.isStudyRunning;
    if (!nowRunning) fallbackResume();
  }, 100);
  return "play";
};
