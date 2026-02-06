/**
 * Task to DayFlow Event Mapper
 * 
 * This module provides utilities to convert UniTracker tasks to DayFlow events
 * with proper field mapping and Temporal API compatibility.
 */

import { createAllDayEvent, createEvent } from '@dayflow/core';

// Task interface based on your database schema
interface Task {
  id: string | number;
  title: string;
  description?: string;
  completed: boolean;
  deadline?: string; // ISO string
  start_time?: string; // HH:MM format
  end_time?: string; // HH:MM format
  assignment?: string;
  difficulty?: string;
  status?: string;
  workspace_id?: string;
  recurrence_type?: 'none' | 'weekly' | 'monthly';
  recurrence_weekdays?: number[];
  activetask?: boolean;
  isRecurring?: boolean; // Add this for compatibility
  created_at?: string;
  updated_at?: string;
}

// DayFlow Event interface (simplified) - using actual DayFlow types
interface DayFlowEvent {
  id: string;
  title: string;
  description?: string;
  start: Date | any; // DayFlow may use Temporal types
  end: Date | any; // Required by DayFlow
  allDay?: boolean;
  calendarId?: string;
  meta?: Record<string, any>;
}

/**
 * Convert time string (HH:MM) to Date with specific date
 */
function setTimeOnDate(date: Date, timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours || 10, minutes || 0, 0, 0);
  return result;
}

/**
 * Convert task to DayFlow event(s)
 * Handles both one-time and recurring tasks
 */
export function taskToEvent(task: Task): DayFlowEvent[] {
  const events: DayFlowEvent[] = [];
  
  // Basic validation
  if (!task.id || !task.title) {
    console.warn('Invalid task: missing id or title', task);
    return events;
  }

  // Add visual distinction for completed tasks
  const eventTitle = task.completed ? `✓ ${task.title}` : task.title;
  
  // Base metadata for all events
  const baseMeta = {
    taskId: task.id,
    assignment: task.assignment,
    difficulty: task.difficulty,
    status: task.status,
    completed: task.completed,
    originalDeadline: task.deadline,
  };

  // Handle recurring tasks
  if ((task.recurrence_type === 'weekly' || task.isRecurring) && 
      task.recurrence_weekdays && 
      task.recurrence_weekdays.length > 0) {
    
    console.log('DEBUG: Processing recurring task:', task.title, {
      recurrence_type: task.recurrence_type,
      recurrence_weekdays: task.recurrence_weekdays,
      hasDeadline: !!task.deadline,
      hasTimes: !!(task.start_time && task.end_time)
    });
    
    // Create events for multiple weeks (past 2 weeks to future 8 weeks)
    const today = new Date();
    const startRange = new Date(today);
    startRange.setDate(today.getDate() - 14); // 2 weeks ago
    
    const endRange = new Date(today);
    endRange.setDate(today.getDate() + 56); // 8 weeks from now
    
    // Generate events for each week in the range
    const currentWeek = new Date(startRange);
    currentWeek.setDate(currentWeek.getDate() - ((currentWeek.getDay() + 6) % 7)); // Start on Monday
    
    while (currentWeek <= endRange) {
      task.recurrence_weekdays.forEach((weekday: number) => {
        const eventDate = new Date(currentWeek);
        eventDate.setDate(currentWeek.getDate() + (weekday === 0 ? 6 : weekday - 1));
        
        // Only create events that are within our range
        if (eventDate >= startRange && eventDate <= endRange) {
          console.log('DEBUG: Creating recurring event for weekday:', weekday, 'date:', eventDate.toISOString());
          
          if (task.start_time && task.end_time) {
            // Timed recurring event (with or without deadline)
            const startDate = setTimeOnDate(eventDate, task.start_time);
            const endDate = setTimeOnDate(eventDate, task.end_time);
            
            console.log('DEBUG: Creating timed recurring event:', {
              id: `${task.id}-${weekday}-${eventDate.toISOString().split('T')[0]}`,
              title: eventTitle,
              start: startDate,
              end: endDate
            });
            
            events.push(createEvent({
              id: `${task.id}-${weekday}-${eventDate.toISOString().split('T')[0]}`,
              title: eventTitle,
              description: task.description || '',
              start: startDate,
              end: endDate,
              ...(task.workspace_id && { calendarId: task.workspace_id }),
              meta: {
                ...baseMeta,
                isRecurring: true,
                weekday,
              }
            }));
          } else {
            // All-day recurring event (use eventDate or deadline if available)
            const eventDateForAllDay = task.deadline ? new Date(task.deadline) : eventDate;
            
            console.log('DEBUG: Creating all-day recurring event:', {
              id: `${task.id}-${weekday}-${eventDate.toISOString().split('T')[0]}`,
              title: eventTitle,
              date: eventDateForAllDay
            });
            
            events.push(createAllDayEvent(
              `${task.id}-${weekday}-${eventDate.toISOString().split('T')[0]}`,
              eventTitle,
              eventDateForAllDay
            ));
          }
        }
      });
      
      // Move to next week
      currentWeek.setDate(currentWeek.getDate() + 7);
    }
  } else {
    // Handle one-time tasks
    if (!task.deadline) {
      console.warn('Task without deadline cannot be converted to event:', task.id);
      return events;
    }
    
    const deadline = new Date(task.deadline);
    
    // Validate date
    if (isNaN(deadline.getTime())) {
      console.warn('Invalid deadline for task:', task.id, task.deadline);
      return events;
    }
    
    // Check if task has specific times (start_time/end_time for normal tasks)
    if (task.start_time && task.end_time) {
      // Timed event - use deadline date + start_time/end_time
      const [startHour, startMin] = task.start_time.split(':').map(Number);
      const [endHour, endMin] = task.end_time.split(':').map(Number);
      
      const startDate = new Date(deadline);
      startDate.setHours(startHour || 10, startMin || 0, 0, 0);
      
      const endDate = new Date(deadline);
      endDate.setHours(endHour || 11, endMin || 0, 0, 0);
      
      console.log('DEBUG: Creating timed event:', {
        id: task.id,
        title: eventTitle,
        start: startDate,
        end: endDate,
        start_time: task.start_time,
        end_time: task.end_time
      });
      
      events.push(createEvent({
        id: task.id.toString(),
        title: eventTitle,
        description: task.description || '',
        start: startDate,
        end: endDate,
        ...(task.workspace_id && { calendarId: task.workspace_id }),
        meta: {
          ...baseMeta,
          isRecurring: false,
        }
      }));
    } else {
      // All-day event (no start_time/end_time)
      console.log('DEBUG: Creating all-day event:', {
        id: task.id,
        title: eventTitle,
        date: deadline,
        hasStartTime: !!task.start_time,
        hasEndTime: !!task.end_time
      });
      
      events.push(createAllDayEvent(
        task.id.toString(),
        eventTitle,
        deadline
      ));
    }
  }
  
  return events;
}

/**
 * Convert multiple tasks to DayFlow events
 */
export function tasksToEvents(tasks: Task[]): DayFlowEvent[] {
  const allEvents: DayFlowEvent[] = [];
  
  tasks.forEach(task => {
    try {
      const events = taskToEvent(task);
      allEvents.push(...events);
    } catch (error) {
      console.error('Error converting task to event:', task.id, error);
    }
  });
  
  return allEvents;
}

/**
 * Filter tasks for calendar display
 */
export function filterTasksForCalendar(
  tasks: Task[], 
  options: {
    includeCompleted?: boolean;
    includeWithoutDeadlines?: boolean;
    workspaceId?: string;
  } = {}
): Task[] {
  const {
    includeCompleted = false,
    includeWithoutDeadlines = false,
    workspaceId
  } = options;
  
  return tasks.filter(task => {
    // Filter by workspace
    if (workspaceId && task.workspace_id !== workspaceId) {
      return false;
    }
    
    // Filter completed tasks
    if (!includeCompleted && task.completed) {
      return false;
    }
    
    // Filter tasks without deadlines - BUT allow recurring tasks without deadlines
    const hasDeadline = !!task.deadline;
    const isRecurring = (task.recurrence_type === 'weekly' || task.isRecurring) && 
                       task.recurrence_weekdays && 
                       task.recurrence_weekdays.length > 0;
    
    if (!includeWithoutDeadlines && !hasDeadline && !isRecurring) {
      return false;
    }
    
    return true;
  });
}

/**
 * Get event color based on task properties
 */
export function getEventColor(task: Task): string {
  if (task.completed) {
    return '#10b981'; // Green for completed
  }
  
  if (task.difficulty === 'hard') {
    return '#ef4444'; // Red for hard
  }
  
  if (task.difficulty === 'medium') {
    return '#f59e0b'; // Orange for medium
  }
  
  return '#3b82f6'; // Blue for easy/default
}

/**
 * Check if task should be displayed as all-day event
 */
export function isAllDayTask(task: Task): boolean {
  // Task is all-day if it has no specific start/end times
  return !task.start_time || !task.end_time;
}

/**
 * Get task priority for calendar sorting
 */
export function getTaskPriority(task: Task): number {
  if (task.completed) return 4;
  if (task.difficulty === 'hard') return 1;
  if (task.difficulty === 'medium') return 2;
  return 3;
}

/**
 * Check if task has valid date for calendar display
 */
export function hasValidDate(task: Task): boolean {
  if (!task.deadline) return false;
  const deadline = new Date(task.deadline);
  return !isNaN(deadline.getTime());
}

/**
 * Check if task is timed (has specific hours)
 */
export function isTimedTask(task: Task): boolean {
  return !!(task.start_time && task.end_time);
}
