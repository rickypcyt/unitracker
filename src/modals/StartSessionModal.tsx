import { Check, Clock, Play, Target, Timer } from "lucide-react";
import { FormInput, FormTextarea } from "@/modals/FormElements";
import { useCallback, useEffect, useState } from "react";

import AutocompleteInput from "@/modals/AutocompleteInput";
import BaseModal from "@/modals/BaseModal";
import { supabase } from "@/utils/supabaseClient";
import { useAppStore } from "@/store/appStore";

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
  const {
    syncSettings
  } = useAppStore();
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
  const validateForm = useCallback(() => {
    const titleValid = sessionTitle.trim().length > 0;
    if (!titleValid) {
      setTitleError("Session title is required");
    } else {
      setTitleError("");
    }
    return titleValid;
  }, [sessionTitle]);
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
      const today = new Date().toISOString().split("T")[0];
      const {
        data: latestSession,
        error: latestSessionError
      } = await supabase.from("study_laps").select("session_number").gte("created_at", `${today}T00:00:00`).lte("created_at", `${today}T23:59:59`).order("session_number", {
        ascending: false
      }).limit(1).maybeSingle();
      if (latestSessionError && latestSessionError.code !== "PGRST116") throw latestSessionError;
      const nextSessionNumber = latestSession ? Number(latestSession.session_number) + 1 : 1;

      // Always create a new session even if another one shares the same name
      // Each session must have a unique id; do not reuse by name

      const {
        data: session,
        error: sessionError
      } = await supabase.from("study_laps").insert([{
        user_id: data.user.id,
        started_at: new Date().toISOString(),
        tasks_completed: 0,
        name: sessionTitle.trim(),
        description: sessionDescription.trim(),
        session_number: nextSessionNumber,
        created_at: new Date().toISOString(),
        session_assignment: assignment || null
      }]).select().single();
      if (sessionError) throw sessionError;
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
      console.error("Error starting session:", error);
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
  return <BaseModal isOpen={isOpen} onClose={onClose} title="Start Session" className="w-full px-4 sm:px-5" maxWidth="max-w-2xl" fullWidthOnMd={false}>
      <div className="space-y-6 w-full max-w-2xl mx-auto">
          {/* Session Details Section */}
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg">
                <Target size={20} className="text-[var(--accent-primary)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Session Details</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="session-title" className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                    Session Title <span className="text-red-500">*</span>
                  </label>
                  <FormInput id="session-title" label="" value={sessionTitle} onChange={value => {
                  setSessionTitle(value);
                  if (titleError && value.trim()) {
                    setTitleError("");
                  }
                }} error={titleError} required placeholder="e.g., Algebra Homework" className="text-base" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="assignment" className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                    Assignment (optional)
                  </label>
                  <AutocompleteInput id="assignment" value={assignment} onChange={setAssignment} placeholder="e.g., Math" suggestions={[]} />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="session-description" className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                  Description (optional)
                </label>
                <FormTextarea id="session-description" label="" value={sessionDescription} onChange={setSessionDescription} error="" placeholder="Add notes about what you want to accomplish..." className="w-full resize-none" rows={3} />
              </div>

              {/* Timer Sync Options */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-[var(--text-primary)]">Timer Options</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSyncPomo(v => !v)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      syncPomo
                        ? "border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--bg-primary)]"
                        : "border border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/50 bg-[var(--bg-primary)]"
                    }`}
                  >
                    <Timer size={15} />
                    <span>Pomodoro</span>
                    {syncPomo && <Check size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSyncCountdown(v => !v)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      syncCountdown
                        ? "border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--bg-primary)]"
                        : "border border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/50 bg-[var(--bg-primary)]"
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
        </div>

        {/* Action Section */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            aria-label="Cancel and close modal"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStart}
            disabled={isSubmitting || !sessionTitle.trim()}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              isSubmitting || !sessionTitle.trim()
                ? "bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] cursor-not-allowed"
                : "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-deep)] shadow-md"
            }`}
            aria-label={isSubmitting ? "Starting session" : "Start session"}
          >
            {isSubmitting ? <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" aria-hidden="true"></div>
                <span>Starting...</span>
              </> : <>
                <Play size={18} />
                <span>Start Session</span>
              </>}
          </button>
        </div>

      </BaseModal>;
};
export default StartSessionModal;