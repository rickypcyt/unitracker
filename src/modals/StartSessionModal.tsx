import { AppDispatch, RootState } from "@/store/store";
import { Check, Square } from "lucide-react";
import { FormActions, FormInput, FormTextarea } from "@/modals/FormElements";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";

import AutocompleteInput from "@/modals/AutocompleteInput";
import BaseModal from "@/modals/BaseModal";
import { Task } from '@/pages/tasks/task';
import TaskForm from "@/pages/tasks/TaskForm";
import TaskSelectionPanel from "@/pages/tasks/TaskSelectionPanel";
import UnfinishedSessionsModal from "./UnfinishedSessionsModal";
import { supabase } from "@/utils/supabaseClient";
import { updateLap } from "@/store/LapActions";

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
  const syncPomodoroWithTimer = useSelector(
    (state: RootState) => state.ui.syncPomodoroWithTimer
  );
  const syncCountdownWithTimer = useSelector(
    (state: RootState) => state.ui.syncCountdownWithTimer
  );
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDescription, setSessionDescription] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [lastAddedTaskId, setLastAddedTaskId] = useState<string | null>(null);
  const [titleError, setTitleError] = useState(false);
  const [assignment, setAssignment] = useState("");
  const [assignments, setAssignments] = useState<string[]>([]);
  const [syncPomo, setSyncPomo] = useState(syncPomodoroWithTimer);
  const [syncCountdown, setSyncCountdown] = useState(syncCountdownWithTimer);
  const [showUnfinishedSessions, setShowUnfinishedSessions] = useState(false);
  const [isCheckingSessions, setIsCheckingSessions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const fetchSessionTasks = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("completed", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("tasks")
        .select("assignment")
        .not("assignment", "is", null)
        .eq("user_id", user.id)
        .order("assignment");

      if (error) throw error;

      const uniqueAssignments = Array.from(
        new Set(data.map((task: { assignment: string }) => task.assignment))
      );
      setAssignments(uniqueAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  }, []);

  const resetForm = useCallback(() => {
    fetchSessionTasks();
    setSessionTitle("");
    setSessionDescription("");
    setSelectedTasks([]);
    setAssignment("");
    setTitleError(false);
    fetchAssignments();
  }, [fetchSessionTasks, fetchAssignments]);

  const checkUnfinishedSessions = useCallback(async () => {
    if (!isOpen) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("study_laps")
        .select("id")
        .is("ended_at", null)
        .eq("user_id", user.id)
        .limit(1);

      if (error) throw error;

      const hasSessions = data ? data.length > 0 : false;
      setShowUnfinishedSessions(hasSessions);
    } catch (error) {
      console.error("Error checking for unfinished sessions:", error);
    } finally {
      setIsCheckingSessions(false);
    }
  }, [isOpen]);

  const handleSessionResumed = useCallback(
    async (sessionId: string) => {
      if (sessionId) {
        try {
          // Fetch real session title to avoid showing "Untitled" on resume
          const { data: session, error } = await supabase
            .from("study_laps")
            .select("name, description")
            .eq("id", sessionId)
            .maybeSingle();

          const resolvedTitle = (session?.name || sessionTitle || "Untitled Session").trim();

          if (error) {
            console.error("Error fetching session name on resume:", error);
          }

          onStart({
            sessionId,
            title: resolvedTitle,
            syncPomo,
            syncCountdown,
          });
        } catch (e) {
          console.error("Resume session failed, falling back:", e);
          onStart({
            sessionId,
            title: sessionTitle || "Untitled Session",
            syncPomo,
            syncCountdown,
          });
        }
      } else {
        setShowUnfinishedSessions(false);
      }
    },
    [onStart, sessionTitle, syncPomo, syncCountdown]
  );

  const handleFinishAllSessions = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date().toISOString();

      const { data: sessions, error: fetchError } = await supabase
        .from("study_laps")
        .select("id, started_at, duration")
        .is("ended_at", null)
        .eq("user_id", user.id);

      if (fetchError) throw fetchError;

      if (!sessions || sessions.length === 0) {
        setShowUnfinishedSessions(false);
        return;
      }

      const toHMS = (totalSeconds: number) => {
        const s = Math.max(0, Math.floor(totalSeconds));
        const h = Math.floor(s / 3600)
          .toString()
          .padStart(2, "0");
        const m = Math.floor((s % 3600) / 60)
          .toString()
          .padStart(2, "0");
        const sec = (s % 60).toString().padStart(2, "0");
        return `${h}:${m}:${sec}`;
      };

      const parseHMS = (hms?: string | null): number => {
        if (!hms) return 0;
        const parts = hms.split(":");
        if (parts.length !== 3) return 0;
        const [h, m, s] = parts.map((p) => parseInt(p, 10));
        return (Number.isFinite(h) ? h : 0) * 3600 + (Number.isFinite(m) ? m : 0) * 60 + (Number.isFinite(s) ? s : 0);
      };

      const updates = sessions.map((session) => {
        const existingSec = parseHMS(session.duration as any);
        const payload: any = { ended_at: now };
        if (!existingSec || existingSec <= 0) {
          const seconds = Math.floor(
            (new Date(now).getTime() - new Date(session.started_at).getTime()) / 1000
          );
          payload.duration = toHMS(seconds);
        }
        return dispatch(updateLap(session.id, payload));
      });

      await Promise.all(updates);
      setShowUnfinishedSessions(false);
    } catch (error) {
      console.error("Error finishing all sessions:", error);
    }
  }, [dispatch]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      setIsCheckingSessions(true);
      checkUnfinishedSessions();
    } else {
      setShowUnfinishedSessions(false);
      setIsCheckingSessions(false);
    }
  }, [isOpen, checkUnfinishedSessions, resetForm]);

  useEffect(() => {
    setSyncPomo(syncPomodoroWithTimer);
    setSyncCountdown(syncCountdownWithTimer);
  }, [syncPomodoroWithTimer, syncCountdownWithTimer, isOpen]);

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
  }, [lastAddedTaskId, fetchSessionTasks]);


  const handleMoveTask = (task: Task, toActive: boolean) => {
    setSelectedTasks((prev) => {
      if (toActive) {
        if (!prev.includes(task.id)) {
          return [...prev, task.id];
        }
      } else {
        return prev.filter((id) => id !== task.id);
      }
      return prev;
    });
  };

  const handleStart = async () => {
    if (!sessionTitle.trim()) {
      setTitleError(true);
      return;
    }

    setTitleError(false);

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;

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

      const { data: existingSession, error: checkError } = await supabase
        .from("study_laps")
        .select("id")
        .eq("name", sessionTitle.trim())
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking for existing session:", checkError);
      }

      if (existingSession) {
        onStart({
          sessionId: existingSession.id,
          tasks: selectedTasks,
          title: sessionTitle.trim(),
          description: sessionDescription.trim(),
          syncPomo,
          syncCountdown,
        });
        onClose();
        setIsSubmitting(false);
        return;
      }

      const { data: session, error: sessionError } = await supabase
        .from("study_laps")
        .insert([
          {
            user_id: user?.id!,
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

      if (selectedTasks.length > 0) {
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

  // Initial data fetch when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSessionTasks();
      fetchAssignments();
    }
  }, [isOpen, fetchSessionTasks, fetchAssignments]);

  if (!isOpen) return null;

  if (isCheckingSessions) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-[var(--bg-primary)] rounded-xl p-8 max-w-md w-full mx-4 border border-[var(--border-primary)]">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)]"></div>
            <p className="text-[var(--text-primary)]">
              Checking for unfinished sessions...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showUnfinishedSessions) {
    return (
      <UnfinishedSessionsModal
        isOpen={showUnfinishedSessions}
        onClose={() => {
          setShowUnfinishedSessions(false);
          onClose();
        }}
        onSessionResumed={handleSessionResumed}
        onFinishAllSessions={handleFinishAllSessions}
      />
    );
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Start Study Session"
      className="w-full max-w-4xl px-4 sm:px-6"
      fullWidthOnMd={true}
    >
      <div className="space-y-6 w-full">
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="session-title"
                  className="text-sm font-medium text-[var(--text-primary)]"
                >
                  Title <span className="text-red-500">*</span>
                </label>
              </div>
              <FormInput
                id="session-title"
                label=""
                value={sessionTitle}
                onChange={setSessionTitle}
                error={titleError ? "Please enter a session title" : ""}
                required
                placeholder="Enter session title"
              />
            </div>
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="assignment"
                  className="text-sm font-medium text-[var(--text-primary)]"
                >
                  Assignment (optional)
                </label>
              </div>
              <AutocompleteInput
                id="assignment"
                value={assignment}
                onChange={setAssignment}
                placeholder="Enter assignment name"
                suggestions={assignments as string[]}
              />
            </div>
          </div>
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="session-description"
                className="text-sm font-medium text-[var(--text-primary)]"
              >
                Description (Optional)
              </label>
            </div>
            <FormTextarea
              id="session-description"
              label=""
              value={sessionDescription}
              onChange={setSessionDescription}
              error=""
              placeholder="Add a description (optional)"
              className="w-full"
            />
          </div>


          {/* Sync controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setSyncPomo((v) => !v)}
              className="flex items-center justify-between w-full gap-3 px-3 py-2 rounded-lg border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer text-[var(--text-secondary)] text-sm"
            >
              <span>Start pomodoro</span>
              {syncPomo ? (
                <Check size={18} className="text-[var(--accent-primary)]" />
              ) : (
                <Square size={18} className="text-[var(--accent-primary)]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setSyncCountdown((v) => !v)}
              className="flex items-center justify-between w-full gap-3 px-3 py-2 rounded-lg border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer text-[var(--text-secondary)] text-sm"
            >
              <span>Start countdown</span>
              {syncCountdown ? (
                <Check size={18} className="text-[var(--accent-primary)]" />
              ) : (
                <Square size={18} className="text-[var(--accent-primary)]" />
              )}
            </button>
          </div>
        </div>

        <TaskSelectionPanel
          tasks={tasks}
          selectedTasks={selectedTasks}
          onMoveTask={handleMoveTask}
          onTaskSelect={(taskId) => {
            setSelectedTasks(prev => {
              if (prev.includes(taskId)) {
                return prev.filter(id => id !== taskId);
              } else {
                return [...prev, taskId];
              }
            });
          }}
          onAddTask={() => setShowTaskForm(true)}
          maxHeight="150px"
          hideAssignmentAndDescriptionAvailable={true}
        />

        <FormActions>
          <button
            type="button"
            onClick={onClose}
            className="cancel-button border-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStart}
            disabled={isSubmitting}
            className="px-4 py-2 border-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 undefined border border-[var(--accent-primary)] bg-transparent text-[var(--accent-primary)] shadow-none hover:bg-transparent hover:text-[var(--accent-primary)] focus:bg-transparent focus:text-[var(--accent-primary)]"
          >
            {isSubmitting ? "Starting…" : "Start Session"}
          </button>
        </FormActions>
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
