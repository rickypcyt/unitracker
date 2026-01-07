import { memo, useEffect, useState } from 'react';

import AllTasks from '@/pages/calendar/AllTasks';
import Calendar from '@/pages/calendar/Calendar';
import { Task } from '@/types/taskStorage';
import TaskFilter from '@/pages/calendar/TaskFilter';
import { useAppStore } from '@/store/appStore';
import useDemoMode from '@/utils/useDemoMode';
import { useLocation } from 'react-router-dom';

const CalendarPage = memo(() => {
  const location = useLocation();
  const isVisible = location.pathname === '/calendar';
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  
  const realTasks = useAppStore((state) => state.tasks.tasks);
  const { isDemo, demoTasks } = useDemoMode();
  const tasks = isDemo ? demoTasks : realTasks;

  // Update calendar when the page becomes visible
  useEffect(() => {
    if (isVisible) {
      window.dispatchEvent(new CustomEvent('refreshCalendar'));
    }
  }, [isVisible]);

  // Initialize filtered tasks with all tasks
  useEffect(() => {
    setFilteredTasks(tasks);
  }, [tasks]);

  return (
    <div className="w-full session-page mt-2 sm:mt-4">
      <div className="w-full flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] md:px-4">
        <div className="order-1 md:order-1 lg:order-1 md:px-2 flex-1">
          <AllTasks filteredTasks={filteredTasks} />
        </div>
        <div className="w-full order-2 md:order-2 lg:order-2 md:px-2 flex justify-center">
          <div className="w-full max-w-[800px]">
            <Calendar />
          </div>
        </div>
        <div className="order-3 md:order-3 lg:order-3 md:px-2 flex-1">
          <TaskFilter tasks={tasks} onFilteredTasksChange={setFilteredTasks} />
        </div>
      </div>
    </div>
  );
});

CalendarPage.displayName = 'CalendarPage';

export default CalendarPage;