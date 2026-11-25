import { Check, Clock, Folder, Play, Target, Timer } from "lucide-react";
import { FormInput, FormTextarea } from "@/modals/shared/FormElements";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import AutocompleteInput from "@/modals/shared/AutocompleteInput";
import BaseModal from "@/modals/shared/BaseModal";
import { supabase } from "@/utils/supabaseClient";
import { useTranslation } from "react-i18next";
import { useAppStore, useLaps, useTasksOnly, useWorkspace } from "@/store/appStore";
import { StudyService } from "@/services/StudyService";
import { ALL_WORKSPACE_ID } from "@/hooks/tasks/useTaskBoard";

interface StartSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (params: {
    sessionId?: string;
    tasks?: string[];
    title: string;
    description?: string;
    syncPomo?: boolean;
    syncCountdown?: boolean;
  }) => void;
}
const StartSessionModal = ({
  isOpen,
  onClose,
  onStart
}: StartSessionModalProps) => {
  const { t, i18n } = useTranslation();
  const {
    syncSettings
  } = useAppStore();
  const { workspaces, currentWorkspace: activeWorkspace } = useWorkspace();
  const syncPomodoroWithTimer = syncSettings.syncPomodoroWithTimer;
  const syncCountdownWithTimer = syncSettings.syncCountdownWithTimer;
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDescription, setSessionDescription] = useState("");
  const [titleError, setTitleError] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const [assignment, setAssignment] = useState("");
  const [syncPomo, setSyncPomo] = useState(syncPomodoroWithTimer);
  const [syncCountdown, setSyncCountdown] = useState(syncCountdownWithTimer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const { laps } = useLaps();
  const tasks = useTasksOnly();

  // Recent sessions (unique by name + assignment) — feed the assignment suggestions
  const recentSessions = useMemo(() => {
    const seen = new Set<string>();
    const list: { name: string; assignment: string }[] = [];
    [...(laps || [])]
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .forEach((lap: any) => {
        const name = (lap.name || "").trim();
        if (!name) return;
        const assignment = (lap.session_assignment || "").trim();
        const key = `${name.toLowerCase()}|${assignment.toLowerCase()}`;
        if (seen.has(key) || list.length >= 4) return;
        seen.add(key);
        list.push({ name, assignment });
      });
    return list;
  }, [laps]);

  // Assignment suggestions: recent session assignments first, then the ones used in tasks
  const assignmentSuggestions = useMemo(() => {
    const ordered: string[] = [];
    const add = (value?: string | null) => {
      const v = (value || "").trim();
      if (v && !ordered.some(o => o.toLowerCase() === v.toLowerCase())) ordered.push(v);
    };
    recentSessions.forEach(r => add(r.assignment));
    [...(laps || [])]
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .forEach((lap: any) => add(lap.session_assignment));
    (tasks || []).forEach((task: any) => add(task.assignment));
    return ordered;
  }, [recentSessions, laps, tasks]);

  // Reset to a ready-to-go form each time the modal opens: default title, focused and selected
  useEffect(() => {
    if (!isOpen) return;
    const today = new Date().toLocaleDateString(i18n.language, { weekday: "short", day: "numeric" });
    setSessionTitle(`${t("session.startSession.defaultTitle", { defaultValue: "Study session" })} · ${today}`);
    setSessionDescription("");
    setAssignment("");
    setTitleError("");
    const id = requestAnimationFrame(() => {
      const input = document.getElementById("session-title") as HTMLInputElement | null;
      input?.focus();
      input?.select();
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Pre-select current workspace when modal opens (or null if "All" is selected)
  useEffect(() => {
    if (isOpen) {
      setWorkspaceId(activeWorkspace && activeWorkspace.id !== ALL_WORKSPACE_ID ? activeWorkspace.id : null);
    }
  }, [isOpen, activeWorkspace]);
  const validateForm = useCallback(() => {
    const titleValid = sessionTitle.trim().length > 0;
    if (!titleValid) {
      setTitleError(t("session.startSession.titleRequired"));
    } else {
      setTitleError("");
    }
    return titleValid;
  }, [sessionTitle, t]);
  useEffect(() => {
    setIsFormValid(sessionTitle.trim().length > 0 && !titleError);
  }, [sessionTitle, titleError]);
  const handleStart = async () => {
    if (!validateForm()) {
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const {
        data,
        error: userError
      } = await supabase.auth.getUser();
      if (userError || !data?.user) throw userError || new Error("User not authenticated");
      const nextSessionNumber = await StudyService.getNextSessionNumber();

      const session = await StudyService.createLap({
        user_id: data.user.id,
        started_at: new Date().toISOString(),
        duration: "00:00:00",
        tasks_completed: 0,
        name: sessionTitle.trim(),
        description: sessionDescription.trim(),
        session_number: nextSessionNumber,
        created_at: new Date().toISOString(),
        session_assignment: assignment || null,
        workspace_id: workspaceId || null
      });
      // Reset per-session Pomodoro count and set active session id immediately
      try {
        localStorage.setItem('pomodorosThisSession', '0');
        localStorage.setItem('activeSessionId', session.id);
        // Clear last notification timestamp so first completion notifies correctly
        localStorage.removeItem('lastPomoNotifyTs');
      } catch {}
      onStart({
        sessionId: session.id,
        title: sessionTitle.trim(),
        description: sessionDescription.trim(),
        syncPomo,
        syncCountdown
      });
      onClose();
    } catch (error) {
      console.error("Error starting session:", error instanceof Error ? error.message : error);
      toast.error(t("session.startSession.startError", { defaultValue: "Couldn't start the session. Please try again." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Ctrl/Cmd + Enter to start session
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (isFormValid && !isSubmitting) {
          handleStart();
        }
      }

      // Escape to close (unless typing in input)
      if (e.key === 'Escape' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        onClose();
      }

    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFormValid, isSubmitting, handleStart, onClose]);

  // Initial data fetch when modal opens is now handled in the main useEffect above

  if (!isOpen) return null;
  return <BaseModal isOpen={isOpen} onClose={onClose} title={t("session.startSession.title")} className="w-full px-4 sm:px-5" maxWidth="max-w-2xl" fullWidthOnMd={false}>
      <div
        className="space-y-6 w-full max-w-2xl mx-auto"
        onKeyDown={e => {
          if (e.key !== "Enter" || e.shiftKey || e.defaultPrevented) return;
          const target = e.target as HTMLElement;
          // Enter in the title / assignment fields starts the session; the description keeps its newlines
          if (target.id === "session-title" || target.id === "assignment") {
            e.preventDefault();
            if (isFormValid && !isSubmitting) handleStart();
          }
        }}
      >
          {/* Session Details Section */}
          <div className="bg-(--bg-secondary) rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-(--accent-primary)/10 rounded-lg">
                <Target size={20} className="text-(--accent-primary)" />
              </div>
              <h3 className="text-lg font-semibold text-(--text-primary)">{t("session.startSession.details")}</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="session-title" className="flex items-center gap-2 text-sm font-medium text-(--text-primary)">
                    {t("session.startSession.sessionTitle")} <span className="text-red-500">*</span>
                  </label>
                  <FormInput id="session-title" label="" value={sessionTitle} onChange={value => {
                  setSessionTitle(value);
                  if (titleError && value.trim()) {
                    setTitleError("");
                  }
                }} error={titleError} required placeholder={t("session.startSession.titlePlaceholder")} className="text-base" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="assignment" className="flex items-center gap-2 text-sm font-medium text-(--text-primary)">
                    {t("session.startSession.assignmentOptional")}
                  </label>
                  <AutocompleteInput id="assignment" value={assignment} onChange={setAssignment} placeholder={t("session.startSession.assignmentPlaceholder")} suggestions={assignmentSuggestions} />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="session-description" className="flex items-center gap-2 text-sm font-medium text-(--text-primary)">
                  {t("session.startSession.descriptionOptional")}
                </label>
                <FormTextarea id="session-description" label="" value={sessionDescription} onChange={setSessionDescription} error="" placeholder={t("session.startSession.descriptionPlaceholder")} className="w-full resize-none" rows={3} />
              </div>

              {/* Workspace selector */}
              <div className="space-y-2">
                <label htmlFor="workspace" className="flex items-center gap-2 text-sm font-medium text-(--text-primary)">
                  <Folder size={14} className="text-(--text-secondary)" />
                  {t("session.startSession.workspaceOptional")}
                </label>
                <select
                  id="workspace"
                  value={workspaceId ?? ""}
                  onChange={(e) => setWorkspaceId(e.target.value || null)}
                  className="w-full px-3 py-2.5 rounded-lg bg-(--bg-primary) border-2 border-(--border-primary) text-(--text-primary) text-sm focus:outline-none focus:border-(--accent-primary) transition-colors"
                >
                  <option value="">{t("session.startSession.noWorkspace")}</option>
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timer Sync Options */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-(--text-primary)">{t("session.startSession.timerOptions")}</h4>
                <div className="flex flex-nowrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSyncPomo(v => !v)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      syncPomo
                        ? "border-2 border-[#ef4444] text-[#ef4444] bg-(--bg-primary)"
                        : "border-2 border-(--border-primary) text-(--text-secondary) hover:border-[#ef4444]/50 bg-(--bg-primary)"
                    }`}
                  >
                    <Timer size={15} />
                    <span>Pomodoro</span>
                    {syncPomo && <Check size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSyncCountdown(v => !v)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      syncCountdown
                        ? "border-2 border-[#22c55e] text-[#22c55e] bg-(--bg-primary)"
                        : "border-2 border-(--border-primary) text-(--text-secondary) hover:border-[#22c55e]/50 bg-(--bg-primary)"
                    }`}
                  >
                    <Clock size={15} />
                    <span>Countdown</span>
                    {syncCountdown && <Check size={14} />}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Action buttons — compact and right-aligned, same as the other modals */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="cancel-button border-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </button>
            <button
              onClick={handleStart}
              disabled={isSubmitting || !sessionTitle.trim()}
              className="px-4 py-2 border-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 border-(--accent-primary) bg-transparent text-(--accent-primary) shadow-none hover:bg-transparent hover:text-(--accent-primary) focus:bg-transparent focus:text-(--accent-primary) disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isSubmitting ? t("session.startSession.startingAria") : t("session.startSession.startSessionAria")}
            >
              {isSubmitting ? <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-(--accent-primary) border-t-transparent" aria-hidden="true"></div>
                  <span>{t("session.startSession.starting")}</span>
                </> : <>
                  <Play size={16} />
                  <span>{t("session.startSession.startSession")}</span>
                </>}
            </button>
          </div>
      </div>
      </BaseModal>;
};
export default StartSessionModal;