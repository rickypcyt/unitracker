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
    <div className="w-full  px-3 sm:px-4 md:px-3 lg:px-16 xl:px-28 session-page mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="w-full">
          <Calendar />
        </div>
        <div className=" relative mx-auto w-full transition-all duration-300 calendar-view max-w-4xl md:max-w-2xl lg:max-w-4xl">
          <AllTasks />
        </div>
      </div>
    </div>
  );
});

CalendarPage.displayName = 'CalendarPage';

export default CalendarPage;