import { toast } from "react-toastify";

let lastBlockedWarning = 0;

export type DesktopPermission = NotificationPermission | "unsupported";

export const getDesktopPermission = (): DesktopPermission => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
};

/** Warn the user that notifications are blocked — throttled so it doesn't spam. */
export const warnNotificationsBlocked = () => {
  if (Date.now() - lastBlockedWarning < 60_000) return;
  lastBlockedWarning = Date.now();
  toast.error(
    "Desktop notifications are blocked. Enable them for this site in your browser settings to get timer alerts.",
    { autoClose: 6000 }
  );
};

/**
 * Ask for notification permission. Call from a user gesture (e.g. Start button)
 * — browsers reject requests fired without one.
 */
export const requestDesktopPermission = async (): Promise<DesktopPermission> => {
  const current = getDesktopPermission();
  if (current === "unsupported") return current;
  if (current === "denied") {
    warnNotificationsBlocked();
    return current;
  }
  if (current === "granted") return current;
  try {
    const result = await Notification.requestPermission();
    if (result === "denied") warnNotificationsBlocked();
    return result;
  } catch {
    return getDesktopPermission();
  }
};

/** Fire a desktop notification; warns the user if it can't be shown. */
export const showDesktopNotification = (
  title: string,
  options: NotificationOptions = {}
) => {
  const perm = getDesktopPermission();
  if (perm === "unsupported") return;

  const opts = {
    icon: "/assets/apple-touch-icon-removebg-preview.png",
    silent: false,
    vibrate: [200, 100, 200],
    ...options,
  };

  const create = () => {
    try {
      const n = new Notification(title, opts);
      setTimeout(() => n.close(), 5000);
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (error) {
      console.error("[Notifications] Error creating notification:", error);
    }
  };

  if (perm === "granted") {
    create();
  } else if (perm === "denied") {
    warnNotificationsBlocked();
  } else {
    void Notification.requestPermission()
      .then((result) => {
        if (result === "granted") create();
        else warnNotificationsBlocked();
      })
      .catch(() => warnNotificationsBlocked());
  }
};
