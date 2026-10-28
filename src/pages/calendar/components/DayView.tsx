import { useEffect, useRef } from "react";
import { isSameDay } from "date-fns";

const PIXELS_PER_MINUTE = 1;
const MINUTES_PER_HOUR = 60;
const DEFAULT_EVENT_DURATION_MINUTES = 60;

const normalizeToStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

const minutesFromStartOfDay = (date: Date) =>
  date.getHours() * MINUTES_PER_HOUR + date.getMinutes();

const normalizeTimestamp = (value: string) => {
  let normalized = value;
  if (normalized.includes(" ")) {
    normalized = normalized.replace(" ", "T");
  }
  if (/([+-]\d{2})$/.test(normalized)) {
    normalized = `${normalized}:00`;
  }
  return normalized;
};

const parseDateTime = (
  value: string | Date | null | undefined,
  referenceDate: Date
): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return new Date(value.getTime());

  let normalized = value.trim();
  if (!normalized) return null;

  normalized = normalizeTimestamp(normalized);
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const timeMatch = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeMatch) {
    const [, hours, minutes, seconds] = timeMatch;
    const base = normalizeToStartOfDay(referenceDate);
    base.setHours(
      Number(hours ?? 0),
      Number(minutes ?? 0),
      Number(seconds ?? 0),
      0
    );
    return base;
  }

  return null;
};

const resolveTaskTiming = (task: any, referenceDate: Date) => {
  const fallbackStart = normalizeToStartOfDay(referenceDate);
  fallbackStart.setHours(9, 0, 0, 0);

  const start =
    parseDateTime(task?.occurrenceStart, referenceDate) ??
    parseDateTime(task?.start_at, referenceDate) ??
    parseDateTime(task?.deadline ?? task?.due_date, referenceDate) ??
    fallbackStart;

  let end =
    parseDateTime(task?.occurrenceEnd, referenceDate) ??
    parseDateTime(task?.end_at, referenceDate);

  if (!end || Number.isNaN(end.getTime()) || end <= start) {
    end = new Date(
      start.getTime() + DEFAULT_EVENT_DURATION_MINUTES * MINUTES_PER_HOUR * 1000
    );
  }

  return { start, end };
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

interface DayViewProps {
  selectedDate: Date;
  isLoggedIn: boolean;
  getTasksForDayAndHour: (day: Date, hour: number) => any[];
  setSelectedDate: (date: Date) => void;
  setShowTaskForm: (show: boolean) => void;
  setIsLoginPromptOpen: (open: boolean) => void;
  onDayContextMenu: (e: React.MouseEvent, date: Date, hour?: number) => void;
}

const DayView = ({
  selectedDate,
  isLoggedIn,
  getTasksForDayAndHour,
  setSelectedDate,
  setShowTaskForm,
  setIsLoginPromptOpen,
  onDayContextMenu,
}: DayViewProps) => {
  const VISIBLE_START_HOUR = 6;
  const VISIBLE_END_HOUR = 24;
  const hours = Array.from(
    { length: VISIBLE_END_HOUR - VISIBLE_START_HOUR },
    (_, i) => i + VISIBLE_START_HOUR
  );
  const now = new Date();
  const currentHour = now.getHours();
  const isCurrentDay = isSameDay(selectedDate, new Date());
  const currentMinutesFromStart = minutesFromStartOfDay(now);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollHour = isCurrentDay ? currentHour : 8;
      const scrollPosition = Math.max(
        0,
        (scrollHour - VISIBLE_START_HOUR - 2) * 60
      );
      scrollRef.current.scrollTop = scrollPosition;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolve all tasks for the day, dedupe, sort, and lay out overlapping
  // events into columns (Google Calendar style)
  const seen = new Set<string>();
  const dayTasks = hours
    .flatMap((hour) => getTasksForDayAndHour(selectedDate, hour))
    .map((task) => ({ task, ...resolveTaskTiming(task, selectedDate) }))
    .filter(
      ({ task, start }) =>
        !Number.isNaN(start.getTime()) &&
        !seen.has(String(task.id)) &&
        seen.add(String(task.id))
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const laidOut: Array<{
    task: any;
    start: Date;
    end: Date;
    col: number;
    cols: number;
  }> = [];
  let group: typeof dayTasks = [];
  let groupEnd = -Infinity;
  const flushGroup = () => {
    const colEnds: number[] = [];
    const assignments = new Map<any, number>();
    group.forEach((item) => {
      let col = colEnds.findIndex((t) => t <= item.start.getTime());
      if (col === -1) {
        col = colEnds.length;
        colEnds.push(0);
      }
      colEnds[col] = item.end.getTime();
      assignments.set(item, col);
    });
    const cols = Math.max(colEnds.length, 1);
    group.forEach((item) =>
      laidOut.push({ ...item, col: assignments.get(item) ?? 0, cols })
    );
    group = [];
  };
  dayTasks.forEach((item) => {
    if (group.length > 0 && item.start.getTime() >= groupEnd) flushGroup();
    group.push(item);
    groupEnd = Math.max(groupEnd, item.end.getTime());
  });
  flushGroup();

  const openTaskFormAt = (minutesFromVisibleStart: number) => {
    const totalMinutes =
      VISIBLE_START_HOUR * MINUTES_PER_HOUR +
      clamp(minutesFromVisibleStart, 0, (VISIBLE_END_HOUR - VISIBLE_START_HOUR) * MINUTES_PER_HOUR - 1);
    const newDate = new Date(selectedDate);
    newDate.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
    setSelectedDate(newDate);
    if (!isLoggedIn) return setIsLoginPromptOpen(true);
    setShowTaskForm(true);
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-xl relative min-h-0 h-full overflow-hidden">
      {/* Time grid */}
      <div className="flex-1 overflow-auto" ref={scrollRef}>
        <div className="relative px-1.5 sm:px-2 pb-4">
          {/* Hour rows: labels + grid lines */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-[44px_1fr] sm:grid-cols-[64px_1fr] gap-0 relative"
            >
              <div className="text-[10px] sm:text-xs text-[var(--text-secondary)] -mt-2 pr-1.5 sm:pr-2 text-right font-medium tabular-nums bg-[var(--bg-primary)] w-fit ml-auto px-1 relative z-10">
                {format12Hour(hour)}
              </div>
              <div className="h-[60px] border-t border-[var(--border-primary)]/40" />
            </div>
          ))}

          {/* Events layer over the slot column */}
          <div className="absolute top-0 bottom-4 left-[44px] sm:left-[64px] right-1.5 sm:right-2">
            {/* Click target */}
            <div
              className="absolute inset-0 cursor-pointer"
              onContextMenu={(e) => {
                if ((e.target as HTMLElement).closest("[data-calendar-task]"))
                  return;
                const rect = e.currentTarget.getBoundingClientRect();
                const hour =
                  VISIBLE_START_HOUR +
                  Math.floor((e.clientY - rect.top) / 60);
                onDayContextMenu(
                  e,
                  selectedDate,
                  clamp(hour, VISIBLE_START_HOUR, VISIBLE_END_HOUR - 1)
                );
              }}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("[data-calendar-task]"))
                  return;
                const rect = e.currentTarget.getBoundingClientRect();
                openTaskFormAt(e.clientY - rect.top);
              }}
            />

            {/* Current time line */}
            {isCurrentDay &&
              currentMinutesFromStart >=
                VISIBLE_START_HOUR * MINUTES_PER_HOUR && (
                <div
                  className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                  style={{
                    top: `${clamp(
                      currentMinutesFromStart -
                        VISIBLE_START_HOUR * MINUTES_PER_HOUR,
                      0,
                      (VISIBLE_END_HOUR - VISIBLE_START_HOUR) *
                        MINUTES_PER_HOUR
                    )}px`,
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] shrink-0 -ml-1" />
                  <div className="flex-1 h-[2px] bg-[var(--accent-primary)] rounded-full" />
                </div>
              )}

            {/* Task blocks */}
            {laidOut.map(({ task, start, end, col, cols }) => {
              const startMinutes = minutesFromStartOfDay(start);
              const topOffset = clamp(
                startMinutes - VISIBLE_START_HOUR * MINUTES_PER_HOUR,
                0,
                (VISIBLE_END_HOUR - VISIBLE_START_HOUR) * MINUTES_PER_HOUR
              );
              const durationMinutes = Math.max(
                20,
                Math.round((end.getTime() - start.getTime()) / (1000 * 60))
              );
              const blockHeight = Math.max(24, durationMinutes * PIXELS_PER_MINUTE);

              const timeLabel = `${start.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })} – ${end.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`;

              return (
                <div
                  key={task.id}
                  data-calendar-task
                  className="absolute z-10 rounded-md border-l-[3px] border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--text-primary)] text-[11px] sm:text-[13px] px-1.5 sm:px-2 py-1 sm:py-1.5 transition-colors hover:bg-[var(--accent-primary)]/15 overflow-hidden"
                  style={{
                    left: `calc(${(col / cols) * 100}% + 2px)`,
                    width: `calc(${100 / cols}% - 4px)`,
                    top: `${topOffset}px`,
                    height: `${blockHeight}px`,
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedDate(new Date(start));
                    if (!isLoggedIn) return setIsLoginPromptOpen(true);
                    setShowTaskForm(true);
                  }}
                  title={`${task.title ?? "Task"} ${timeLabel}`}
                >
                  {task.assignment && (
                    <div className="text-[10px] sm:text-xs text-[var(--accent-primary)] truncate font-medium">
                      {task.assignment}
                    </div>
                  )}
                  <div className="font-medium truncate leading-snug">
                    {task.title || "Sin título"}
                  </div>
                  {blockHeight >= 40 && (
                    <div className="text-[10px] sm:text-xs text-[var(--text-secondary)] truncate">
                      {timeLabel}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const format12Hour = (hour: number) => {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour} ${period}`;
};

export default DayView;