import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

import FloatingExtraTimer from "@/pages/session/components/FloatingExtraTimer";
import MiniTimerPlayer from "@/pages/session/components/MiniTimerPlayer";
import {
  EXTRA_TIMER_TOGGLE_EVENT,
  MINI_PLAYER_OPEN_EVENT,
  type ExtraTimerId,
} from "@/utils/studyTimerRemote";
import { useNavigation } from "@/navigation/NavigationContext";

type DocumentPipApi = {
  requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
  window: Window | null;
};

const getDocumentPip = (): DocumentPipApi | null =>
  typeof window !== "undefined"
    ? (window as unknown as { documentPictureInPicture?: DocumentPipApi }).documentPictureInPicture ??
      null
    : null;

const EXTRA_IDS: ExtraTimerId[] = ["pomodoro", "countdown"];

/**
 * Floating mini player for the study timer.
 *
 * - Chrome/Edge: a real always-on-top window via the Document
 *   Picture-in-Picture API, with the player portaled into it.
 * - Other browsers: a draggable in-app overlay (still floats above the app,
 *   just not above other windows).
 *
 * Unsynced pomodoro/countdown timers can also be floated as independent
 * in-app overlays via `EXTRA_TIMER_TOGGLE_EVENT` (only one document-PiP
 * window can exist at a time, so they live inside the app).
 *
 * Mounted once at app level so it survives page navigation — unlike the
 * per-panel PiP in UnifiedTimer, which closes when leaving the session page.
 * Open it by dispatching `MINI_PLAYER_OPEN_EVENT` on window.
 */
const FloatingTimerPlayer = () => {
  const { navigateTo } = useNavigation();
  const [pipHost, setPipHost] = useState<HTMLElement | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [openExtras, setOpenExtras] = useState<Partial<Record<ExtraTimerId, boolean>>>({});
  const pipRef = useRef<Window | null>(null);

  const pipSupported = getDocumentPip() !== null;

  // Close the PiP window if the app itself unmounts
  useEffect(() => () => pipRef.current?.close(), []);

  const openPip = useCallback(async () => {
    const dpip = getDocumentPip();
    if (!dpip) {
      setOverlayOpen(true);
      return;
    }
    if (pipRef.current && !pipRef.current.closed) {
      pipRef.current.focus();
      return;
    }
    try {
      // Only one document-PiP window can exist; close the UnifiedTimer panels one
      if (dpip.window) dpip.window.close();

      const pip = await dpip.requestWindow({ width: 320, height: 170 });

      // Copy all stylesheets so the player matches the app theme
      document.querySelectorAll("style, link[rel='stylesheet']").forEach(node => {
        if (node instanceof HTMLLinkElement) {
          const link = pip.document.createElement("link");
          link.rel = "stylesheet";
          link.href = node.href;
          pip.document.head.appendChild(link);
        } else if (node instanceof HTMLStyleElement) {
          const style = pip.document.createElement("style");
          style.textContent = node.textContent;
          pip.document.head.appendChild(style);
        }
      });

      // Mirror theme classes/vars (dark/light, accent color) and keep them in sync
      const syncTheme = () => {
        pip.document.documentElement.className = document.documentElement.className;
        pip.document.documentElement.style.cssText = document.documentElement.style.cssText;
      };
      syncTheme();
      const themeObserver = new MutationObserver(syncTheme);
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "style"],
      });

      pip.document.title = "UniTracker — Study Timer";
      pip.document.body.className = "pip-body";

      const host = pip.document.createElement("div");
      host.className = "mini-player-host";
      pip.document.body.appendChild(host);

      pip.addEventListener("pagehide", () => {
        themeObserver.disconnect();
        pipRef.current = null;
        setPipHost(null);
      });

      pipRef.current = pip;
      setPipHost(host);
    } catch {
      // User dismissed the PiP request or the browser refused it
    }
  }, []);

  useEffect(() => {
    const onOpen = () => void openPip();
    window.addEventListener(MINI_PLAYER_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(MINI_PLAYER_OPEN_EVENT, onOpen);
  }, [openPip]);

  // Toggle independent overlays for unsynced timers
  useEffect(() => {
    const onToggle = (event: Event) => {
      const id = (event as CustomEvent).detail?.id as ExtraTimerId | undefined;
      if (!id || !EXTRA_IDS.includes(id)) return;
      setOpenExtras(prev => ({ ...prev, [id]: !prev[id] }));
    };
    window.addEventListener(EXTRA_TIMER_TOGGLE_EVENT, onToggle);
    return () => window.removeEventListener(EXTRA_TIMER_TOGGLE_EVENT, onToggle);
  }, []);

  const backToSession = useCallback(() => {
    pipRef.current?.close();
    setOverlayOpen(false);
    navigateTo("session");
    window.focus();
  }, [navigateTo]);

  const visibleExtras = EXTRA_IDS.filter(id => openExtras[id]);

  return (
    <>
      {pipHost ? createPortal(<MiniTimerPlayer onExpand={backToSession} />, pipHost) : null}
      {!pipSupported && overlayOpen ? (
        <motion.div
          drag
          dragMomentum={false}
          className="fixed bottom-20 right-4 z-[100] w-[320px] cursor-grab active:cursor-grabbing"
        >
          <MiniTimerPlayer onExpand={backToSession} onClose={() => setOverlayOpen(false)} />
        </motion.div>
      ) : null}
      {visibleExtras.map((id, index) => (
        <FloatingExtraTimer
          key={id}
          id={id}
          stackIndex={index}
          onClose={() => setOpenExtras(prev => ({ ...prev, [id]: false }))}
        />
      ))}
    </>
  );
};

export default FloatingTimerPlayer;
