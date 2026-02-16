import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { getOccurrenceForDate, isRecurringTask } from '@/utils/recurrenceUtils';
import { useEffect, useState } from 'react';

import { handleAddTask } from '../utils/calendarUtils';
import { isSameDay } from 'date-fns';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useAppStore } from '@/store/appStore';

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
  
  const updateTaskSuccess = useAppStore((state) => state.updateTaskSuccess);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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

  // Mathematical model for precise time positioning
  const PIXELS_PER_MINUTE = 1; // 1px por minuto = 60px por hora
  const MINUTES_PER_HOUR = 60;
  
  // CALENDAR CONFIGURATION - Adjust these values to change visible hours
  const VISIBLE_START_HOUR = 8;  // Calendar starts at 8:00 AM
  const VISIBLE_END_HOUR = 20;   // Calendar ends at 8:00 PM
  const VISIBLE_START_MINUTES = VISIBLE_START_HOUR * MINUTES_PER_HOUR; // 480 minutes

  const hours = Array.from({ length: VISIBLE_END_HOUR - VISIBLE_START_HOUR }, (_, i) => VISIBLE_START_HOUR + i);

  // Calculate minutes from start of day (00:00) - normalized to avoid timezone issues
  const getMinutesFromStartOfDay = (date: Date): number => {
    // Normalize to local timezone to avoid UTC mixing
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes());
    return normalizedDate.getHours() * MINUTES_PER_HOUR + normalizedDate.getMinutes();
  };

  // Normalize date to start of day (00:00:00) in local timezone
  const normalizeToStartOfDay = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  };

  // Calculate top position based on VISIBLE start time (not midnight!)
  const getTopPosition = (minutesFromMidnight: number): number => {
    // CRITICAL: Subtract visible start time to align with grid
    const minutesFromVisibleStart = minutesFromMidnight - VISIBLE_START_MINUTES;
    return minutesFromVisibleStart * PIXELS_PER_MINUTE;
  };

  // Calculate height based on duration in minutes
  const getHeight = (durationInMinutes: number): number => {
    return durationInMinutes * PIXELS_PER_MINUTE;
  };

  // Calculate current time position for today column
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutesFromStart = getMinutesFromStartOfDay(now);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id as string;
    
    // Find the task in any day
    for (const day of weekDays) {
      const tasksForDay = getTasksWithDeadline(day);
      const task = tasksForDay.find(t => t.id.toString() === taskId);
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

    // Parse the drop zone data (format: "day-hour")
    const dropZoneId = over.id as string;
    const [dayIndex, hour] = dropZoneId.split('-').map(Number);
    
    if (typeof dayIndex === 'number' && typeof hour === 'number' && dayIndex >= 0 && dayIndex < weekDays.length) {
      const targetDay = weekDays[dayIndex];
      
      if (targetDay) {
        // Calculate new start and end times
        const newStartTime = new Date(targetDay);
        newStartTime.setHours(hour, 0, 0, 0);
        
        // Calculate duration from original task
        let duration = 1; // Default 1 hour
        if (draggedTaskData.start_at && draggedTaskData.end_at) {
          const startT = draggedTaskData.start_at.split(':').map(Number);
          const endT = draggedTaskData.end_at.split(':').map(Number);
          if (startT.length >= 2 && endT.length >= 2) {
            duration = endT[0] - startT[0] + (endT[1] - startT[1]) / 60;
          }
        }
        
        const newEndTime = new Date(newStartTime);
        newEndTime.setHours(newStartTime.getHours() + duration);
        
        // Format times for the task
        const formatTime = (date: Date) => {
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        };
        
        // Update the task with new times and deadline
        const updatedTask = {
          ...draggedTaskData,
          start_at: formatTime(newStartTime),
          end_at: formatTime(newEndTime),
          deadline: targetDay.toISOString().split('T')[0],
        };
        
        // Update task in store
        updateTaskSuccess(updatedTask);
      }
    }
    
    setActiveTask(null);
    setDraggedTaskData(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="flex flex-col bg-[var(--bg-primary)]/90 border-[var(--border-primary)] rounded-lg relative overflow-hidden h-full">
      {/* Header with days - Sticky header */}
      <div className="sticky top-0 z-20 bg-[var(--bg-primary)]/95 backdrop-blur-sm pb-1 border-b border-[var(--border-primary)]/30 flex-shrink-0">
        <div className="grid grid-cols-8 gap-1">
          <div className="text-sm text-[var(--text-secondary)] font-medium p-1"></div>
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={`text-center text-sm font-medium p-1 rounded ${
                isSameDay(day, new Date())
                  ? 'text-[var(--accent-primary)] font-semibold'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              <div className="text-sm sm:text-base font-medium opacity-90">{day.toLocaleDateString('en', { weekday: 'short' })}</div>
              <div className="text-base">{day.getDate()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-auto min-h-0">
        <div className="relative">
          {/* Render all tasks that span multiple hours */}
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
              tasksForDay.forEach(task => {
                if (task.completed) return;
                
                let occurrenceStart, occurrenceEnd;
                
                if (isRecurringTask(task)) {
                  const occ = getOccurrenceForDate(task, day);
                  if (occ) {
                    occurrenceStart = new Date(occ.occurrenceStart);
                    occurrenceEnd = new Date(occ.occurrenceEnd);
                  }
                } else if (task.start_at && task.end_at) {
                  const startT = task.start_at.split(':').map(Number);
                  const endT = task.end_at.split(':').map(Number);
                  
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
                  const duration = (occurrenceEnd.getTime() - occurrenceStart.getTime()) / (60 * 60 * 1000);
                  
                  // Only include tasks that span more than 1 hour
                  if (duration > 1) {
                    allSpanningTasks.push({
                      task,
                      day,
                      dayIndex,
                      startHour,
                      endHour,
                      duration,
                      occurrenceStart,
                      occurrenceEnd
                    });
                  }
                }
              });
            });
            
            return allSpanningTasks.map(({task, dayIndex, occurrenceStart, occurrenceEnd}) => {
              // Calculate precise positioning using mathematical model
              const startMinutesFromStart = getMinutesFromStartOfDay(occurrenceStart);
              const durationInMinutes = (occurrenceEnd.getTime() - occurrenceStart.getTime()) / (1000 * 60);
              
              const topPosition = getTopPosition(startMinutesFromStart);
              const blockHeight = getHeight(durationInMinutes);
              
              return (
                <div
                  key={`spanning-task-${task.id}-${dayIndex}`}
                  data-calendar-task
                  draggable
                  id={task.id.toString()}
                  className="text-white text-xs sm:text-sm px-1.5 pt-1 pb-0.5 rounded shadow-sm truncate pointer-events-auto cursor-pointer transition-all hover:shadow-md border border-[var(--accent-primary)] bg-[var(--bg-primary)] absolute z-10 hover:scale-105 hover:shadow-lg hover:cursor-grab active:cursor-grabbing"
                  style={{
                    left: `${(dayIndex + 1) * 12.5 + 0.5}%`,
                    top: `${topPosition}px`,
                    width: `11.5%`,
                    height: `${blockHeight}px`
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingTask(task);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleEditTask(task);
                  }}
                  onContextMenu={(e) => {
                    e.stopPropagation();
                    onTaskContextMenu(e, task);
                  }}
                  title={`${task.title}${task.assignment ? ` - ${task.assignment}` : ''} ${occurrenceStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${occurrenceEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                >
                  <div className="font-medium truncate">{task.title || 'Sin título'}</div>
                  {!isMobile && task.assignment && (
                    <div className="text-xs text-white truncate">
                      {task.assignment}
                    </div>
                  )}
                  {!isMobile && (
                    <div className="text-xs opacity-90 truncate">
                      {occurrenceStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {occurrenceEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              );
            });
          })()}
          
          {hours.map((hour) => {
            return (
              <div key={hour} className="grid grid-cols-8 gap-1 border-t border-[var(--border-primary)]/30 relative">
                <div className="text-sm text-[var(--text-secondary)] p-1 text-left">
                  {format12Hour(hour)}
                </div>
                {weekDays.map((day, i) => {
                  const isCurrentDay = isSameDay(day, new Date());
                  
                  // Check if there's a task that starts at this hour (regardless of minutes)
                  const singleHourTask = (() => {
                    const tasksForDay = getTasksWithDeadline(day);
                    for (const task of tasksForDay) {
                      if (task.completed) continue;
                      
                      let occurrenceStart, occurrenceEnd;
                      
                      if (isRecurringTask(task)) {
                        const occ = getOccurrenceForDate(task, day);
                        if (occ) {
                          occurrenceStart = new Date(occ.occurrenceStart);
                          occurrenceEnd = new Date(occ.occurrenceEnd);
                        }
                      } else if (task.start_at && task.end_at) {
                        const startT = task.start_at.split(':').map(Number);
                        const endT = task.end_at.split(':').map(Number);
                        
                        if (startT.length >= 2 && endT.length >= 2) {
                          // Normalize to start of day to avoid timezone issues
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
                        // Calculate duration in minutes (not hours) to avoid rounding
                        const durationInMinutes = Math.round((occurrenceEnd.getTime() - occurrenceStart.getTime()) / (1000 * 60));
                        
                        // Show task if it starts within this hour block (8:00-8:59 shows in 8:00 block)
                        if (startHour === hour && durationInMinutes <= 60) {
                          return {
                            task,
                            occurrenceStart,
                            occurrenceEnd,
                            startMinute,
                            durationInMinutes // Use minutes instead of hours
                          };
                        }
                      }
                    }
                    return null;
                  })();

                  return (
                    <div
                      key={i}
                      id={`${i}-${hour}`}
                      className={`border-l border-[var(--border-primary)]/20 hover:bg-[var(--bg-secondary)]/30 cursor-pointer p-1 min-h-[60px] transition-colors relative overflow-hidden ${
                        isCurrentDay ? 'bg-[var(--accent-primary)]/5' : ''
                      }`}
                      onDoubleClick={(e) => {
                        if ((e.target as HTMLElement).closest('[data-calendar-task]')) return;
                        handleAddTask(e, day, hour, isLoggedIn, setSelectedDate, setFocusedDate, setShowTaskForm, setIsLoginPromptOpen, setSelectedTask);
                      }}
                    >
                      {isCurrentDay && hour === currentHour && (
                        <div
                          className="absolute left-0 right-0 h-0.5 border-t-2 border-[var(--accent-primary)] z-20 flex items-center"
                          style={{
                            top: `${getTopPosition(currentMinutesFromStart)}px`,
                            width: 'calc(100% + 8px)',
                            left: '-4px'
                          }}
                        >
                          <div className="absolute right-0 text-xs text-[var(--accent-primary)] font-medium bg-[var(--bg-primary)] px-1 mr-2">
                            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      )}
                      
                      {/* Half-hour divider line */}
                      <div 
                        className="absolute left-0 right-0 border-t border-[var(--border-primary)]/20 pointer-events-none"
                        style={{
                          top: '30px', // Middle of the 60px hour cell
                          zIndex: 1
                        }}
                      />
                      
                      {/* Render task if this is its hour block */}
                      {singleHourTask && (
                        <div
                          data-calendar-task
                          draggable
                          id={singleHourTask.task.id.toString()}
                          className="text-white text-xs sm:text-sm px-1.5 pt-1 pb-0.5 rounded shadow-sm truncate pointer-events-auto cursor-pointer transition-all hover:shadow-md border border-[var(--accent-primary)] bg-[var(--bg-primary)] absolute z-10 hover:scale-105 hover:shadow-lg hover:cursor-grab active:cursor-grabbing"
                          style={{
                            left: '2px',
                            right: '2px',
                            // Use consistent mathematical model for positioning
                            top: `${getTopPosition(getMinutesFromStartOfDay(singleHourTask.occurrenceStart))}px`,
                            height: `${getHeight(singleHourTask.durationInMinutes)}px`
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingTask(singleHourTask.task);
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleEditTask(singleHourTask.task);
                          }}
                          onContextMenu={(e) => {
                            e.stopPropagation();
                            onTaskContextMenu(e, singleHourTask.task);
                          }}
                          title={`${singleHourTask.task.title}${singleHourTask.task.assignment ? ` - ${singleHourTask.task.assignment}` : ''} ${singleHourTask.occurrenceStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${singleHourTask.occurrenceEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        >
                          <div className="font-medium truncate">{singleHourTask.task.title || 'Sin título'}</div>
                          {!isMobile && singleHourTask.task.assignment && (
                            <div className="text-xs text-white truncate">
                              {singleHourTask.task.assignment}
                            </div>
                          )}
                          {!isMobile && (
                            <div className="text-xs opacity-90 truncate">
                              {singleHourTask.occurrenceStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {singleHourTask.occurrenceEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      </div>
      
      <DragOverlay>
        {activeTask ? (
          <div className="text-white text-sm px-2 py-1 rounded shadow-lg border-2 border-[var(--accent-primary)] bg-[var(--bg-primary)] opacity-90">
            <div className="font-medium truncate">{activeTask.title || 'Sin título'}</div>
            {activeTask.assignment && (
              <div className="text-xs text-white truncate">
                {activeTask.assignment}
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

// Helper function for 12-hour formatting
const format12Hour = (hour: number) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
  return `${displayHour}:00 ${period}`;
};

export default WeekView;