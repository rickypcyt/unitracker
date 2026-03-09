import { Check, List, Square, Target } from "lucide-react";
import { FormInput, FormTextarea } from "@/modals/FormElements";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import AutocompleteInput from "@/modals/AutocompleteInput";
import BaseModal from "@/modals/BaseModal";
import { Task } from '@/pages/tasks/task';
import TaskForm from "@/pages/tasks/TaskForm";
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
  onStart,
}: StartSessionModalProps) => {
  const { syncSettings } = useAppStore();
  const syncPomodoroWithTimer = syncSettings.syncPomodoroWithTimer;
  const syncCountdownWithTimer = syncSettings.syncCountdownWithTimer;
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDescription, setSessionDescription] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [lastAddedTaskId, setLastAddedTaskId] = useState<string | null>(null);
  const [titleError, setTitleError] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const [assignment, setAssignment] = useState("");
  const assignmentSuggestions = useMemo(() => (
    [...new Set(
      tasks
        .map((task) => (task.assignment ?? "").trim())
        .filter((value) => value.length > 0)
    )].sort((a, b) => a.localeCompare(b))
  ), [tasks]);
  
  const [syncPomo, setSyncPomo] = useState(syncPomodoroWithTimer);
  const [syncCountdown, setSyncCountdown] = useState(syncCountdownWithTimer);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const groupedTasks = useMemo(() => {
    const groups = new Map<string, Task[]>();

    tasks.forEach((task) => {
      const key = task.assignment?.trim() || "No Assignment";
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(task);
    });

    return Array.from(groups.entries()).sort(([a], [b]) =>
      a === "No Assignment" ? 1 : b === "No Assignment" ? -1 : a.localeCompare(b)
    );
  }, [tasks]);
  
  const fetchSessionTasks = useCallback(async () => {
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data?.user) return;

      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", data.user.id)
        .eq("completed", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTasks(tasks || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, []);


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


  useEffect(() => {
    if (lastAddedTaskId) {
      setSelectedTasks((prev) => {
        if (!prev.includes(lastAddedTaskId)) {
          return [...prev, lastAddedTaskId];
        }
        return prev;
      });
      setLastAddedTaskId(null);
      fetchSessionTasks();
    }
  }, [lastAddedTaskId]); // Remove fetchSessionTasks dependency to prevent infinite loop

  // Fetch tasks when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSessionTasks();
    }
  }, [isOpen, fetchSessionTasks]);

  const handleStart = async () => {
    console.log('[StartSessionModal] 🚀 Starting session with current settings:', {
      title: sessionTitle.trim(),
      description: sessionDescription.trim(),
      syncPomo,
      syncCountdown,
    });

    if (!validateForm()) {
      console.log('[StartSessionModal] ❌ Form validation failed');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data?.user) throw userError || new Error("User not authenticated");

      const today = new Date().toISOString().split("T")[0];

      const { data: latestSession, error: latestSessionError } = await supabase
        .from("study_laps")
        .select("session_number")
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`)
        .order("session_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestSessionError && latestSessionError.code !== "PGRST116")
        throw latestSessionError;

      const nextSessionNumber = latestSession
        ? Number(latestSession.session_number) + 1
        : 1;

      // Always create a new session even if another one shares the same name
      // Each session must have a unique id; do not reuse by name

      const { data: session, error: sessionError } = await supabase
        .from("study_laps")
        .insert([
          {
            user_id: data.user.id,
            started_at: new Date().toISOString(),
            tasks_completed: 0,
            name: sessionTitle.trim(),
            description: sessionDescription.trim(),
            session_number: nextSessionNumber,
            created_at: new Date().toISOString(),
            session_assignment: assignment || null,
          },
        ])
        .select()
        .single();

      if (sessionError) throw sessionError;

      console.log('[StartSessionModal] ✅ New session created:', session.id);

      if (selectedTasks.length > 0) {
        console.log('[StartSessionModal] 📝 Adding tasks to session:', selectedTasks.length);
        const { error: sessionTasksError } = await supabase
          .from("session_tasks")
          .insert(
            selectedTasks.map((taskId) => ({
              session_id: session.id,
              task_id: taskId,
              completed_at: null,
            }))
          );

        if (sessionTasksError) throw sessionTasksError;

        const { error: updateTasksError } = await supabase
          .from("tasks")
          .update({ activetask: true })
          .in("id", selectedTasks);

        if (updateTasksError) {
          console.error(
            "Error updating tasks activetask status:",
            updateTasksError
          );
        }
      }

      console.log('[StartSessionModal] 🎯 Calling onStart with sync settings:', {
        sessionId: session.id,
        tasks: selectedTasks,
        title: sessionTitle.trim(),
        description: sessionDescription.trim(),
        syncPomo,
        syncCountdown,
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
        tasks: selectedTasks,
        title: sessionTitle.trim(),
        description: sessionDescription.trim(),
        syncPomo,
        syncCountdown,
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
      
      // Ctrl/Cmd + N to add new task
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowTaskForm(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFormValid, isSubmitting, handleStart, onClose]);

  // Initial data fetch when modal opens is now handled in the main useEffect above

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Start Session"
      className="w-full px-4 sm:px-5"
      maxWidth="max-w-[60rem]"
      fullWidthOnMd={false}
    >
      <div className="space-y-6 w-full max-w-[56rem] mx-auto">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-6">
            {/* Session Details Section */}
            <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className=" bg-[var(--accent-primary)]/10 rounded-lg">
                  <Target size={20} className="text-[var(--accent-primary)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Session Details</h3>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="session-title"
                      className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]"
                    >
                      Session Title <span className="text-red-500">*</span>
                    </label>
                    <FormInput
                      id="session-title"
                      label=""
                      value={sessionTitle}
                      onChange={(value) => {
                        setSessionTitle(value);
                        if (titleError && value.trim()) {
                          setTitleError("");
                        }
                      }}
                      error={titleError}
                      required
                      placeholder="e.g., Algebra Homework"
                      className="text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="assignment"
                      className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]"
                    >
                      Assignment (optional)
                    </label>
                    <AutocompleteInput
                      id="assignment"
                      value={assignment}
                      onChange={setAssignment}
                      placeholder="e.g., Math"
                      suggestions={assignmentSuggestions}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label
                    htmlFor="session-description"
                    className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]"
                  >
                    Description (optional)
                  </label>
                  <FormTextarea
                    id="session-description"
                    label=""
                    value={sessionDescription}
                    onChange={setSessionDescription}
                    error=""
                    placeholder="Add notes about what you want to accomplish..."
                    className="w-full resize-none"
                    rows={3}
                  />
                </div>

                {/* Timer Sync Options */}
                <div className="bg-[var(--bg-primary)] rounded-lg ">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-medium text-[var(--text-primary)]">Timer Options</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSyncPomo((v) => !v)}
                      className={`flex items-center justify-between w-full gap-3 px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                        syncPomo 
                          ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]" 
                          : "border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
                      }`}
                    >
                      <span className="font-medium text-sm">Start Pomodoro Timer</span>
                      {syncPomo ? (
                        <Check size={18} className="text-[var(--accent-primary)]" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSyncCountdown((v) => !v)}
                      className={`flex items-center justify-between w-full gap-3 px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                        syncCountdown 
                          ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]" 
                          : "border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
                      }`}
                    >
                      <span className="font-medium text-sm">Start Countdown Timer</span>
                      {syncCountdown ? (
                        <Check size={18} className="text-[var(--accent-primary)]" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border-primary)]/50 lg:hidden"></div>
          </div>

          <div className="space-y-6">
            {/* Task Selection Section */}
            <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <List size={20} className="text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">Tasks</h3>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                    {tasks.length === 0 ? (
                      <div className="text-center py-8 text-[var(--text-secondary)]">
                        <List size={48} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No tasks available</p>
                        <button
                          onClick={() => setShowTaskForm(true)}
                          className="mt-2 text-sm text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80"
                        >
                          Create your first task
                        </button>
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto pr-1 [scrollbar-color:var(--accent-primary)_transparent] space-y-3">
                        {groupedTasks.map(([assignmentLabel, grouped]) => (
                          <div key={assignmentLabel} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                                <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)]"></span>
                                {assignmentLabel}
                              </div>
                              <span className="text-[10px] text-[var(--text-tertiary)]">{grouped.length} task{grouped.length !== 1 ? "s" : ""}</span>
                            </div>
                            <div className="flex flex-col gap-3">
                              {grouped.map((task) => {
                                const isSelected = selectedTasks.includes(task.id);
                                return (
                                  <div
                                    key={task.id}
                                    onClick={() => {
                                      setSelectedTasks((prev) => {
                                        if (prev.includes(task.id)) {
                                          return prev.filter((id) => id !== task.id);
                                        }
                                        return [...prev, task.id];
                                      });
                                    }}
                                    className={`group relative flex w-full cursor-pointer flex-col gap-3 rounded-xl border-2 p-4 transition-all duration-200 ${
                                      isSelected
                                        ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-[0_10px_30px_-18px_rgba(34,197,94,0.6)]"
                                        : "border-[var(--border-primary)] bg-[var(--bg-primary)] hover:border-[var(--accent-primary)]/70 hover:bg-[var(--bg-secondary)]"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1 min-w-[200px]">
                                        <div className="text-sm font-semibold text-[var(--text-primary)]">
                                          {task.title}
                                        </div>
                                        {task.assignment && (
                                          <div className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                                            {task.assignment}
                                          </div>
                                        )}
                                      </div>
                                      <div
                                        className={`ml-auto flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border-2 transition-colors duration-200 ${
                                          isSelected
                                            ? "border-[var(--accent-primary)] text-[var(--accent-primary)] bg-transparent"
                                            : "border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] group-hover:border-[var(--accent-primary)]"
                                        }`}
                                      >
                                        {isSelected && <Check size={14} />}
                                      </div>
                                    </div>
                                    {task.description && (
                                      task.description.includes('<') ? (
                                        <div
                                          className="text-[var(--text-secondary)] text-xs leading-relaxed break-words prose prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-li:whitespace-pre-wrap"
                                          dangerouslySetInnerHTML={{ __html: task.description }}
                                        />
                                      ) : (
                                        <p className="text-xs leading-relaxed text-[var(--text-secondary)] line-clamp-3 whitespace-pre-line">
                                          {task.description}
                                        </p>
                                      )
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border-primary)]/50"></div>

        {/* Action Section */}
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-secondary)] transition-all duration-200"
              aria-label="Cancel and close modal"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStart}
              disabled={isSubmitting || !sessionTitle.trim()}
              className={`flex-1 px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                isSubmitting || !sessionTitle.trim()
                  ? "bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-secondary)] cursor-not-allowed"
                  : "text-[var(--accent-primary)] border-2 border-[var(--accent-primary)] bg-transparent hover:bg-[var(--accent-primary)]/10"
              }`}
              aria-label={isSubmitting ? "Starting session" : "Start session"}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" aria-hidden="true"></div>
                  Starting...
                </>
              ) : (
                <>Start Session</>
              )}
            </button>
          </div>
        </div>

        {showTaskForm && (
          <TaskForm
            onClose={() => setShowTaskForm(false)}
            onTaskCreated={(newTaskId) => {
              setLastAddedTaskId(newTaskId);
            }}
          />
        )}
      </BaseModal>
  );
};

export default StartSessionModal;

