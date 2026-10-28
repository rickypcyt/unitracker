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

  return (
    <div
      role="group"
      aria-label="Task status"
      className="col-span-2 row-start-2 flex flex-nowrap gap-1 sm:gap-1.5 min-w-0 w-full overflow-x-auto pb-0.5"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {TASK_STATUSES.filter((s) => s.id !== 'completed').map((s) => {
        const selected = s.id === current;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => setStatus(s.id)}
            aria-pressed={selected}
            className={`flex-1 shrink-0 whitespace-nowrap px-2 py-2 sm:py-1.5 rounded-lg border sm:border-2 text-[11px] sm:text-xs font-medium leading-none text-center transition-colors select-none ${
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
