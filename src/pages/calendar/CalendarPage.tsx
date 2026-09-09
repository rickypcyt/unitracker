import { memo, useEffect, useMemo, useState } from 'react';
import { useAppStore, useWorkspace } from '@/store/appStore';

import { ALL_WORKSPACE_ID } from '@/hooks/useTaskBoard';
import Calendar, { } from '@/pages/calendar/Calendar';
import { Helmet } from 'react-helmet-async';
import { RecurringTasksProvider } from '@/pages/calendar/RecurringTasksContext';
import UpcomingTasks from '@/pages/calendar/UpcomingTasks';
import useDemoMode from '@/utils/useDemoMode';
import { useLocation } from 'react-router-dom';

const CalendarPage = memo(() => {
  const location = useLocation();
  const { isDemo, demoTasks } = useDemoMode();
  const realTasks = useAppStore((state) => state.tasks.tasks);
  const { currentWorkspace: activeWorkspace } = useWorkspace();
  const [view, setView] = useState<'month' | 'week' | 'day'>(() => {
    const savedView = localStorage.getItem('calendarView');
    return savedView === 'week' || savedView === 'day' ? savedView : 'month';
  });

  const isVisible = location.pathname === '/calendar';
  
  // Filter tasks based on active workspace
  const tasks = useMemo(() => {
    const allTasks = isDemo ? demoTasks : realTasks;
    
    if (!activeWorkspace || activeWorkspace.id === ALL_WORKSPACE_ID) {
      return allTasks;
    }
    
    return allTasks.filter(task => task.workspace_id === activeWorkspace.id);
  }, [isDemo, demoTasks, realTasks, activeWorkspace]);

  // Refresh calendar when page becomes visible
  useEffect(() => {
    if (isVisible) {
      window.dispatchEvent(new CustomEvent('refreshCalendar'));
    }
  }, [isVisible]);

  const handleViewChange = (nextView: 'month' | 'week' | 'day') => {
    setView(nextView);
    localStorage.setItem('calendarView', nextView);
  };

  return (
    <RecurringTasksProvider>
      <Helmet>
        <title>UniTracker Calendar | UniTracker 2026</title>
        <meta
          name="description"
          content="Calendar for tracking tasks, deadlines, and focus sessions. Plan your work across all areas in one interactive calendar."
        />
        <meta
          name="keywords"
          content="task calendar, deadline tracker, schedule management, focus sessions, time tracking calendar, productivity calendar"
        />
        <meta property="og:title" content="Calendar & Schedule Management | UniTracker 2026" />
        <meta
          property="og:description"
          content="Calendar for tracking tasks, deadlines, and focus sessions. Plan your work across all areas in one interactive calendar."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://unitracker.me/calendar" />
        <link rel="canonical" href="https://unitracker.me/calendar" />
      </Helmet>
      
      <div className="w-full px-1 sm:px-2 md:px-2 lg:px-4 session-page mt-2 sm:mt-4">
        <div className="grid w-full grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.8fr)]">
          {/* Calendar - month view only */}
          <div className="min-w-0">
            <Calendar
              view={view}
              onViewChange={handleViewChange}
              tasks={tasks}
            />
          </div>

          <aside className="min-w-0">
            <UpcomingTasks limit={8} />
          </aside>
        </div>
      </div>
    </RecurringTasksProvider>
  );
});

CalendarPage.displayName = 'CalendarPage';

export default CalendarPage;