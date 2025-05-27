import React, { memo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Calendar from '../../components/tools/Calendar';

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
    <div className="container mx-auto px-4 pt-20">
      <div className="max-w-4xl mx-auto">
        <Calendar />
      </div>
    </div>
  );
});

CalendarPage.displayName = 'CalendarPage';

export default CalendarPage; 