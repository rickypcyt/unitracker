import { Bell, BellOff, Clock, Flag, Link, LogOut, MoreVertical, Pause, PictureInPicture, Play, RotateCcw, Settings, Timer as TimerIcon, Trash2, Unlink, Watch } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

import Countdown from "@/pages/session/Countdown";
import Pomodoro from "@/pages/session/Pomodoro";
import StudyTimer from "@/pages/session/StudyTimer";
import { SYNC_EVENTS } from "@/hooks/session/useStudySync";
import { useAppStore } from "@/store/appStore";
import {
  MINI_PLAYER_OPEN_EVENT,
} from "@/utils/studyTimerRemote";

type TimerId = "study" | "pomodoro" | "countdown";

const TIMER_CONFIG: Record<TimerId, { label: string; icon: typeof Clock; color: string }> = {
  study: { label: "session.unifiedTimer.studyLabel", icon: Clock, color: "#0A84FF" },
  pomodoro: { label: "session.unifiedTimer.pomodoroLabel", icon: TimerIcon, color: "#ef4444" },
  countdown: { label: "session.unifiedTimer.countdownLabel", icon: Watch, color: "#22c55e" },
};

/**
 * Unified timer panel — study, pomodoro and countdown living inside a single
 * card as divided zones. Same props and behavior as the classic UnifiedTimer
 * (sync toggles, alarms, session menu, float buttons, drag reorder, persisted
 * layout), with a visually integrated design instead of three floating cards.
 */
const UnifiedTimerPanel = ({ isSynced, isRunning }: { isSynced?: boolean; isRunning?: boolean }) => {
  const { t } = useTranslation();
  const [showPomodoro, setShowPomodoro] = useState(true);
  const [showCountdown, setShowCountdown] = useState(true);
  const [order, setOrder] = useState<TimerId[]>(["pomodoro", "study", "countdown"]);
  const [draggedId, setDraggedId] = useState<TimerId | null>(null);
  const [dragOverId, setDragOverId] = useState<TimerId | null>(null);
  const dragIdRef = useRef<TimerId | null>(null);
  const [pomoMenuOpen, setPomoMenuOpen] = useState(false);

  // Sync state from store
  const syncPomodoro = useAppStore(s => s.syncSettings.syncPomodoroWithTimer);
  const syncCountdown = useAppStore(s => s.syncSettings.syncCountdownWithTimer);
  const setSyncPomodoro = useAppStore(s => s.setSyncPomodoroWithTimer);
  const setSyncCountdown = useAppStore(s => s.setSyncCountdownWithTimer);
  const studyRunning = useAppStore(s => s.ui.isStudyRunning);
  const pomoRunning = useAppStore(s => s.ui.isPomoRunning);
  const countdownRunning = useAppStore(s => s.countdownTimerState === "running");

  // Alarm state from localStorage
  const [pomoAlarm, setPomoAlarm] = useState(() => localStorage.getItem("pomodoroAlarmEnabled") !== "false");
  

  useEffect(() => {
    try {
      const saved = localStorage.getItem("unifiedTimerLayout");
      if (saved) {
        const parsed = JSON.parse(saved);
        setShowPomodoro(parsed.showPomodoro ?? true);
        setShowCountdown(parsed.showCountdown ?? false);
        if (Array.isArray(parsed.order)) {
          const DEFAULT_ORDER: TimerId[] = ["pomodoro", "study", "countdown"];
          const savedOrder = parsed.order as TimerId[];
          if (savedOrder.length === 3 && savedOrder[0] === "study" && savedOrder[1] === "pomodoro") {
            setOrder(DEFAULT_ORDER);
          } else {
            setOrder(savedOrder);
          }
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("unifiedTimerLayout", JSON.stringify({ showPomodoro, showCountdown, order }));
  }, [showPomodoro, showCountdown, order]);

  // Listen for alarm state changes from components
  useEffect(() => {
    const handleAlarmUpdate = () => {
      setPomoAlarm(localStorage.getItem("pomodoroAlarmEnabled") !== "false");
    };
    window.addEventListener("alarm-state-changed", handleAlarmUpdate);
    return () => window.removeEventListener("alarm-state-changed", handleAlarmUpdate);
  }, []);

  const togglePomoAlarm = () => {
    const newVal = !(localStorage.getItem("pomodoroAlarmEnabled") !== "false");
    localStorage.setItem("pomodoroAlarmEnabled", String(newVal));
    setPomoAlarm(newVal);
    window.dispatchEvent(new CustomEvent("alarm-state-changed"));
  };


  const openPomoSettings = () => window.dispatchEvent(new CustomEvent("pomodoro-open-settings"));
  const openStudySettings = () => window.dispatchEvent(new CustomEvent("study-open-settings"));

  const visibleTimers = order.filter(id =>
    id === "study" || (id === "pomodoro" && showPomodoro) || (id === "countdown" && showCountdown)
  );

  const isTimerRunning = (id: TimerId) =>
    id === "study" ? studyRunning : id === "pomodoro" ? pomoRunning : countdownRunning;

  const handleDragStart = (id: TimerId) => {
    setDraggedId(id);
    dragIdRef.current = id;
  };

  const handleDragOver = (e: React.DragEvent, id: TimerId) => {
    e.preventDefault();
    if (dragIdRef.current && dragIdRef.current !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: TimerId) => {
    e.preventDefault();
    const sourceId = dragIdRef.current;
    if (!sourceId || sourceId === targetId) return;

    setOrder(prev => {
      const newOrder = [...prev];
      const sourceIdx = newOrder.indexOf(sourceId);
      const targetIdx = newOrder.indexOf(targetId);
      if (sourceIdx === -1 || targetIdx === -1) return prev;
      newOrder.splice(sourceIdx, 1);
      newOrder.splice(targetIdx, 0, sourceId);
      return newOrder;
    });

    setDraggedId(null);
    setDragOverId(null);
    dragIdRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    dragIdRef.current = null;
  };

  const renderTimer = (id: TimerId) => {
    const hideControls = isShared(id);
    if (id === "study") return <StudyTimer {...(isSynced !== undefined ? { isSynced } : {})} hideHeader hideControls />;
    if (id === "pomodoro") return <Pomodoro hideHeader hideControls={hideControls} />;
    if (id === "countdown") return <Countdown {...(isSynced !== undefined ? { isSynced } : {})} {...(isRunning !== undefined ? { isRunning } : {})} hideHeader hideControls={hideControls || (isSynced ?? false)} />;
    return null;
  };

  const actionBtn = "utp-action w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-[var(--text-secondary)]";

  const renderActions = (id: TimerId) => {
    if (id === "study") {
      return (
        <button
          onClick={() => window.dispatchEvent(new CustomEvent(MINI_PLAYER_OPEN_EVENT))}
          className={`${actionBtn} sm:hidden`}
          aria-label={t("session.miniPlayer.openAria")}
          title={t("session.miniPlayer.openTitle")}
        >
          <PictureInPicture size={16} />
        </button>
      );
    }
    if (id === "pomodoro") {
      const menuItem = "w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors text-left";
      const itemIcon = "text-[var(--text-secondary)]";
      return (
        <div className="relative">
          <button
            onClick={() => setPomoMenuOpen(v => !v)}
            className={actionBtn}
            aria-label={t("session.unifiedTimer.sessionMenu")} title={t("session.unifiedTimer.sessionMenu")} aria-expanded={pomoMenuOpen} aria-haspopup="menu"
          >
            <MoreVertical size={16} />
          </button>
          {pomoMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPomoMenuOpen(false)} aria-hidden />
              <div className="absolute right-0 top-full z-50 mt-1 w-44 py-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-lg" role="menu">
                <button
                  onClick={() => { openPomoSettings(); setPomoMenuOpen(false); }}
                  className={menuItem} role="menuitem"
                >
                  <Settings size={15} className={itemIcon} /> {t("session.unifiedTimer.options")}
                </button>
                <button
                  onClick={() => { togglePomoAlarm(); setPomoMenuOpen(false); }}
                  className={menuItem} role="menuitem"
                >
                  {pomoAlarm ? <BellOff size={15} className={itemIcon} /> : <Bell size={15} className={itemIcon} />} {pomoAlarm ? t("session.unifiedTimer.disableAlarm") : t("session.unifiedTimer.enableAlarm")}
                </button>
              </div>
            </>
          )}
        </div>
      );
    }
    if (id === "countdown") {
      return null;
    }
    return null;
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  // Shared bar controls the study session (synced companions follow it)
  const emit = (name: string) =>
    window.dispatchEvent(new CustomEvent(name, { detail: { baseTimestamp: Date.now() } }));
  const adjustStudy = (adjustment: number) =>
    window.dispatchEvent(new CustomEvent("studyAdjustTime", { detail: { adjustment } }));

  const isShared = (id: TimerId) =>
    id === "study" || (id === "pomodoro" ? syncPomodoro : syncCountdown);

  const renderTile = (id: TimerId) => {
    const config = TIMER_CONFIG[id];
    const Icon = config.icon;
    const running = isTimerRunning(id);
    const myIdx = visibleTimers.indexOf(id);
    const prevId = myIdx > 0 ? visibleTimers[myIdx - 1] : null;
    return (
      <motion.div
        variants={item}
        key={id}
        draggable
        onDragStart={() => handleDragStart(id)}
        onDragOver={(e) => handleDragOver(e, id)}
        onDrop={(e) => handleDrop(e, id)}
        onDragEnd={handleDragEnd}
        data-running={running}
        data-shared={isShared(id)}
        data-timer={id}
        data-drag-over={dragOverId === id}
        style={{ "--zone": config.color, "--zone2": prevId ? TIMER_CONFIG[prevId].color : config.color } as React.CSSProperties}
        className={`utp-zone utp-tile group/zone relative flex flex-col min-w-0 ${draggedId === id ? "opacity-40" : ""}`}
      >
        {/* Decorative layers: ambient glow (brightens while running) + fading dot grid */}
        <div aria-hidden className="utp-glow" />
        <div aria-hidden className="utp-grid" />

        {/* Chain-link sync toggle — sits on the border facing the study tile */}
        {id !== "study" && (() => {
          const myIdx = visibleTimers.indexOf(id);
          const edge = myIdx < visibleTimers.indexOf("study") ? "right" : "left";
          const neighbor = visibleTimers[edge === "right" ? myIdx + 1 : myIdx - 1];
          const synced = id === "pomodoro" ? syncPomodoro : syncCountdown;
          return (
            <button
              type="button"
              onClick={() => id === "pomodoro" ? setSyncPomodoro(!syncPomodoro) : setSyncCountdown(!syncCountdown)}
              data-on={synced}
              data-edge={edge}
              className="utp-sync"
              style={{ "--zone2": (neighbor && TIMER_CONFIG[neighbor].color) || config.color } as React.CSSProperties}
              aria-label={t("session.unifiedTimer.toggleSync")}
              title={synced ? t("session.unifiedTimer.syncOn") : t("session.unifiedTimer.syncOff")}
            >
              {synced ? <Link size={14} /> : <Unlink size={14} />}
            </button>
          );
        })()}

        {/* Centered title — anchored to the tile itself, immune to header icons */}
        <span className="utp-label absolute inset-x-0 top-3 z-10 flex h-8 items-center justify-center pointer-events-none">
          <Icon size={16} strokeWidth={2.25} />
          {t(config.label)}
        </span>

        {/* Tile header — actions only */}
        <div className="relative z-10 flex items-center justify-end gap-2 px-3.5 pt-3 min-h-8">
          <div className="utp-actions flex items-center gap-0.5">
            {renderActions(id)}
          </div>
        </div>

        {/* Digits — absolutely centered in the whole tile */}
        <div className="utp-body absolute inset-0 z-0 flex flex-col justify-center px-3">
          {renderTimer(id)}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="utp flex w-full flex-col"
    >
      {/* Timer tiles */}
      <div className={`relative z-10 grid flex-1 gap-3 px-4 pt-4 grid-cols-1 ${visibleTimers.length >= 3 ? "sm:grid-cols-3" : visibleTimers.length === 2 ? "sm:grid-cols-2" : ""}`}>
        {visibleTimers.map((id) => renderTile(id))}
      </div>

      {/* Shared controls */}
      <div className="relative z-10 flex items-center justify-center gap-3 sm:gap-4 mx-4 mt-2 pt-4 pb-4">
        <div className="flex gap-2">
          <button type="button" className="utp-ctrl" onClick={() => adjustStudy(-600)} aria-label="-10 min">-10</button>
          <button type="button" className="utp-ctrl" onClick={() => adjustStudy(-300)} aria-label="-5 min">-5</button>
        </div>
        <span aria-hidden className="utp-ctrl-div" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="utp-ctrl utp-ctrl-accent"
            onClick={() => emit(SYNC_EVENTS.RESET_TIMER)}
            aria-label={t("session.studyTimer.resetTimer")}
            title={t("session.studyTimer.resetTimer")}
          >
            <RotateCcw size={15} />
          </button>
          <button
            type="button"
            className="utp-ctrl-play"
            onClick={() => emit(studyRunning ? SYNC_EVENTS.PAUSE_TIMER : SYNC_EVENTS.PLAY_TIMER)}
            aria-label={studyRunning ? t("session.studyTimer.pauseTimer") : t("session.studyTimer.resumeTimer")}
            title={studyRunning ? t("session.studyTimer.pauseTimer") : t("session.studyTimer.resumeTimer")}
          >
            {studyRunning ? <Pause size={17} /> : <Play size={17} className="translate-x-px" />}
          </button>
          <button
            type="button"
            className="utp-ctrl utp-ctrl-accent"
            onClick={() => window.dispatchEvent(new CustomEvent("study-add-lap"))}
            aria-label={t("session.studyTimer.addLapNote")}
            title={t("session.studyTimer.addLapNote")}
          >
            <Flag size={15} />
          </button>
        </div>
        <span aria-hidden className="utp-ctrl-div" />
        <div className="flex items-center gap-2">
          <button type="button" className="utp-ctrl" onClick={() => adjustStudy(300)} aria-label="+5 min">+5</button>
          <button type="button" className="utp-ctrl" onClick={() => adjustStudy(600)} aria-label="+10 min">+10</button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent(MINI_PLAYER_OPEN_EVENT))}
        className="hidden sm:flex absolute bottom-6 right-6 items-center justify-center p-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors z-20"
        aria-label={t("session.miniPlayer.openAria")}
        title={t("session.miniPlayer.openTitle")}
      >
        <PictureInPicture size={22} />
      </button>
    </motion.div>
  );
};

export default UnifiedTimerPanel;
