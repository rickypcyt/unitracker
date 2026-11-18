import { CheckCircle2, Circle, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { useSessionTaskActions } from '@/hooks/session/useSessionTaskActions';
import type { Task } from '@/schemas/task';

const POPOVER_WIDTH = 260;
/** Minimum distance kept between the popover and the viewport edges. */
const VIEWPORT_MARGIN = 8;
/** Gap between the anchor day and the popover. */
const ANCHOR_GAP = 8;

interface Props {
  day: Date | null;
  tasks: Task[];
  onClose: () => void;
  /** The day cell the popover points at; its viewport rect drives placement. */
  anchor?: HTMLElement | null;
}

type Placement = { top: number; left: number; width: number; maxHeight?: number };

/**
 * Centre the popover under the anchor, then keep it fully on screen: clamp it
 * horizontally to the viewport and flip it above the anchor when there is not
 * enough room below (and more room above).
 */
export const computePlacement = (
  anchor: { top: number; bottom: number; left: number; width: number },
  popoverHeight: number,
  viewport: { width: number; height: number },
): Placement => {
  const width = Math.min(POPOVER_WIDTH, viewport.width - VIEWPORT_MARGIN * 2);
  const centre = anchor.left + anchor.width / 2;
  const left = Math.min(
    Math.max(centre - width / 2, VIEWPORT_MARGIN),
    viewport.width - width - VIEWPORT_MARGIN,
  );

  const spaceBelow = viewport.height - anchor.bottom - ANCHOR_GAP - VIEWPORT_MARGIN;
  const spaceAbove = anchor.top - ANCHOR_GAP - VIEWPORT_MARGIN;
  const openAbove = popoverHeight > spaceBelow && spaceAbove > spaceBelow;
  const available = Math.max(0, openAbove ? spaceAbove : spaceBelow);
  const height = Math.min(popoverHeight, available);
  const top = openAbove ? anchor.top - ANCHOR_GAP - height : anchor.bottom + ANCHOR_GAP;

  return { top, left, width, ...(popoverHeight > available ? { maxHeight: available } : {}) };
};

const DayTasksPopover = ({ day, tasks, onClose, anchor }: Props) => {
  const { busy, editTask: openEditor, toggleTask, requestDelete, modals } = useSessionTaskActions('calendar', onClose);
  const editTask = (task: Task | null) => {
    if (day) openEditor(task, format(day, 'yyyy-MM-dd'));
  };

  const popoverRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);

  const reposition = useCallback(() => {
    const el = popoverRef.current;
    if (!el || !anchor) return;
    // Measure the natural height (ignoring a previous maxHeight clamp).
    const previousMax = el.style.maxHeight;
    el.style.maxHeight = '';
    const height = el.offsetHeight;
    el.style.maxHeight = previousMax;
    setPlacement(computePlacement(
      anchor.getBoundingClientRect(),
      height,
      { width: window.innerWidth, height: window.innerHeight },
    ));
  }, [anchor]);

  // Position before paint so the popover never flashes off-screen, and follow
  // the anchor on scroll/resize or when the task list changes size.
  useLayoutEffect(() => {
    if (!day) return;
    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [day, tasks.length, reposition]);

  if (!day) return null;

  return createPortal(
    <>
      <div
        ref={popoverRef}
        role="dialog"
        aria-label={`Tasks for ${format(day, 'MMMM d, yyyy')}`}
        style={{
          top: placement?.top ?? 0,
          left: placement?.left ?? 0,
          width: placement?.width ?? POPOVER_WIDTH,
          maxHeight: placement?.maxHeight,
          // Hidden until measured so it never shows up in the wrong place.
          visibility: anchor && !placement ? 'hidden' : 'visible',
        }}
        className="fixed z-[100000] max-h-72 overflow-y-auto rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-2xl text-left"
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
            <div key={task.id} className="group relative flex items-center gap-1 rounded-md px-1 py-1 hover:bg-[var(--bg-secondary)]">
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
              <div className="flex items-center shrink-0 sm:absolute sm:right-1 sm:top-1/2 sm:-translate-y-1/2 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                <button onClick={() => editTask(task)} aria-label={`Edit ${task.title}`} className="p-2 rounded text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"><Pencil size={16} /></button>
                <button disabled={busy !== null} onClick={() => requestDelete(task)} aria-label={`Delete ${task.title}`} className="p-2 rounded text-red-400/80 hover:text-red-400 disabled:opacity-50"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {modals}
    </>,
    document.body
  );
};

export default DayTasksPopover;
