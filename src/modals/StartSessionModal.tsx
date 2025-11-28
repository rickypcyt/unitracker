import { Check, ChevronRight, Clock, List, Square, Target, Zap } from "lucide-react";
import { FormInput, FormTextarea } from "@/modals/FormElements";
import {
  useCallback,
  useEffect,
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
  const [assignments, setAssignments] = useState<string[]>([]);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null);
  const [includeTasks, setIncludeTasks] = useState(false);
  
  // Session templates
  const sessionTemplates = [
    { title: "Pomodoro Study", description: "25 minutes focused work", syncPomo: true, syncCountdown: false },
    { title: "Deep Work Session", description: "2 hours uninterrupted study", syncPomo: false, syncCountdown: true },
    { title: "Quick Review", description: "15 minutes material review", syncPomo: true, syncCountdown: false },
    { title: "Assignment Work", description: "Complete homework tasks", syncPomo: false, syncCountdown: true },
  ];
  const [syncPomo, setSyncPomo] = useState(syncPomodoroWithTimer);
  const [syncCountdown, setSyncCountdown] = useState(syncCountdownWithTimer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  const fetchAssignments = useCallback(async () => {
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data?.user) return;

      const { data: assignmentData, error } = await supabase
        .from("tasks")
        .select("assignment")
        .not("assignment", "is", null)
        .eq("user_id", data.user.id)
        .order("assignment");

      if (error) throw error;

      const uniqueAssignments = Array.from(
        new Set(assignmentData?.map((task: { assignment: string }) => task.assignment) || [])
      );
      setAssignments(uniqueAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  }, []);

  const applyTemplate = (template: typeof sessionTemplates[0], index: number) => {
    console.log('[StartSessionModal] 📋 Applying template:', {
      title: template.title,
      description: template.description,
      syncPomo: template.syncPomo,
      syncCountdown: template.syncCountdown,
      templateIndex: index
    });

    setSessionTitle(template.title);
    setSessionDescription(template.description);
    setSyncPomo(template.syncPomo);
    setSyncCountdown(template.syncCountdown);
    setTitleError("");
    setSelectedTemplateIndex(index);
    
    console.log('[StartSessionModal] ✅ Template applied successfully:', {
      newTitle: template.title,
      newDescription: template.description,
      newSyncPomo: template.syncPomo,
      newSyncCountdown: template.syncCountdown
    });
  };

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

  const resetForm = useCallback(() => {
    setSessionTitle("");
    setSessionDescription("");
    setSelectedTasks([]);
    setAssignment("");
    setTitleError("");
    setIsFormValid(false);
    setSelectedTemplateIndex(null);
    setIncludeTasks(false);
    setSyncPomo(syncPomodoroWithTimer);
    setSyncCountdown(syncCountdownWithTimer);
  }, [syncPomodoroWithTimer, syncCountdownWithTimer]);

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

  const handleStart = async () => {
    console.log('[StartSessionModal] 🚀 Starting session with current settings:', {
      title: sessionTitle.trim(),
      description: sessionDescription.trim(),
      syncPomo,
      syncCountdown,
      selectedTasksCount: selectedTasks.length,
      selectedTemplateIndex
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
        console.log('[StartSessionModal] 📋 Resuming existing session:', existingSession.id);
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
      title="Start Study Session"
      className="w-full max-w-5xl px-4 sm:px-6"
      fullWidthOnMd={true}
    >
      <div className="space-y-6 w-full">
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
                <label
                  htmlFor="session-title"
                  className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]"
                >
                  <Clock size={16} className="text-[var(--text-secondary)]" />
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
                  placeholder="e.g., Math Chapter 5 Review"
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="assignment"
                  className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]"
                >
                  <ChevronRight size={16} className="text-[var(--text-secondary)]" />
                  Assignment (optional)
                </label>
                <AutocompleteInput
                  id="assignment"
                  value={assignment}
                  onChange={setAssignment}
                  placeholder="e.g., CS101 Homework"
                  suggestions={assignments}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label
                htmlFor="session-description"
                className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]"
              >
                <Target size={16} className="text-[var(--text-secondary)]" />
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
            <div className="bg-[var(--bg-primary)] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-[var(--accent-primary)]" />
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

        <div className="border-t border-[var(--border-primary)]/50"></div>

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
            {/* Include Tasks Toggle */}
            <div className="flex items-center justify-between p-3 bg-[var(--bg-primary)] rounded-lg">
              <div>
                <div className="font-medium text-[var(--text-primary)]">Include tasks in this session?</div>
                <div className="text-sm text-[var(--text-secondary)]">Select tasks to focus on during your study session</div>
              </div>
              <button
                onClick={() => setIncludeTasks(!includeTasks)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  includeTasks ? "bg-[var(--accent-primary)]" : "bg-[var(--bg-secondary)]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    includeTasks ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Task List - Only show when toggle is on */}
            {includeTasks && (
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
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => {
                          setSelectedTasks(prev => {
                            if (prev.includes(task.id)) {
                              return prev.filter(id => id !== task.id);
                            } else {
                              return [...prev, task.id];
                            }
                          });
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          selectedTasks.includes(task.id)
                            ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10"
                            : "border-[var(--border-primary)] hover:bg-[var(--bg-hover)]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              selectedTasks.includes(task.id)
                                ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]"
                                : "border-[var(--border-primary)]"
                            }`}>
                              {selectedTasks.includes(task.id) && (
                                <Check size={12} className="text-white" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-[var(--text-primary)] text-sm">
                                {task.title}
                              </div>
                              {task.assignment && (
                                <div className="text-xs text-[var(--text-secondary)]">
                                  {task.assignment}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add Task Button */}
                {tasks.length > 0 && (
                  <button
                    onClick={() => setShowTaskForm(true)}
                    className="w-full p-2 border-2 border-dashed border-[var(--border-primary)] rounded-lg text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors duration-200 text-sm"
                  >
                    + Add new task
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[var(--border-primary)]/50"></div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-2">
          <div className="text-sm text-[var(--text-secondary)]">
            {includeTasks && selectedTasks.length > 0 && (
              <span className="flex items-center gap-2">
                <Check size={16} className="text-green-500" />
                Ready with {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}
              </span>
            )}
            {includeTasks && selectedTasks.length === 0 && (
              <span className="flex items-center gap-2">
                <Clock size={16} />
                No tasks selected
              </span>
            )}
            {!includeTasks && (
              <span className="flex items-center gap-2">
                <Zap size={16} />
                Focus mode
              </span>
            )}
          </div>
            
          <div className="flex gap-3">
            <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-[var(--bg-secondary)] rounded-lg font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors duration-200"
                aria-label="Cancel and close modal"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStart}
                disabled={isSubmitting || !sessionTitle.trim()}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  isSubmitting || !sessionTitle.trim()
                    ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed"
                    : "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90 shadow-lg hover:shadow-xl"
                }`}
                aria-label={isSubmitting ? "Starting session" : "Start study session"}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" aria-hidden="true"></div>
                    Starting Session...
                  </>
                ) : (
                  <>
                    <Zap size={18} aria-hidden="true" />
                    Start Session
                  </>
                )}
              </button>
            </div>
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
