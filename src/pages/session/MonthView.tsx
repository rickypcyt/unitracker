import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useTasks, useWorkspace } from '@/store/appStore';
import { getDemoTasks } from '@/utils/demoData';
import DayTasksPopover from './DayTasksPopover';
import type { Task } from '@/schemas/task';
import { addDays, addMonths, format, isSameMonth, isToday, isValid, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { enUS, es, hi } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { capitalizeFirst } from '@/utils/dateUtils';

const DATE_LOCALES: Record<string, Locale> = { en: enUS, es, hi };

export const getDayTasks = (tasks: Task[], day: Date) => tasks.filter(task => {
  const value = task.deadline || task.due_date;
  if (!value) return false;
  const due = parseISO(value);
  return isValid(due) && format(due, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
});

const MonthView = () => {
  const { t, i18n } = useTranslation();
  const dateLocale = DATE_LOCALES[i18n.resolvedLanguage ?? i18n.language] ?? enUS;
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    capitalizeFirst(format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), index), 'EEE', { locale: dateLocale }))
  );
  const { isLoggedIn } = useAuth();
  const { tasks } = useTasks();
  const { currentWorkspace } = useWorkspace();
  const source = (isLoggedIn ? tasks : getDemoTasks()).filter(task =>
    currentWorkspace ? currentWorkspace.isAll || currentWorkspace.id === 'all' || task.workspace_id === currentWorkspace.id : !task.workspace_id
  );
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const openDay = (day: Date, button: HTMLButtonElement) => {
    setSelectedDay(day);
    setPopoverPos({
      top: button.offsetTop + button.offsetHeight + 4,
      left: button.offsetLeft + button.offsetWidth / 2,
    });
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
    <section ref={sectionRef} onMouseEnter={cancelClose} onMouseLeave={() => { closeTimer.current = setTimeout(() => setSelectedDay(null), 200); }} aria-labelledby="month-view-title" className="relative w-full aspect-square xl:aspect-auto xl:h-full flex flex-col rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-3">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--accent-primary)]/10"><CalendarDays size={16} className="text-[var(--accent-primary)]" /></div>
          <h3 id="month-view-title" className="text-sm font-semibold text-[var(--text-primary)]">{t('session.monthView.title')}</h3>
        </div>
        <button onClick={() => changeMonth(startOfMonth(new Date()))} className="px-2 py-1 text-xs text-[var(--accent-primary)]">{t('session.monthView.today')}</button>
      </div>
      <div className="flex items-center justify-between mb-1">
        <button onClick={() => changeMonth(addMonths(month, -1))} aria-label="Previous month" className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"><ChevronLeft size={16} /></button>
        <p aria-live="polite" className="text-xs font-semibold text-[var(--text-primary)]">{format(month, 'MMMM yyyy', { locale: dateLocale })}</p>
        <button onClick={() => changeMonth(addMonths(month, 1))} aria-label="Next month" className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"><ChevronRight size={16} /></button>
      </div>
      <div className="grid flex-1 min-h-0 grid-cols-7 grid-rows-[auto_repeat(6,minmax(0,1fr))] gap-0.5 text-center">
        {weekdays.map(day => <span key={day} className="py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">{day}</span>)}
        {days.map(day => {
          const dayTasks = getDayTasks(source, day);
          return (
            <button
              key={day.toISOString()}
              onMouseEnter={event => { cancelClose(); if (dayTasks.length) openDay(day, event.currentTarget); else setSelectedDay(null); }}
              onFocus={event => { if (dayTasks.length) openDay(day, event.currentTarget); }}
              onClick={event => { cancelClose(); openDay(day, event.currentTarget); }}
              aria-label={format(day, 'EEEE, MMMM d, yyyy', { locale: dateLocale })}
              aria-current={isToday(day) ? 'date' : undefined}
              aria-haspopup="dialog"
              aria-expanded={selectedDay?.getTime() === day.getTime()}
              className={`group relative flex items-center justify-center w-full h-full rounded-md text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)] ${isToday(day) ? 'text-[var(--accent-primary)]' : isSameMonth(day, month) ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] opacity-40'}`}
            >
              <time dateTime={format(day, 'yyyy-MM-dd')} className={`relative flex items-center justify-center w-7 h-7 rounded-md leading-none ${isToday(day) ? 'font-bold ring-1 ring-[var(--accent-primary)]' : 'group-hover:ring-1 group-hover:ring-[var(--accent-primary)]'}`}>
                {format(day, 'd')}
                {dayTasks.length > 0 && <span aria-hidden="true" className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" />}
              </time>
            </button>
          );
        })}
      </div>
      <DayTasksPopover top={popoverPos.top} left={popoverPos.left} day={selectedDay} tasks={selectedDay ? getDayTasks(source, selectedDay) : []} onClose={() => setSelectedDay(null)} />
    </section>
  );
};

export default MonthView;
