import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { getOccurrenceForDate, isRecurringTask } from "@/utils/recurrenceUtils";
import { useEffect, useRef, useState } from "react";
import { getLocalDateString } from "@/utils/dateUtils";
import { handleAddTask } from "../utils/calendarUtils";
import { isSameDay } from "date-fns";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useAppStore } from "@/store/appStore";

interface WeekViewProps {
  currentDate: Date;
  isLoggedIn: boolean;
  getTasksWithDeadline: (day?: Date) => any[];
  setSelectedDate: (date: Date) => void;
  setFocusedDate: (date: Date) => void;
  setShowTaskForm: (show: boolean) => void;
  setIsLoginPromptOpen: (open: boolean) => void;
  setSelectedTask: (task: any) => void;
  setViewingTask: (task: any) => void;
  handleEditTask: (task: any) => void;
  onTaskContextMenu: (e: React.MouseEvent, task: any) => void;
}

const WeekView = ({
  currentDate,
  isLoggedIn,
  getTasksWithDeadline,
  setSelectedDate,
  setFocusedDate,
  setShowTaskForm,
  setIsLoginPromptOpen,
  setSelectedTask,
  setViewingTask,
  handleEditTask,
  onTaskContextMenu,
}: WeekViewProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [draggedTaskData, setDraggedTaskData] = useState<any>(null);
  const [hoveredSlot, setHoveredSlot] = useState<{
    key: string;
    minute: number;
  } | null>(null);
  const updateTaskSuccess = useAppStore((state) => state.updateTaskSuccess);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const currentHour = new Date().getHours();
      const scrollPosition = Math.max(0, (currentHour - 2) * 60);
      scrollRef.current.scrollTop = scrollPosition;
    }
  }, []);

  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const PIXELS_PER_MINUTE = 1;
  const MINUTES_PER_HOUR = 60;
  const VISIBLE_START_HOUR = 0;
  const VISIBLE_END_HOUR = 24;
  const VISIBLE_START_MINUTES = VISIBLE_START_HOUR * MINUTES_PER_HOUR;

  const hours = Array.from(
    { length: VISIBLE_END_HOUR - VISIBLE_START_HOUR },
    (_, i) => VISIBLE_START_HOUR + i
  );

  const getMinutesFromStartOfDay = (date: Date): number => {
    const normalizedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes()
    );
    return (
      normalizedDate.getHours() * MINUTES_PER_HOUR + normalizedDate.getMinutes()
    );
  };

  const normalizeToStartOfDay = (date: Date): Date => {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      0
    );
  };

  const getTopPosition = (minutesFromMidnight: number): number => {
    const minutesFromVisibleStart = minutesFromMidnight - VISIBLE_START_MINUTES;
    return minutesFromVisibleStart * PIXELS_PER_MINUTE;
  };

  const getHeight = (durationInMinutes: number): number => {
    return durationInMinutes * PIXELS_PER_MINUTE;
  };

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutesFromStart = getMinutesFromStartOfDay(now);

  const resolveDropSlot = (event: DragEndEvent | DragOverEvent) => {
    const { over, active, delta } = event as DragEndEvent;
    if (!over) return null;

    const dropZoneId = over.id as string;
    const [dayIndexStr, hourStr] = dropZoneId.split("-");
    const dayIndex = Number(dayIndexStr);
    const hour = Number(hourStr);
    if (Number.isNaN(dayIndex) || Number.isNaN(hour)) return null;

    let minute = 0;
    const overRect = over?.rect;
    const activeRect = active?.rect?.current;
    const initialRect = activeRect?.initial ?? null;

    if (overRect && activeRect && initialRect) {
      const translated = activeRect.translated ?? {
        top: initialRect.top + (delta?.y ?? 0),
        bottom: initialRect.bottom + (delta?.y ?? 0),
        height: initialRect.height,
      };
      const activeHeight =
        translated.height ?? initialRect.height ?? overRect.height;
      const activeCenter = translated.top + (activeHeight ?? 0) / 2;
      const relativeY = activeCenter - overRect.top;
      if (relativeY >= overRect.height / 2) minute = 30;
    }

    return { dayIndex, hour, minute, key: dropZoneId };
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id as string;
    for (const day of weekDays) {
      const tasksForDay = getTasksWithDeadline(day);
      const task = tasksForDay.find((t) => t.id.toString() === taskId);
      if (task) {
        setActiveTask(task);
        setDraggedTaskData(task);
        break;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event;
    if (!over || !draggedTaskData) {
      setActiveTask(null);
      setDraggedTaskData(null);
      return;
    }

    const slot = resolveDropSlot(event);
    if (!slot) {
      setHoveredSlot(null);
      return;
    }

    const { dayIndex, hour, minute } = slot;
    if (dayIndex >= 0 && dayIndex < weekDays.length) {
      const targetDay = weekDays[dayIndex];
      if (targetDay) {
        const newStartTime = new Date(targetDay);
        newStartTime.setHours(hour, minute, 0, 0);

        let duration = 1;
        if (draggedTaskData.start_at && draggedTaskData.end_at) {
          const startT = draggedTaskData.start_at.split(":").map(Number);
          const endT = draggedTaskData.end_at.split(":").map(Number);
          if (startT.length >= 2 && endT.length >= 2) {
            duration = endT[0] - startT[0] + (endT[1] - startT[1]) / 60;
          }
        }

        const newEndTime = new Date(newStartTime);
        newEndTime.setHours(newStartTime.getHours() + duration);

        const formatTime = (date: Date) =>
          `${date.getHours().toString().padStart(2, "0")}:${date
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;

        const formatDate = (date: Date) => getLocalDateString(date);

        const updatedTask = {
          ...draggedTaskData,
          start_at: formatTime(newStartTime),
          end_at: formatTime(newEndTime),
          deadline: formatDate(targetDay),
        };

        updateTaskSuccess(updatedTask);
        setActiveTask(null);
        setDraggedTaskData(null);
        setHoveredSlot(null);
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const slot = resolveDropSlot(event);
    setHoveredSlot(slot ?? null);
  };

  // Shared task block styles
  const taskBlockClass =
    "text-[var(--text-primary)] text-xs sm:text-[13px] px-2 py-1.5 rounded-md truncate pointer-events-auto cursor-pointer transition-all border-l-[3px] border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 absolute z-10 hover:bg-[var(--accent-primary)]/15 hover:cursor-grab active:cursor-grabbing";

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="flex flex-col bg-[var(--bg-primary)] rounded-xl relative overflow-hidden h-full border-2 border-[var(--border-primary)]">
        {/* Sticky header */}
        <div className="sticky top-0 z-20 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--border-primary)] px-2 pt-3 pb-2 flex-shrink-0">
          <div className="grid grid-cols-8 gap-1">
            <div className="text-[11px] text-[var(--text-secondary)] font-medium p-1.5" />
            {weekDays.map((day, i) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={i}
                  className={`text-center py-1.5 px-1 rounded-lg transition-colors ${
                    isToday ? "bg-[var(--accent-primary)]/8" : ""
                  }`}
                >
                  <div
                    className={`text-[11px] sm:text-xs font-medium tracking-wide uppercase ${
                      isToday
                        ? "text-[var(--accent-primary)]"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {day.toLocaleDateString("en", { weekday: "short" })}
                  </div>
                  <div
                    className={`text-sm sm:text-base flex items-center justify-center mx-auto mt-1 font-semibold ${
                      isToday
                        ? "w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--accent-primary)] text-white"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time grid */}
        <div className="flex-1 overflow-auto px-2 pb-3" ref={scrollRef}>
          <div className="relative">
            {/* Spanning tasks (>1h) */}
            {(() => {
              const allSpanningTasks: Array<{
                task: any;
                day: Date;
                dayIndex: number;
                startHour: number;
                endHour: number;
                duration: number;
                occurrenceStart: Date;
                occurrenceEnd: Date;
              }> = [];

              weekDays.forEach((day, dayIndex) => {
                const tasksForDay = getTasksWithDeadline(day);
                tasksForDay.forEach((task) => {
                  if (task.completed) return;
                  let occurrenceStart: Date | undefined;
                  let occurrenceEnd: Date | undefined;

                  if (isRecurringTask(task)) {
                    const occ = getOccurrenceForDate(task, day);
                    if (occ) {
                      occurrenceStart = new Date(occ.occurrenceStart);
                      occurrenceEnd = new Date(occ.occurrenceEnd);
                    }
                  } else if (task.start_at && task.end_at) {
                    const startT = task.start_at.split(":").map(Number);
                    const endT = task.end_at.split(":").map(Number);
                    if (startT.length >= 2 && endT.length >= 2) {
                      occurrenceStart = new Date(day);
                      occurrenceStart.setHours(startT[0], startT[1], 0, 0);
                      occurrenceEnd = new Date(day);
                      occurrenceEnd.setHours(endT[0], endT[1], 0, 0);
                    }
                  }

                  if (occurrenceStart && occurrenceEnd) {
                    const startHour = occurrenceStart.getHours();
                    const endHour = occurrenceEnd.getHours();
                    const duration =
                      (occurrenceEnd.getTime() - occurrenceStart.getTime()) /
                      (60 * 60 * 1000);
                    if (duration > 1) {
                      allSpanningTasks.push({
                        task,
                        day,
                        dayIndex,
                        startHour,
                        endHour,
                        duration,
                        occurrenceStart,
                        occurrenceEnd,
                      });
                    }
                  }
                });
              });

              return allSpanningTasks.map(
                ({ task, dayIndex, occurrenceStart, occurrenceEnd }) => {
                  const startMinutesFromStart =
                    getMinutesFromStartOfDay(occurrenceStart);
                  const durationInMinutes =
                    (occurrenceEnd.getTime() - occurrenceStart.getTime()) /
                    (1000 * 60);
                  const topPosition = getTopPosition(startMinutesFromStart);
                  const blockHeight = getHeight(durationInMinutes);

                  return (
                    <div
                      key={`spanning-task-${task.id}-${dayIndex}`}
                      data-calendar-task
                      draggable
                      id={task.id.toString()}
                      className={taskBlockClass}
                      style={{
                        left: `${(dayIndex + 1) * 12.5 + 0.5}%`,
                        top: `${topPosition + 9}px`,
                        width: `11.5%`,
                        height: `${blockHeight}px`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingTask(task);
                      }}
                      onDragStart={() => {}}
                      onDragEnd={() => {}}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleEditTask(task);
                      }}
                      onContextMenu={(e) => {
                        e.stopPropagation();
                        onTaskContextMenu(e, task);
                      }}
                      title={`${task.title}${
                        task.assignment ? ` - ${task.assignment}` : ""
                      } ${occurrenceStart.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} - ${occurrenceEnd.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`}
                    >
                      {!isMobile && task.assignment && (
                        <div className="text-[10px] text-[var(--accent-primary)] truncate font-medium mb-0.5">
                          {task.assignment}
                        </div>
                      )}
                      <div className="font-medium line-clamp-2 leading-snug">
                        {task.title || "Sin título"}
                      </div>
                      {!isMobile && (
                        <div className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5">
                          {occurrenceStart.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          –{" "}
                          {occurrenceEnd.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
              );
            })()}

            {hours.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-8 gap-1 relative border-t border-[var(--border-primary)]/60"
              >
                {/* Hour label */}
                <div className="text-[11px] text-[var(--text-secondary)] pt-1 pr-2 text-right font-medium tabular-nums">
                  {format12Hour(hour)}
                </div>

                {weekDays.map((day, i) => {
                  const isCurrentDay = isSameDay(day, new Date());
                  const isWeekend = i >= 5;

                  const singleHourTask = (() => {
                    const tasksForDay = getTasksWithDeadline(day);
                    for (const task of tasksForDay) {
                      if (task.completed) continue;
                      let occurrenceStart: Date | undefined;
                      let occurrenceEnd: Date | undefined;

                      if (isRecurringTask(task)) {
                        const occ = getOccurrenceForDate(task, day);
                        if (occ) {
                          occurrenceStart = new Date(occ.occurrenceStart);
                          occurrenceEnd = new Date(occ.occurrenceEnd);
                        }
                      } else if (task.start_at && task.end_at) {
                        const startT = task.start_at.split(":").map(Number);
                        const endT = task.end_at.split(":").map(Number);
                        if (startT.length >= 2 && endT.length >= 2) {
                          const dayStart = normalizeToStartOfDay(day);
                          occurrenceStart = new Date(dayStart);
                          occurrenceStart.setHours(startT[0], startT[1], 0, 0);
                          occurrenceEnd = new Date(dayStart);
                          occurrenceEnd.setHours(endT[0], endT[1], 0, 0);
                        }
                      }

                      if (occurrenceStart && occurrenceEnd) {
                        const startHour = occurrenceStart.getHours();
                        const startMinute = occurrenceStart.getMinutes();
                        const durationInMinutes = Math.round(
                          (occurrenceEnd.getTime() -
                            occurrenceStart.getTime()) /
                            (1000 * 60)
                        );
                        if (startHour === hour && durationInMinutes <= 60) {
                          return {
                            task,
                            occurrenceStart,
                            occurrenceEnd,
                            startMinute,
                            durationInMinutes,
                          };
                        }
                      }
                    }
                    return null;
                  })();

                  const dropZoneKey = `${i}-${hour}`;

                  return (
                    <div
                      key={i}
                      id={dropZoneKey}
                      className={`
                        cursor-pointer min-h-[60px] transition-colors relative overflow-hidden rounded-md
                        ${
                          hoveredSlot?.key === dropZoneKey
                            ? "bg-[var(--accent-primary)]/10 ring-1 ring-[var(--accent-primary)]/25"
                            : "hover:bg-[var(--bg-secondary)]/50"
                        }
                        ${
                          isCurrentDay && hoveredSlot?.key !== dropZoneKey
                            ? "bg-[var(--accent-primary)]/4"
                            : ""
                        }
                        ${
                          isWeekend && !isCurrentDay
                            ? "bg-[var(--bg-secondary)]/15"
                            : ""
                        }
                      `}
                      onDoubleClick={(e) => {
                        if (
                          (e.target as HTMLElement).closest(
                            "[data-calendar-task]"
                          )
                        )
                          return;
                        handleAddTask(
                          e,
                          day,
                          hour,
                          isLoggedIn,
                          setSelectedDate,
                          setFocusedDate,
                          setShowTaskForm,
                          setIsLoginPromptOpen,
                          setSelectedTask
                        );
                      }}
                    >
                      {/* Drop preview half-hour */}
                      {hoveredSlot?.key === dropZoneKey && (
                        <div
                          className="absolute left-0 right-0 pointer-events-none bg-[var(--accent-primary)]/12"
                          style={{
                            top: hoveredSlot.minute === 0 ? 0 : "50%",
                            height: "50%",
                            borderTop:
                              hoveredSlot.minute === 0
                                ? "1.5px solid var(--accent-primary)"
                                : "none",
                            borderBottom:
                              hoveredSlot.minute === 30
                                ? "1.5px solid var(--accent-primary)"
                                : "none",
                            zIndex: 1,
                          }}
                        />
                      )}

                      {/* Current time line */}
                      {isCurrentDay && hour === currentHour && (
                        <div
                          className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                          style={{
                            top: `${getTopPosition(currentMinutesFromStart)}px`,
                            width: "calc(100% + 6px)",
                            left: "-3px",
                          }}
                        >
                          <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] shrink-0 -ml-0.5" />
                          <div className="flex-1 h-[2px] bg-[var(--accent-primary)] rounded-full" />
                        </div>
                      )}

                      {/* Half-hour divider */}
                      <div
                        className="absolute left-1 right-1 border-t border-dashed border-[var(--border-primary)]/50 pointer-events-none"
                        style={{ top: "30px", zIndex: 1 }}
                      />

                      {/* Single-hour task */}
                      {singleHourTask && (
                        <div
                          data-calendar-task
                          draggable
                          id={singleHourTask.task.id.toString()}
                          className={taskBlockClass}
                          style={{
                            left: "3px",
                            right: "3px",
                            top: `${getTopPosition(
                              getMinutesFromStartOfDay(
                                singleHourTask.occurrenceStart
                              )
                            )}px`,
                            height: `${getHeight(
                              singleHourTask.durationInMinutes
                            )}px`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingTask(singleHourTask.task);
                          }}
                          onDragStart={() => {}}
                          onDragEnd={() => {}}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleEditTask(singleHourTask.task);
                          }}
                          onContextMenu={(e) => {
                            e.stopPropagation();
                            onTaskContextMenu(e, singleHourTask.task);
                          }}
                          title={`${singleHourTask.task.title}${
                            singleHourTask.task.assignment
                              ? ` - ${singleHourTask.task.assignment}`
                              : ""
                          } ${singleHourTask.occurrenceStart.toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" }
                          )} - ${singleHourTask.occurrenceEnd.toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" }
                          )}`}
                        >
                          {!isMobile && singleHourTask.task.assignment && (
                            <div className="text-[10px] text-[var(--accent-primary)] truncate font-medium mb-0.5">
                              {singleHourTask.task.assignment}
                            </div>
                          )}
                          <div className="font-medium truncate leading-snug">
                            {singleHourTask.task.title || "Sin título"}
                          </div>
                          {!isMobile && (
                            <div className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5">
                              {singleHourTask.occurrenceStart.toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}{" "}
                              –{" "}
                              {singleHourTask.occurrenceEnd.toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="text-[var(--text-primary)] text-sm px-3 py-2 rounded-lg shadow-lg border-l-[3px] border-[var(--accent-primary)] bg-[var(--bg-primary)] opacity-95 min-w-[140px]">
            <div className="font-medium line-clamp-2">
              {activeTask.title || "Sin título"}
            </div>
            {activeTask.assignment && (
              <div className="text-[11px] text-[var(--accent-primary)] truncate mt-0.5">
                {activeTask.assignment}
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

const format12Hour = (hour: number) => {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour} ${period}`;
};

export default WeekView;