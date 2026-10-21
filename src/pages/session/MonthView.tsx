import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useTasks, useWorkspace } from '@/store/appStore';
import { demoTasks } from '@/utils/demoData';
import DayTasksPopover from './DayTasksPopover';
import type { Task } from '@/schemas/task';
import { addDays, addMonths, format, isSameMonth, isToday, isValid, parseISO, startOfMonth, startOfWeek } from 'date-fns';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const getDayTasks = (tasks: Task[], day: Date) => tasks.filter(task => {
  const value = task.deadline || task.due_date;
  if (!value) return false;
  const due = parseISO(value);
  return isValid(due) && format(due, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
});

const MonthView = () => {
  const { isLoggedIn } = useAuth();
  const { tasks } = useTasks();
  const { currentWorkspace } = useWorkspace();
  const source = (isLoggedIn ? tasks : demoTasks).filter(task =>
    currentWorkspace ? currentWorkspace.isAll || currentWorkspace.id === 'all' || task.workspace_id === currentWorkspace.id : !task.workspace_id
  );
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [popoverTop, setPopoverTop] = useState(0);
  const openDay = (day: Date, button: HTMLButtonElement) => {
    setSelectedDay(day);
    setPopoverTop(button.offsetTop + button.offsetHeight + 2);
  };
  const sectionRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const cancelClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  const changeMonth = (value: Date) => { setMonth(value); setSelectedDay(null); };

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!sectionRef.current?.contains(event.target as Node)) setSelectedDay(null);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedDay(null); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);
  const firstDay = startOfWeek(month, { weekStartsOn: 1 });
  const days = Array.from({ length: 42 }, (_, index) => addDays(firstDay, index));

  return (
    <section ref={sectionRef} onMouseEnter={cancelClose} onMouseLeave={() => { closeTimer.current = setTimeout(() => setSelectedDay(null), 200); }} aria-labelledby="month-view-title" className="relative w-full h-full rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10"><CalendarDays size={18} className="text-[var(--accent-primary)]" /></div>
          <h3 id="month-view-title" className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">Month View</h3>
        </div>
        <button onClick={() => changeMonth(startOfMonth(new Date()))} className="min-h-11 px-2 text-sm text-[var(--accent-primary)]">Today</button>
      </div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => changeMonth(addMonths(month, -1))} aria-label="Previous month" className="p-3 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"><ChevronLeft size={18} /></button>
        <p aria-live="polite" className="text-sm font-semibold text-[var(--text-primary)]">{format(month, 'MMMM yyyy')}</p>
        <button onClick={() => changeMonth(addMonths(month, 1))} aria-label="Next month" className="p-3 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"><ChevronRight size={18} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map(day => <span key={day} className="py-1 text-xs font-medium text-[var(--text-secondary)]">{day}</span>)}
        {days.map(day => {
          const dayTasks = getDayTasks(source, day);
          return (
            <button
              key={day.toISOString()}
              onMouseEnter={event => { cancelClose(); if (dayTasks.length) openDay(day, event.currentTarget); else setSelectedDay(null); }}
              onFocus={event => { if (dayTasks.length) openDay(day, event.currentTarget); }}
              onClick={event => { cancelClose(); openDay(day, event.currentTarget); }}
              aria-label={format(day, 'EEEE, MMMM d, yyyy')}
              aria-current={isToday(day) ? 'date' : undefined}
              aria-haspopup="dialog"
              aria-expanded={selectedDay?.getTime() === day.getTime()}
              className={`relative flex items-center justify-center h-8 rounded-lg text-sm hover:ring-1 hover:ring-[var(--accent-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)] ${isToday(day) ? 'bg-[var(--accent-primary)] text-white font-semibold' : isSameMonth(day, month) ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] opacity-40'}`}
            >
              <time dateTime={format(day, 'yyyy-MM-dd')}>{format(day, 'd')}</time>
              {dayTasks.length > 0 && <span aria-hidden="true" className={`absolute bottom-0.5 h-1 w-1 rounded-full ${isToday(day) ? 'bg-white' : 'bg-[var(--accent-primary)]'}`} />}
            </button>
          );
        })}
      </div>
      <DayTasksPopover top={popoverTop} day={selectedDay} tasks={selectedDay ? getDayTasks(source, selectedDay) : []} onClose={() => setSelectedDay(null)} />
    </section>
  );
};

export default MonthView;
