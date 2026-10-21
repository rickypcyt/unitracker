import { CheckCircle2, Circle, Pencil, Plus, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { useSessionTaskActions } from '@/hooks/useSessionTaskActions';
import type { Task } from '@/schemas/task';

interface Props {
  day: Date | null;
  tasks: Task[];
  onClose: () => void;
  top?: number;
}

const DayTasksPopover = ({ day, tasks, onClose, top }: Props) => {
  const { busy, editTask: openEditor, toggleTask, requestDelete, modals } = useSessionTaskActions('calendar', onClose);
  const editTask = (task: Task | null) => {
    if (day) openEditor(task, format(day, 'yyyy-MM-dd'));
  };

  return (
    <>
      {day && (
        <div role="dialog" aria-label={`Tasks for ${format(day, 'MMMM d, yyyy')}`} style={{ top: top ?? '100%' }} className="absolute inset-x-0 z-50 max-h-[70dvh] overflow-y-auto rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-4 shadow-2xl text-left">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">{format(day, 'EEEE, MMM d')}</h4>
            <button onClick={onClose} aria-label="Close day tasks" className="p-2 text-[var(--text-secondary)]"><X size={18} /></button>
          </div>
          <div className="max-h-72 overflow-y-auto space-y-3">
            {tasks.length === 0 && <p className="text-sm text-[var(--text-secondary)]">No tasks for this day.</p>}
            {tasks.map(task => (
              <div key={task.id} className="rounded-xl border border-[var(--border-primary)] p-3">
                <div className="flex items-start gap-2">
                  <button disabled={busy !== null} onClick={() => void toggleTask(task)} aria-label={`${task.completed ? 'Reopen' : 'Complete'} ${task.title}`} className="p-2 shrink-0 text-[var(--accent-primary)] disabled:opacity-50">
                    {task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <button onClick={() => editTask(task)} className={`text-sm font-medium text-left break-words text-[var(--text-primary)] ${task.completed ? 'line-through opacity-60' : ''}`}>{task.title}</button>
                    {task.assignment && <p className="text-xs text-[var(--text-secondary)] mt-1 break-words">{task.assignment}</p>}
                    {task.description && <p className="text-xs text-[var(--text-secondary)] mt-1 whitespace-pre-wrap break-words">{task.description}</p>}
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{task.status || (task.completed ? 'completed' : 'todo')}{task.difficulty ? ` · ${task.difficulty}` : ''}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-1">
                  <button onClick={() => editTask(task)} aria-label={`Edit ${task.title}`} className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"><Pencil size={16} /></button>
                  <button disabled={busy !== null} onClick={() => requestDelete(task)} aria-label={`Delete ${task.title}`} className="p-2 text-red-400 disabled:opacity-50"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => editTask(null)} className="mt-3 min-h-11 w-full rounded-xl flex items-center justify-center gap-2 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-sm font-medium"><Plus size={16} />Add task for this day</button>
        </div>
      )}
      {modals}
    </>
  );
};

export default DayTasksPopover;
