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

import { Task } from '@/types/taskStorage';
import { tasksToEvents } from '../../utils/taskToEventMapper';
import { useAppStore } from '../../store/appStore';
import useDemoMode from '../../utils/useDemoMode';
import useTheme from '../../hooks/useTheme';

function DayFlowCalendarComponent() {
  const { currentTheme } = useTheme();
  const dragPlugin = createDragPlugin();
  
  // Get tasks from store or demo mode
  const { isDemo, demoTasks } = useDemoMode();
  const realTasks = useAppStore((state) => state.tasks.tasks);
  const tasks = isDemo ? demoTasks : realTasks;

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
