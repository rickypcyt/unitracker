import { Capacitor } from "@capacitor/core";

type HapticKind = "light" | "medium" | "success" | "warning";

/** Tactile feedback on native (Capacitor) builds; silently no-ops on the web. */
export const haptic = async (kind: HapticKind = "light"): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
    switch (kind) {
      case "light":
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
      case "medium":
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case "success":
        await Haptics.notification({ type: NotificationType.Success });
        break;
      case "warning":
        await Haptics.notification({ type: NotificationType.Warning });
        break;
    }
  } catch (error) {
    console.error("[Haptics] failed:", error);
  }
};
