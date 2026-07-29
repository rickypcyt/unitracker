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
}

const DayView = ({
  selectedDate,
  isLoggedIn,
  getTasksForDayAndHour,
  setSelectedDate,
  setShowTaskForm,
  setIsLoginPromptOpen,
}: DayViewProps) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const now = new Date();
  const currentHour = now.getHours();
  const isCurrentDay = isSameDay(selectedDate, new Date());
  const currentMinutesFromStart = minutesFromStartOfDay(now);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollHour = isCurrentDay ? currentHour : 8;
      const scrollPosition = Math.max(0, (scrollHour - 2) * 60);
      scrollRef.current.scrollTop = scrollPosition;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalTasksForDay = hours.reduce(
    (sum, hour) => sum + getTasksForDayAndHour(selectedDate, hour).length,
    0
  );

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)] border border-[var(--border-primary)]/40 rounded-xl relative min-h-0 h-full overflow-hidden">
      {/* Time grid */}
      <div className="flex-1 overflow-auto" ref={scrollRef}>
        <div className="relative px-2 pb-4">
          {hours.map((hour) => {
            const isCurrentHour = isCurrentDay && hour === currentHour;

            const tasksStartingThisHour = getTasksForDayAndHour(
              selectedDate,
              hour
            )
              .map((task) => {
                const { start, end } = resolveTaskTiming(task, selectedDate);
                return { task, start, end };
              })
              .filter(
                ({ start }) =>
                  start.getHours() === hour && !Number.isNaN(start.getTime())
              )
              .sort((a, b) => a.start.getTime() - b.start.getTime());

            return (
              <div
                key={hour}
                className="grid grid-cols-[56px_1fr] sm:grid-cols-[64px_1fr] gap-0 relative border-t border-[var(--border-primary)]/25"
              >
                {/* Hour label */}
                <div className="text-[11px] sm:text-xs text-[var(--text-secondary)] pt-1.5 pr-2 text-right font-medium tabular-nums">
                  {format12Hour(hour)}
                </div>

                {/* Slot */}
                <div
                  className="cursor-pointer min-h-[60px] transition-colors relative overflow-visible rounded-md hover:bg-[var(--bg-secondary)]/40"
                  onDoubleClick={(e) => {
                    if (
                      (e.target as HTMLElement).closest("[data-calendar-task]")
                    )
                      return;
                    const newDate = new Date(selectedDate);
                    newDate.setHours(hour, 0, 0, 0);
                    setSelectedDate(newDate);
                    if (!isLoggedIn) return setIsLoginPromptOpen(true);
                    setShowTaskForm(true);
                  }}
                  onClick={(e) => {
                    if (
                      (e.target as HTMLElement).closest("[data-calendar-task]")
                    )
                      return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const minutes = clamp(
                      Math.round((y / rect.height) * MINUTES_PER_HOUR),
                      0,
                      MINUTES_PER_HOUR - 1
                    );
                    const newDate = new Date(selectedDate);
                    newDate.setHours(hour, minutes, 0, 0);
                    setSelectedDate(newDate);
                    if (!isLoggedIn) return setIsLoginPromptOpen(true);
                    setShowTaskForm(true);
                  }}
                  title={`Click to set time at ${format12Hour(hour)}`}
                >
                  {/* Current time indicator */}
                  {isCurrentHour && (
                    <div
                      className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                      style={{
                        top: `${
                          clamp(
                            currentMinutesFromStart - hour * MINUTES_PER_HOUR,
                            0,
                            MINUTES_PER_HOUR
                          ) * PIXELS_PER_MINUTE
                        }px`,
                        width: "calc(100% + 6px)",
                        left: "-3px",
                      }}
                    >
                      <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] shrink-0" />
                      <div className="flex-1 h-[2px] bg-[var(--accent-primary)] rounded-full" />
                    </div>
                  )}

                  {/* Half-hour divider */}
                  <div
                    className="absolute left-1 right-1 border-t border-dashed border-[var(--border-primary)]/20 pointer-events-none"
                    style={{ top: "30px", zIndex: 1 }}
                  />

                  {/* Tasks */}
                  {tasksStartingThisHour.map(
                    ({ task, start, end }, taskIndex) => {
                      const minutesFromDayStart = minutesFromStartOfDay(start);
                      const minutesIntoHour = clamp(
                        minutesFromDayStart - hour * MINUTES_PER_HOUR,
                        0,
                        MINUTES_PER_HOUR
                      );
                      const topOffset = minutesIntoHour * PIXELS_PER_MINUTE;
                      const durationMinutesRaw = Math.round(
                        (end.getTime() - start.getTime()) / (1000 * 60)
                      );
                      const durationMinutes = Math.max(30, durationMinutesRaw);
                      const blockHeight = Math.max(
                        28,
                        durationMinutes * PIXELS_PER_MINUTE
                      );
                      const leftOffset = Math.min(taskIndex * 12, 48);

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
                          className="absolute z-10 rounded-md border-l-[3px] border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--text-primary)] text-xs sm:text-[13px] px-2 py-1.5 transition-colors hover:bg-[var(--accent-primary)]/15"
                          style={{
                            left: `${4 + leftOffset}px`,
                            right: "4px",
                            top: `${topOffset}px`,
                            height: `${blockHeight}px`,
                          }}
                          onClick={(event) => {
                            event.stopPropagation();
                            const startDate = new Date(start);
                            setSelectedDate(startDate);
                            if (!isLoggedIn) {
                              setIsLoginPromptOpen(true);
                              return;
                            }
                            setShowTaskForm(true);
                          }}
                          title={`${task.title ?? "Task"} ${timeLabel}`}
                        >
                          {task.assignment && (
                            <div className="text-[10px] text-[var(--accent-primary)] truncate font-medium mb-0.5">
                              {task.assignment}
                            </div>
                          )}
                          <div className="font-medium truncate leading-snug">
                            {task.title || "Sin título"}
                          </div>
                          <div className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5">
                            {timeLabel}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {totalTasksForDay === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center pointer-events-none">
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                No tasks scheduled
              </p>
              <p className="text-xs text-[var(--text-secondary)]/70 mt-1">
                Click any time slot to add one
              </p>
            </div>
          )}
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