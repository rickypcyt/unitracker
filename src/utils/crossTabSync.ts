import { SYNC_EVENTS } from "@/hooks/session/useStudySync";

/**
 * Cross-tab synchronization bridge.
 *
 * Re-broadcasts the app's `CustomEvent`-based sync events over a
 * BroadcastChannel so every open tab/window receives them. Events that arrive
 * from another tab are re-dispatched locally with a relay flag so the forwarder
 * does not echo them back (which would loop forever).
 *
 * State itself is synced separately via `storage` events on the localStorage
 * keys (`studyTimerState`, `activeSessionId`) — see useStudyTimerState /
 * useSessionId.
 */

const CHANNEL_NAME = "unitracker-timer-sync";
const RELAY_FLAG = "__crossTabRelay";

const RELAYED_EVENTS: readonly string[] = [
  ...Object.values(SYNC_EVENTS),
  "loadSessionDuration",
  "loadSessionPomodoros",
  "sessionCompleted",
];

let initialized = false;

export function initCrossTabSync(): void {
  if (initialized || typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return;
  }
  initialized = true;

  const channel = new BroadcastChannel(CHANNEL_NAME);

  // Forward locally-dispatched sync events to the other tabs
  const forward = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (detail && typeof detail === "object" && RELAY_FLAG in detail) return;
    try {
      channel.postMessage({ type: event.type, detail: detail ?? null });
    } catch {}
  };
  RELAYED_EVENTS.forEach(name => window.addEventListener(name, forward));

  // Re-dispatch events coming from other tabs on this window
  channel.onmessage = ({ data }) => {
    if (!data || typeof data.type !== "string" || !RELAYED_EVENTS.includes(data.type)) return;
    const detail =
      data.detail && typeof data.detail === "object"
        ? { ...data.detail, [RELAY_FLAG]: true }
        : { [RELAY_FLAG]: true };
    window.dispatchEvent(new CustomEvent(data.type, { detail }));
  };
}
