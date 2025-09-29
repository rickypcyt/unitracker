import { memo, useEffect } from 'react';

import AllTasks from '@/pages/calendar/AllTasks';
import Calendar from '@/pages/calendar/Calendar';
import { useLocation } from 'react-router-dom';

const CalendarPage = memo(() => {
  const location = useLocation();
  const isVisible = location.pathname === '/calendar';

  // Update calendar when the page becomes visible
  useEffect(() => {
    if (isVisible) {
      window.dispatchEvent(new CustomEvent('refreshCalendar'));
    }
  }, [isVisible]);

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 2xl:px-32 session-page mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="w-full">
          <Calendar />
        </div>
        <div className="w-full">
          <AllTasks />
        </div>
      </div>
    </div>
  );
});

CalendarPage.displayName = 'CalendarPage';

export default CalendarPage;