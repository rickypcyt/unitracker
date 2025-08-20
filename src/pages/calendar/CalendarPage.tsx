import { memo, useEffect } from 'react';

import Calendar from '@/pages/calendar/Calendar';
import UpcomingTasks from '@/pages/calendar/UpcomingTasks';
import PastTasks from '@/pages/calendar/PastTasks';
import { useLocation } from 'react-router-dom';

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
    <div className="w-full px-2 pt-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="w-full md:max-w-2xl lg:max-w-4xl mx-auto">
          <Calendar />
        </div>
        <div className="w-full md:max-w-2xl lg:max-w-4xl mx-auto">
          <UpcomingTasks />
          <PastTasks />
        </div>
      </div>
    </div>
  );
});

CalendarPage.displayName = 'CalendarPage';

export default CalendarPage; 