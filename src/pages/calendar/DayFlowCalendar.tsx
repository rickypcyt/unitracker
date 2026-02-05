import { DayFlowCalendar, ViewType, createAllDayEvent, createDayView, createDragPlugin, createEvent, createMonthView, createWeekView, useCalendarApp } from '@dayflow/core';
import { memo, useEffect, useMemo } from 'react';

import { useAppStore } from '@/store/appStore';
import useDemoMode from '@/utils/useDemoMode';
import useTheme from '@/hooks/useTheme';

const DayFlowCalendarComponent = memo(() => {
  const realTasks = useAppStore((state) => state.tasks.tasks);
  const { isDemo, demoTasks } = useDemoMode();
  const tasks = isDemo ? demoTasks : realTasks;
  
  // Use the same theme system as the rest of the app
  const { currentTheme } = useTheme();

  // Create drag plugin for DayFlow
  const dragPlugin = createDragPlugin({
    enableDrag: true,
    enableResize: true,
    enableCreate: true,
    enableAllDayCreate: true,
    supportedViews: [ViewType.DAY, ViewType.WEEK, ViewType.MONTH],
  });

  // Fix DayFlow theme override by removing conflicting attributes
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove DayFlow's theme override attributes
    root.removeAttribute('data-dayflow-theme-override');
    root.removeAttribute('data-theme');
    
    // Ensure our theme system takes precedence
    root.classList.remove('light', 'dark');
    root.classList.add(currentTheme);
    root.style.colorScheme = currentTheme;
    
    console.log('DayFlow Calendar - Fixed theme override:', {
      currentTheme,
      documentClasses: root.className,
      colorScheme: root.style.colorScheme
    });
  }, [currentTheme]);

  // Convert tasks to DayFlow events
  const events = useMemo(() => {
    const convertedEvents: any[] = [];
    
    tasks
      .filter(task => !task.completed)
      .forEach(task => {
        if (task.deadline) {
          const deadline = new Date(task.deadline);
          
          // Handle recurring tasks
          if (task.isRecurring && task.recurrence_weekdays && task.recurrence_weekdays.length > 0) {
            // For recurring tasks, create events for this week
            const today = new Date();
            const startOfWeek = new Date(today);
            const day = startOfWeek.getDay();
            const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
            startOfWeek.setDate(diff);
            
            task.recurrence_weekdays.forEach((weekday: number) => {
              const eventDate = new Date(startOfWeek);
              eventDate.setDate(startOfWeek.getDate() + (weekday === 0 ? 6 : weekday - 1));
              
              if (task.start_time && task.end_time) {
                const [startHour, startMin] = task.start_time.split(':').map(Number);
                const [endHour, endMin] = task.end_time.split(':').map(Number);
                
                const startDate = new Date(eventDate);
                startDate.setHours(startHour || 10, startMin || 0, 0, 0);
                
                const endDate = new Date(eventDate);
                endDate.setHours(endHour || 11, endMin || 0, 0, 0);
                
                convertedEvents.push(createEvent({
                  id: `${task.id}-${weekday}`,
                  title: task.title || 'Untitled',
                  start: startDate,
                  end: endDate,
                }));
              } else {
                // All day event for tasks without specific times
                convertedEvents.push(createAllDayEvent(
                  `${task.id}-${weekday}`,
                  task.title || 'Untitled',
                  eventDate
                ));
              }
            });
          } else {
            // Handle one-time tasks with start/end times
            if (task.start_time && task.end_time) {
              const [startHour, startMin] = task.start_time.split(':').map(Number);
              const [endHour, endMin] = task.end_time.split(':').map(Number);
              
              const startDate = new Date(deadline);
              startDate.setHours(startHour || 10, startMin || 0, 0, 0);
              
              const endDate = new Date(deadline);
              endDate.setHours(endHour || 11, endMin || 0, 0, 0);
              
              convertedEvents.push(createEvent({
                id: task.id,
                title: task.title || 'Untitled',
                start: startDate,
                end: endDate,
              }));
            } else {
              // All day event for tasks without specific times
              convertedEvents.push(createAllDayEvent(task.id, task.title || 'Untitled', deadline));
            }
          }
        }
      });
    
    return convertedEvents;
  }, [tasks]);

  const calendar = useCalendarApp({
    views: [createDayView(), createWeekView(), createMonthView()],
    events,
    initialDate: new Date(),
    theme: { 
      mode: currentTheme as 'light' | 'dark' 
    }, // Pass the current theme to DayFlow
    plugins: [dragPlugin], // Add drag plugin
  });

  return (
    <div className="w-full h-full">
      <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg overflow-hidden h-full">
        <DayFlowCalendar calendar={calendar} />
      </div>
    </div>
  );
});

DayFlowCalendarComponent.displayName = 'DayFlowCalendarComponent';

export default DayFlowCalendarComponent;
