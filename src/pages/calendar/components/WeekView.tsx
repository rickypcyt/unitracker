import { getOccurrenceForDate, isRecurringTask } from '@/utils/recurrenceUtils';
import { useEffect, useState } from 'react';

import { handleAddTask } from '../utils/calendarUtils';
import { isSameDay } from 'date-fns';

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

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Calculate current time position for today column
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)]/90 border-[var(--border-primary)] rounded-lg relative min-h-0 h-full">
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
            
            return allSpanningTasks.map(({task, dayIndex, startHour, duration, occurrenceStart, occurrenceEnd}) => {
              const topPosition = startHour * 60 + 20; // 60px per hour + 20px offset (increased from 8px)
              const blockHeight = duration * 60 - 20; // Subtract 20px for top and bottom margins
              
              return (
                <div
                  key={`spanning-task-${task.id}-${dayIndex}`}
                  data-calendar-task
                  className="text-white text-xs sm:text-sm px-1.5 pt-1 pb-0.5 rounded shadow-sm truncate pointer-events-auto cursor-pointer transition-all hover:shadow-md border-2 border-[var(--accent-primary)] bg-[var(--bg-primary)] absolute z-10"
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
                  
                  // Check if there's a task that starts at this hour and is only 1 hour long
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
                          occurrenceStart = new Date(day);
                          occurrenceStart.setHours(startT[0], startT[1], 0, 0);
                          occurrenceEnd = new Date(day);
                          occurrenceEnd.setHours(endT[0], endT[1], 0, 0);
                        }
                      }
                      
                      if (occurrenceStart && occurrenceEnd) {
                        const startHour = occurrenceStart.getHours();
                        const duration = (occurrenceEnd.getTime() - occurrenceStart.getTime()) / (60 * 60 * 1000);
                        
                        // Only show single hour tasks here
                        if (startHour === hour && duration <= 1) {
                          return {
                            task,
                            occurrenceStart,
                            occurrenceEnd
                          };
                        }
                      }
                    }
                    return null;
                  })();

                  return (
                    <div
                      key={i}
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
                            top: `${(currentMinute / 60) * 60}px`,
                            width: 'calc(100% + 8px)',
                            left: '-4px'
                          }}
                        >
                          <div className="absolute right-0 text-xs text-[var(--accent-primary)] font-medium bg-[var(--bg-primary)] px-1 mr-2">
                            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      )}
                      
                      {/* Render single hour task if this is its hour */}
                      {singleHourTask && (
                        <div
                          data-calendar-task
                          className="text-white text-xs sm:text-sm px-1.5 pt-1 pb-0.5 rounded shadow-sm truncate pointer-events-auto cursor-pointer transition-all hover:shadow-md border-2 border-[var(--accent-primary)] bg-[var(--bg-primary)] absolute z-10"
                          style={{
                            left: '2px',
                            top: '2px',
                            right: '2px',
                            bottom: '2px'
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
  );
};

// Helper function for 12-hour formatting
const format12Hour = (hour: number) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
  return `${displayHour}:00 ${period}`;
};

export default WeekView;