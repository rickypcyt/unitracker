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

const readPomodoroConfig = (): { work: number; break: number; longBreak: number; sessionsBeforeLong: number } => {
  const cfg = { work: 3000, break: 600, longBreak: 1800, sessionsBeforeLong: 4 };
  try {
    const s = JSON.parse(localStorage.getItem("pomodoroState") || "null");
    if (s) {
      const n = safeNumber(Number(s.workSessionsBeforeLongBreak), 4);
      if (n > 0) cfg.sessionsBeforeLong = n;
      const modes = JSON.parse(localStorage.getItem("pomodoroModes") || "null");
      const m = Array.isArray(modes) ? modes[safeNumber(Number(s.modeIndex))] : null;
      if (m) {
        if (typeof m.work === "number" && Number.isFinite(m.work)) cfg.work = m.work;
        if (typeof m.break === "number" && Number.isFinite(m.break)) cfg.break = m.break;
        if (typeof m.longBreak === "number" && Number.isFinite(m.longBreak)) cfg.longBreak = m.longBreak;
      }
    }
  } catch {}
  return cfg;
};

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
    const cfg = readPomodoroConfig();
    const duration = modeKey === "break" ? cfg.break : modeKey === "longBreak" ? cfg.longBreak : cfg.work;
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

export type ExtraTimerId = "pomodoro" | "countdown";

/** Read a pomodoro/countdown display value regardless of sync state. */
export const readExtraTimerSeconds = (id: ExtraTimerId): number | null =>
  id === "pomodoro" ? readPomodoroSeconds() : readCountdownSeconds();

/**
 * Synced pomodoro remaining time — replicates the mega-cycle walk the Pomodoro
 * component does on `studyTimerTimeUpdate` (N work sessions, each followed by
 * a break, a long break after the last one), so the popup shows exactly what
 * the panel shows and flips on the same second boundary.
 * `studyElapsed` must already be floored to display seconds.
 */
export const readSyncedPomodoroSeconds = (studyElapsed: number): number => {
  const { work, break: brk, longBreak, sessionsBeforeLong } = readPomodoroConfig();
  const megaCycle = sessionsBeforeLong * work + (sessionsBeforeLong - 1) * brk + longBreak;
  const timeInCycle = Math.floor(studyElapsed) % megaCycle;

  let mode: "work" | "break" | "longBreak" = "work";
  let timeInMode = timeInCycle;
  let remaining = timeInCycle;
  for (let i = 0; i < sessionsBeforeLong; i++) {
    if (remaining < work) {
      mode = "work";
      timeInMode = remaining;
      break;
    }
    remaining -= work;
    const breakDur = i === sessionsBeforeLong - 1 ? longBreak : brk;
    if (remaining < breakDur) {
      mode = i === sessionsBeforeLong - 1 ? "longBreak" : "break";
      timeInMode = remaining;
      break;
    }
    remaining -= breakDur;
  }
  const duration = mode === "work" ? work : mode === "longBreak" ? longBreak : brk;
  return Math.max(0, duration - timeInMode);
};

/**
 * Synced countdown remaining time — same formula the Countdown component uses:
 * `baseline - floor(studyElapsed)`. `studyElapsed` must already be floored.
 */
export const readSyncedCountdownSeconds = (studyElapsed: number): number => {
  try {
    const b = JSON.parse(localStorage.getItem("countdownBaseline") || "null");
    const baseline = b
      ? safeNumber(Number(b.hours)) * 3600 + safeNumber(Number(b.minutes)) * 60 + safeNumber(Number(b.seconds))
      : 7200;
    return Math.max(0, baseline - Math.floor(studyElapsed));
  } catch {
    return 0;
  }
};

/** Read a synced timer's value derived from the (floored) study elapsed time. */
export const readSyncedTimerSeconds = (id: ExtraTimerId, studyElapsed: number): number =>
  id === "pomodoro" ? readSyncedPomodoroSeconds(studyElapsed) : readSyncedCountdownSeconds(studyElapsed);

/** Readings for the timers currently synced to the study timer. */
export const readSyncedTimers = (studyElapsed: number): SyncedTimerReading[] => {
  const { syncPomodoroWithTimer, syncCountdownWithTimer } = useAppStore.getState().syncSettings;
  const readings: SyncedTimerReading[] = [];
  if (syncPomodoroWithTimer) {
    readings.push({ id: "pomodoro", seconds: readSyncedPomodoroSeconds(studyElapsed) });
  }
  if (syncCountdownWithTimer) {
    readings.push({ id: "countdown", seconds: readSyncedCountdownSeconds(studyElapsed) });
  }
  return readings;
};

/** Whether a pomodoro/countdown is synced to the study timer. */
export const isExtraTimerSynced = (id: ExtraTimerId): boolean => {
  const { syncPomodoroWithTimer, syncCountdownWithTimer } = useAppStore.getState().syncSettings;
  return id === "pomodoro" ? syncPomodoroWithTimer : syncCountdownWithTimer;
};

export const isExtraTimerRunning = (id: ExtraTimerId): boolean => {
  try {
    if (id === "pomodoro") {
      const s = JSON.parse(localStorage.getItem("pomodoroState") || "null");
      return s?.isRunning === true && s?.manuallyPaused !== true;
    }
    return localStorage.getItem("countdownState") === "running";
  } catch {
    return false;
  }
};

// ── Independent (unsynced) timer controls ────────────────────────────────────
// Same pattern as the study toggle: emit the sync event the component listens
// to, then apply the transition ourselves if nothing handled it.

const fallbackPausePomodoro = (): void => {
  try {
    const s = JSON.parse(localStorage.getItem("pomodoroState") || "null");
    if (!s || s.isRunning !== true) return;
    const lastStart = typeof s.lastStart === "number" ? s.lastStart : null;
    const elapsed = safeNumber(Number(s.timeAtStart)) + (lastStart ? (Date.now() - lastStart) / 1000 : 0);
    const modeKey = typeof s.currentMode === "string" ? s.currentMode : "work";
    const cfg = readPomodoroConfig();
    const duration = modeKey === "break" ? cfg.break : modeKey === "longBreak" ? cfg.longBreak : cfg.work;
    localStorage.setItem("pomodoroState", JSON.stringify({
      ...s,
      isRunning: false,
      timeAtStart: elapsed,
      timeLeft: Math.max(0, duration - elapsed),
      lastStart: null,
      lastManualAdjustment: Date.now(),
      manuallyPaused: true,
    }));
    localStorage.setItem("pomodoroIsRunning", "false");
    useAppStore.getState().setPomoRunning(false);
  } catch {}
};

const fallbackResumePomodoro = (): void => {
  try {
    const s = JSON.parse(localStorage.getItem("pomodoroState") || "null");
    if (!s || s.isRunning === true) return;
    const modeKey = typeof s.currentMode === "string" ? s.currentMode : "work";
    const cfg = readPomodoroConfig();
    const duration = modeKey === "break" ? cfg.break : modeKey === "longBreak" ? cfg.longBreak : cfg.work;
    const timeLeft = safeNumber(Number(s.timeLeft));
    localStorage.setItem("pomodoroState", JSON.stringify({
      ...s,
      isRunning: true,
      lastStart: Date.now(),
      timeAtStart: timeLeft > 0 && timeLeft < duration ? safeNumber(Number(s.timeAtStart)) : 0,
      timeLeft: timeLeft > 0 ? timeLeft : duration,
      lastManualAdjustment: Date.now(),
      manuallyPaused: false,
    }));
    localStorage.setItem("pomodoroIsRunning", "true");
    useAppStore.getState().setPomoRunning(true);
  } catch {}
};

const fallbackPauseCountdown = (): void => {
  const endTs = Number(localStorage.getItem("countdownEndTs"));
  const remaining = Number.isFinite(endTs) ? Math.max(0, (endTs - Date.now()) / 1000) : 0;
  localStorage.setItem("countdownState", "paused");
  localStorage.setItem("countdownPausedLeft", String(remaining));
};

const fallbackResumeCountdown = (): void => {
  const left = Number(localStorage.getItem("countdownPausedLeft"));
  const seconds = Number.isFinite(left) && left > 0 ? left : readCountdownSeconds() ?? 0;
  localStorage.setItem("countdownState", "running");
  localStorage.setItem("countdownEndTs", String(Date.now() + seconds * 1000));
};

/** Toggle an unsynced pomodoro/countdown: emit its sync event, fall back if unmounted. */
export const requestToggleExtraTimer = (id: ExtraTimerId): void => {
  const running = isExtraTimerRunning(id);
  emit(running
    ? id === "pomodoro" ? SYNC_EVENTS.PAUSE_POMODORO : SYNC_EVENTS.PAUSE_COUNTDOWN
    : id === "pomodoro" ? SYNC_EVENTS.PLAY_POMODORO : SYNC_EVENTS.PLAY_COUNTDOWN);
  setTimeout(() => {
    if (isExtraTimerRunning(id) !== running) return; // the component handled it
    if (id === "pomodoro") {
      running ? fallbackPausePomodoro() : fallbackResumePomodoro();
    } else {
      running ? fallbackPauseCountdown() : fallbackResumeCountdown();
    }
  }, 100);
};

/** Event to open/close an independent floating overlay for an unsynced timer. */
export const EXTRA_TIMER_TOGGLE_EVENT = "extraTimerOverlay:toggle";

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
