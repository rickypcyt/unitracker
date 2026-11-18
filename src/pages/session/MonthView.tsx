import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useTasks, useWorkspace } from '@/store/appStore';
import { getDemoTasks } from '@/utils/demoData';
import DayTasksPopover from './DayTasksPopover';
import type { Task } from '@/schemas/task';
import { addDays, addMonths, format, isBefore, isSameDay, isSameMonth, isToday, isValid, parseISO, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
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

const MonthView = ({ fillHeight = false }: { fillHeight?: boolean }) => {
  const { t, i18n } = useTranslation();
  const dateLocale = DATE_LOCALES[i18n.resolvedLanguage ?? i18n.language] ?? enUS;
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    capitalizeFirst(format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), index), 'EEEEE', { locale: dateLocale }))
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
    const rect = button.getBoundingClientRect();
    setPopoverPos({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
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

  // Month summary (compact legend) + per-task dot colour
  const todayStart = startOfDay(new Date());
  const monthTasks = source.filter(task => {
    const value = task.deadline || task.due_date;
    const due = value ? parseISO(value) : null;
    return due && isValid(due) && isSameMonth(due, month);
  });
  const doneCount = monthTasks.filter(task => task.completed).length;
  const overdueCount = monthTasks.filter(task => {
    const due = parseISO((task.deadline || task.due_date) as string);
    return !task.completed && isBefore(startOfDay(due), todayStart);
  }).length;
  const pendingCount = monthTasks.length - doneCount - overdueCount;

  const dotColor = (task: Task, day: Date) =>
    task.completed ? '#30d158' : isBefore(startOfDay(day), todayStart) ? '#ff453a' : 'var(--accent-primary)';

  const navBtn = 'flex h-7 w-7 items-center justify-center rounded-full text-[var(--accent-primary)]';

  return (
    <section ref={sectionRef} onMouseEnter={cancelClose} onMouseLeave={() => { closeTimer.current = setTimeout(() => setSelectedDay(null), 200); }} aria-labelledby="month-view-title" className={`relative w-full aspect-square xl:aspect-auto xl:h-full ${fillHeight ? '' : 'xl:max-h-[400px]'} flex flex-col rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 pb-2.5 pt-3`}>
      <h3 id="month-view-title" className="sr-only">{t('session.monthView.title')}</h3>

      {/* Header: big month name left, Apple-style < Today > right */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
            <CalendarDays size={16} aria-hidden="true" />
          </span>
          <p aria-live="polite" className="truncate text-lg font-bold leading-none tracking-tight text-[var(--text-primary)]">
            {capitalizeFirst(format(month, 'MMMM yyyy', { locale: dateLocale }))}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={() => changeMonth(addMonths(month, -1))} aria-label="Previous month" className={navBtn}><ChevronLeft size={18} /></button>
          <button
            onClick={() => changeMonth(startOfMonth(new Date()))}
            className="rounded-full px-2 py-1 text-xs font-semibold leading-none text-[var(--accent-primary)]"
          >
            {t('session.monthView.today')}
          </button>
          <button onClick={() => changeMonth(addMonths(month, 1))} aria-label="Next month" className={navBtn}><ChevronRight size={18} /></button>
        </div>
      </div>

      {/* Weekday row */}
      <div className="grid grid-cols-7 border-b border-[var(--border-primary)] pb-1 text-center">
        {weekdays.map((day, index) => (
          <span key={index} className={`text-[11px] font-semibold uppercase text-[var(--text-secondary)] ${index >= 5 ? 'opacity-60' : ''}`}>{day}</span>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 pt-1 text-center">
        {days.map(day => {
          const dayTasks = getDayTasks(source, day);
          const today = isToday(day);
          const selected = selectedDay ? isSameDay(selectedDay, day) : false;
          const inMonth = isSameMonth(day, month);
          const weekend = day.getDay() === 0 || day.getDay() === 6;
          const sorted = [...dayTasks].sort((a, b) => Number(!!a.completed) - Number(!!b.completed));
          return (
            <button
              key={day.toISOString()}
              onMouseEnter={event => { cancelClose(); if (dayTasks.length) openDay(day, event.currentTarget); else setSelectedDay(null); }}
              onFocus={event => { if (dayTasks.length) openDay(day, event.currentTarget); }}
              onClick={event => { cancelClose(); openDay(day, event.currentTarget); }}
              aria-label={format(day, 'EEEE, MMMM d, yyyy', { locale: dateLocale })}
              aria-current={today ? 'date' : undefined}
              aria-haspopup="dialog"
              aria-expanded={selected}
              className="flex min-h-0 w-full flex-col items-center justify-center gap-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)]"
            >
              <time
                dateTime={format(day, 'yyyy-MM-dd')}
                className={`flex h-[26px] w-[26px] items-center justify-center rounded-full text-[13px] leading-none tabular-nums ${
                  today
                    ? 'font-bold text-[var(--accent-primary)]'
                    : selected
                      ? 'font-semibold text-[var(--text-primary)] underline decoration-[var(--text-secondary)] decoration-2 underline-offset-4'
                      : inMonth
                        ? weekend ? 'font-medium text-[var(--text-secondary)]' : 'font-medium text-[var(--text-primary)]'
                        : 'font-medium text-[var(--text-secondary)] opacity-35'
                }`}
              >
                {format(day, 'd')}
              </time>
              {/* Task dots (max 3): red overdue, accent pending, green done */}
              <span aria-hidden="true" className={`flex h-1 items-center gap-0.5 ${inMonth ? '' : 'opacity-35'}`}>
                {sorted.slice(0, 3).map(task => (
                  <span key={task.id} className="h-1 w-1 rounded-full" style={{ backgroundColor: dotColor(task, day) }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {/* Month summary legend */}
      <div className="mt-1.5 flex items-center justify-center gap-3 border-t border-[var(--border-primary)] pt-2 text-[11px] font-medium tabular-nums text-[var(--text-secondary)]">
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" />{pendingCount} {t('session.monthView.pending', { defaultValue: 'pending' })}</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#ff453a]" />{overdueCount} {t('session.monthView.overdue', { defaultValue: 'overdue' })}</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#30d158]" />{doneCount} {t('session.monthView.done', { defaultValue: 'done' })}</span>
      </div>

      <DayTasksPopover top={popoverPos.top} left={popoverPos.left} day={selectedDay} tasks={selectedDay ? getDayTasks(source, selectedDay) : []} onClose={() => setSelectedDay(null)} />
    </section>
  );
};

export default MonthView;
