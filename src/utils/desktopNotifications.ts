import { Capacitor } from "@capacitor/core";
import { haptic } from "@/utils/haptics";
import { useNotificationPromptStore } from "@/store/notificationPromptStore";

let lastBlockedWarning = 0;

/** Native (Capacitor) path: ask for permission via the LocalNotifications plugin. */
const ensureNativePermission = async (): Promise<boolean> => {
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const current = await LocalNotifications.checkPermissions();
    if (current.display === "granted") return true;
    if (current.display === "denied") return false;
    const result = await LocalNotifications.requestPermissions();
    return result.display === "granted";
  } catch (error) {
    console.error("[Notifications] native permission failed:", error);
    return false;
  }
};

const showNativeNotification = async (title: string, body?: string): Promise<void> => {
  void haptic("success");
  if (!(await ensureNativePermission())) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now() % 2_147_483_647, // must fit in int32
          title,
          body: body ?? "",
        },
      ],
    });
  } catch (error) {
    console.error("[Notifications] native schedule failed:", error);
  }
};

export type DesktopPermission = NotificationPermission | "unsupported";

export const getDesktopPermission = (): DesktopPermission => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
};

const isMobileDevice = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(pointer: coarse)").matches ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));

/** Warn the user that notifications are blocked — throttled so it doesn't spam. */
export const warnNotificationsBlocked = () => {
  // Desktop notifications don't exist on mobile — don't nag the user there.
  if (isMobileDevice()) return;
  if (Date.now() - lastBlockedWarning < 60_000) return;
  lastBlockedWarning = Date.now();
  useNotificationPromptStore.getState().open();
};

/**
 * Ask for notification permission. Call from a user gesture (e.g. Start button)
 * — browsers reject requests fired without one.
 */
export const requestDesktopPermission = async (): Promise<DesktopPermission> => {
  if (Capacitor.isNativePlatform()) {
    const granted = await ensureNativePermission();
    return granted ? "granted" : "denied";
  }
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
  if (Capacitor.isNativePlatform()) {
    void showNativeNotification(title, options.body);
    return;
  }
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
