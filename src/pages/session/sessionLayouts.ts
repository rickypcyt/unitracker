export type SessionLayoutId = "default" | "planning" | "focus" | "compact";

export const SESSION_LAYOUT_STORAGE_KEY = "sessionPageLayout";
export const SESSION_LAYOUT_EVENT = "session-layout-changed";

export const SESSION_LAYOUTS: readonly SessionLayoutId[] = [
  "default",
  "planning",
  "focus",
  "compact",
];

export const getSessionLayout = (): SessionLayoutId => {
  try {
    const raw = localStorage.getItem(SESSION_LAYOUT_STORAGE_KEY);
    return SESSION_LAYOUTS.includes(raw as SessionLayoutId)
      ? (raw as SessionLayoutId)
      : "default";
  } catch {
    return "default";
  }
};

export const setSessionLayout = (layout: SessionLayoutId): void => {
  try {
    localStorage.setItem(SESSION_LAYOUT_STORAGE_KEY, layout);
  } catch {}
  window.dispatchEvent(
    new CustomEvent<SessionLayoutId>(SESSION_LAYOUT_EVENT, { detail: layout })
  );
};
