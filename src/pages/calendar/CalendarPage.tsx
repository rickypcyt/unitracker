import { memo, useEffect, useState } from 'react';

import AllTasks from '@/pages/calendar/AllTasks';
import Calendar from '@/pages/calendar/Calendar';
import { useLocation } from 'react-router-dom';

const CalendarPage = memo(() => {
  const location = useLocation();
  const isVisible = location.pathname === '/calendar';
  const [calendarSize, setCalendarSize] = useState('lg');

  // Update calendar when the page becomes visible
  useEffect(() => {
    if (isVisible) {
      window.dispatchEvent(new CustomEvent('refreshCalendar'));
    }
  }, [isVisible]);

  // Listen for calendar size changes
  useEffect(() => {
    const handleCalendarSizeChange = (e: CustomEvent) => {
      setCalendarSize(e.detail.size);
    };
    
    window.addEventListener('calendarSizeChange', handleCalendarSizeChange as EventListener);
    return () => window.removeEventListener('calendarSizeChange', handleCalendarSizeChange as EventListener);
  }, []);

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 xl:px-16 2xl:px-24 session-page mt-2 sm:mt-4">
      <div className="w-full">
        <Calendar onSizeChange={setCalendarSize} />
      </div>
      <div className="w-full mt-6">
        <AllTasks calendarSize={calendarSize} />
      </div>
    </div>
  );
});

CalendarPage.displayName = 'CalendarPage';

export default CalendarPage;