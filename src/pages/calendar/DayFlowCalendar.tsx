import {
  DayFlowCalendar,
  createAllDayEvent,
  createDayView,
  createDragPlugin,
  createEvent,
  createMonthView,
  createWeekView,
  useCalendarApp,
} from '@dayflow/core';
import { useAppStore, useWorkspace } from '../../store/appStore';

import { ALL_WORKSPACE_ID } from '@/hooks/useTaskBoard';
import { Task } from '@/types/taskStorage';
import { tasksToEvents } from '../../utils/taskToEventMapper';
import useDemoMode from '../../utils/useDemoMode';
import { useMemo } from 'react';
import useTheme from '../../hooks/useTheme';

function DayFlowCalendarComponent() {
  const { currentTheme } = useTheme();
  const dragPlugin = createDragPlugin();
  
  // Get tasks from store or demo mode
  const { isDemo, demoTasks } = useDemoMode();
  const realTasks = useAppStore((state) => state.tasks.tasks);
  const { currentWorkspace: activeWorkspace } = useWorkspace();

  // Filter tasks based on active workspace
  const tasks = useMemo(() => {
    const allTasks = isDemo ? demoTasks : realTasks;
    
    // If "All" workspace is selected or no workspace, show all tasks
    if (!activeWorkspace || activeWorkspace.id === ALL_WORKSPACE_ID) {
      return allTasks;
    }
    
    // Filter tasks by workspace
    return allTasks.filter(task => task.workspace_id === activeWorkspace.id);
  }, [isDemo, demoTasks, realTasks, activeWorkspace]);

  // Convert tasks to DayFlow events
  const events = tasksToEvents(tasks);

  const calendar = useCalendarApp({
    views: [createDayView(), createWeekView(), createMonthView()],
    plugins: [dragPlugin],
    events,
    initialDate: new Date(),
    theme: {
      mode: currentTheme,
    },
  });

  return (
    <div style={{ height: '100vh' }}>
      <DayFlowCalendar calendar={calendar} />
    </div>
  );
}

export default DayFlowCalendarComponent;
