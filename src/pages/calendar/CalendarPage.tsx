import { memo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import Calendar from '@/pages/calendar/Calendar';
import AllTasks from '@/pages/calendar/AllTasks';

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
    <div className="w-full px-2 pt-4 max-w-7xl mx-auto">
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