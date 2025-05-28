import React, { memo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Calendar from '../components/tools/Calendar';
import UpcomingTasks from '../components/tools/UpcomingTasks';

const CalendarPage = memo(() => {
  const location = useLocation();
  const isVisible = location.pathname === '/calendar';

  // Actualizar el calendario cuando la página se hace visible
  useEffect(() => {
    if (isVisible) {
      window.dispatchEvent(new CustomEvent('refreshCalendar'));
    }
  }, [isVisible]);

  return (
    <div className="w-full px-6 pt-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Calendar />
        </div>
        <div className="lg:col-span-1">
          <UpcomingTasks />
        </div>
      </div>
    </div>
  );
});

CalendarPage.displayName = 'CalendarPage';

export default CalendarPage; 