import {
  TASK_STATUSES,
  normalizeTaskStatus,
  type TaskStatusId,
} from "@/constants/taskStatus";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUpdateTaskSuccess } from "@/store/appStore";

interface TaskStatusPickerProps {
  task: any;
}

const TaskStatusPicker = ({ task }: TaskStatusPickerProps) => {
  const { user } = useAuth();
  const updateTaskSuccess = useUpdateTaskSuccess();

  const current = normalizeTaskStatus(task.status);

  const setStatus = async (statusId: TaskStatusId) => {
    if (statusId === current) return;

    // Keep `status` and the legacy `completed` flag in sync
    const willComplete = statusId === "completed";
    const updated = {
      ...task,
      status: statusId,
      activetask: statusId === "in_progress",
      completed: willComplete,
      completed_at: willComplete
        ? (task.completed_at ?? new Date().toISOString())
        : null,
    };

    updateTaskSuccess(updated);

    if (!user) return;
    const { error } = await supabase
      .from("tasks")
      .update({
        status: updated.status,
        activetask: updated.activetask,
        completed: updated.completed,
        completed_at: updated.completed_at,
      })
      .eq("id", task.id);

    if (error) {
      console.error("Error updating task status:", error);
      updateTaskSuccess(task); // revert optimistic update
    }
  };

  const cycle = TASK_STATUSES.filter((st) => st.id !== "completed");
  const config = cycle.find((st) => st.id === current) ?? cycle[0]!;
  const next = cycle[(cycle.findIndex((st) => st.id === config.id) + 1) % cycle.length]!;

  // One compact pill: shows the current status and cycles To Do → In Progress → On Hold on click
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void setStatus(next.id);
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      title={`${config.label} — click for ${next.label}`}
      aria-label={`Status: ${config.label}. Click to change to ${next.label}`}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[length:var(--t-meta,12px)] font-semibold leading-none select-none ${config.textColor}`}
      style={{ backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)" }}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${config.bgColor}`} />
      {config.label}
    </button>
  );
};

export default TaskStatusPicker;
