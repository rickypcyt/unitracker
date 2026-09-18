import {
  TASK_STATUSES,
  normalizeTaskStatus,
  type TaskStatusId,
} from "@/constants/taskStatus";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
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

  return (
    <div
      className="grid grid-cols-4 gap-1.5 pt-1 w-full"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {TASK_STATUSES.map((s) => {
        const selected = s.id === current;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => setStatus(s.id)}
            aria-pressed={selected}
            className={`w-full px-2 py-1.5 rounded-lg border-2 text-xs font-medium leading-none text-center transition-colors select-none ${
              selected
                ? `border-[var(--accent-primary)] ${s.textColor} bg-transparent`
                : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
};

export default TaskStatusPicker;
