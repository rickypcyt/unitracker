import { CheckCircle2, Circle, Pencil, Plus, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { useSessionTaskActions } from '@/hooks/session/useSessionTaskActions';
import type { Task } from '@/schemas/task';

const POPOVER_WIDTH = 260;

interface Props {
  day: Date | null;
  tasks: Task[];
  onClose: () => void;
  top?: number;
  /** horizontal center of the anchor day, relative to the month section */
  left?: number;
}

const DayTasksPopover = ({ day, tasks, onClose, top, left }: Props) => {
  const { busy, editTask: openEditor, toggleTask, requestDelete, modals } = useSessionTaskActions('calendar', onClose);
  const editTask = (task: Task | null) => {
    if (day) openEditor(task, format(day, 'yyyy-MM-dd'));
  };

  const clampedLeft =
    left === undefined
      ? '8px'
      : `clamp(8px, ${left - POPOVER_WIDTH / 2}px, calc(100% - ${POPOVER_WIDTH + 8}px))`;

  return (
    <>
      {day && (
        <div
          role="dialog"
          aria-label={`Tasks for ${format(day, 'MMMM d, yyyy')}`}
          style={{ top: top ?? '100%', left: clampedLeft, width: POPOVER_WIDTH }}
          className="absolute z-50 max-h-72 overflow-y-auto rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-2xl text-left"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-1 border-b border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-1.5">
            <h4 className="text-xs font-semibold text-[var(--text-primary)]">
              {format(day, 'EEE, MMM d')}
              {tasks.length > 0 && (
                <span className="ml-1.5 font-normal text-[var(--text-secondary)]">· {tasks.length}</span>
              )}
            </h4>
            <div className="flex items-center">
              <button onClick={() => editTask(null)} aria-label="Add task for this day" className="p-1 rounded text-[var(--accent-primary)] hover:bg-[var(--bg-secondary)]"><Plus size={15} /></button>
              <button onClick={onClose} aria-label="Close day tasks" className="p-1 rounded text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"><X size={15} /></button>
            </div>
          </div>
          <div className="p-1">
            {tasks.length === 0 && <p className="px-2 py-2.5 text-xs text-[var(--text-secondary)]">No tasks — hit + to add one.</p>}
            {tasks.map(task => (
              <div key={task.id} className="group flex items-center gap-1 rounded-md px-1 py-1 hover:bg-[var(--bg-secondary)]">
                <button disabled={busy !== null} onClick={() => void toggleTask(task)} aria-label={`${task.completed ? 'Reopen' : 'Complete'} ${task.title}`} className="p-0.5 shrink-0 text-[var(--accent-primary)] disabled:opacity-50">
                  {task.completed ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                </button>
                <div className="flex-1 min-w-0">
                  <button onClick={() => editTask(task)} title={task.title} className={`block w-full truncate text-left text-xs font-medium text-[var(--text-primary)] ${task.completed ? 'line-through opacity-60' : ''}`}>
                    {task.title}
                  </button>
                  {(task.assignment || task.description) && (
                    <p className="truncate text-[11px] leading-tight text-[var(--text-secondary)]">
                      {task.assignment || task.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                  <button onClick={() => editTask(task)} aria-label={`Edit ${task.title}`} className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"><Pencil size={13} /></button>
                  <button disabled={busy !== null} onClick={() => requestDelete(task)} aria-label={`Delete ${task.title}`} className="p-1 rounded text-red-400/80 hover:text-red-400 disabled:opacity-50"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {modals}
    </>
  );
};

export default DayTasksPopover;
