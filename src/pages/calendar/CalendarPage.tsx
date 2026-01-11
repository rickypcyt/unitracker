import Calendar, { TooltipContent } from '@/pages/calendar/Calendar';
import { memo, useCallback, useEffect, useState } from 'react';

import AllTasks from '@/pages/calendar/AllTasks';
import { Task } from '@/types/taskStorage';
import TaskFilter from '@/pages/calendar/TaskFilter';
import { formatDate } from '@/utils/dateUtils';
import { useAppStore } from '@/store/appStore';
import useDemoMode from '@/utils/useDemoMode';
import { useLocation } from 'react-router-dom';

const CalendarPage = memo(() => {
  const location = useLocation();
  const isVisible = location.pathname === '/calendar';
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  
  // Load view from localStorage or default to 'month'
  const [view, setView] = useState<'month' | 'week' | 'day'>(() => {
    const savedView = localStorage.getItem('calendar-view') as 'month' | 'week' | 'day' | null;
    return savedView && ['month', 'week', 'day'].includes(savedView) ? savedView : 'month';
  });
  
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [tooltipContent, setTooltipContent] = useState<TooltipContent | null>(null);
  
  const realTasks = useAppStore((state) => state.tasks.tasks);
  const { isDemo, demoTasks } = useDemoMode();
  const tasks = isDemo ? demoTasks : realTasks;

  const handleTooltipShow = useCallback((content: TooltipContent | null) => {
    setTooltipContent(content);
  }, []);

  // Initialize filtered tasks with all tasks
  useEffect(() => {
    setFilteredTasks(tasks);
  }, [tasks]);

  // Update filtered tasks when filter changes
  useEffect(() => {
    const filtered = tasks.filter(task => {
      switch (selectedFilter) {
        case 'all': return true;
        case 'today':
          if (!task.deadline) return false;
          const taskDeadlineToday = new Date(task.deadline);
          return taskDeadlineToday.toDateString() === new Date().toDateString();
        case 'thisweek':
          if (!task.deadline) return false;
          const taskDeadlineWeek = new Date(task.deadline);
          const today = new Date();
          const weekFromNow = new Date(today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)));
          return taskDeadlineWeek >= weekFromNow && taskDeadlineWeek < new Date(weekFromNow.getTime() + 7 * 24 * 60 * 60 * 1000);
        case 'thismonth':
          if (!task.deadline) return false;
          const taskDeadlineMonth = new Date(task.deadline);
          return taskDeadlineMonth.getMonth() === new Date().getMonth() && taskDeadlineMonth.getFullYear() === new Date().getFullYear();
        case 'nextmonth':
          if (!task.deadline) return false;
          const taskDeadlineNextMonth = new Date(task.deadline);
          const nextMonth = new Date().getMonth() === 11 ? 0 : new Date().getMonth() + 1;
          return taskDeadlineNextMonth.getMonth() === nextMonth && taskDeadlineNextMonth.getFullYear() === new Date().getFullYear();
        case 'overdue':
          if (!task.deadline) return false;
          const taskDeadlineOverdue = new Date(task.deadline);
          return taskDeadlineOverdue < new Date();
        case 'nodeadline':
          return !task.deadline || task.deadline === "";
        default:
          return true;
      }
    });
    setFilteredTasks(filtered);
  }, [selectedFilter, tasks]);

  // Update calendar when the page becomes visible
  useEffect(() => {
    if (isVisible) {
      window.dispatchEvent(new CustomEvent('refreshCalendar'));
    }
  }, [isVisible]);

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  const handleViewChange = (newView: 'month' | 'week' | 'day') => {
    setView(newView);
    localStorage.setItem('calendar-view', newView);
  };

  const getFilterLabel = (filter: string) => {
    switch (filter) {
      case 'all': return 'All Tasks';
      case 'today': return 'Today';
      case 'thisweek': return 'This Week';
      case 'thismonth': return 'This Month';
      case 'nextmonth': return 'Next Month';
      case 'overdue': return 'Overdue';
      case 'nodeadline': return 'No Deadline';
      default: return 'All Tasks';
    }
  };

  return (
    <div className="w-full session-page mt-2 sm:mt-4">
      <div className="w-full flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
        <div className="order-1 md:order-1 lg:order-1 md:px-2 flex-1">
          <AllTasks filteredTasks={filteredTasks} title={getFilterLabel(selectedFilter)} />
        </div>
        <div className="w-full order-2 md:order-2 lg:order-2 md:px-2 flex justify-center">
          <div className="w-full max-w-auto">
            <Calendar view={view} onViewChange={handleViewChange} onTooltipShow={handleTooltipShow} />
          </div>
        </div>
        <div className="order-3 md:order-3 lg:order-3 md:px-2 flex-1">
          <TaskFilter 
            tasks={tasks} 
            onFilteredTasksChange={setFilteredTasks}
            selectedFilter={selectedFilter}
            onFilterChange={handleFilterChange}
          />
          {tooltipContent && (
            <div className="-mt-44 mb-2 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] text-[var(--text-primary)] rounded-lg shadow-xl transition-all duration-200">
              <div className="px-3 py-2 border-b border-[var(--border-primary)]">
                <div className="text-sm font-semibold text-[var(--accent-primary)] text-center">
                  {formatDate(tooltipContent.date.toISOString())}
                </div>
                <div className="text-xs text-[var(--text-secondary)] text-center mt-1">
                  {tooltipContent.tasks.length} task{tooltipContent.tasks.length !== 1 ? 's' : ''} due
                </div>
              </div>
              <div className="p-2 max-h-[200px] overflow-y-auto">
                {tooltipContent.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-[var(--bg-secondary)] transition-colors group"
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        task.completed
                          ? "bg-green-500"
                          : "bg-[var(--accent-primary)]"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-medium break-words ${
                          task.completed
                            ? "line-through text-[var(--text-secondary)]"
                            : "text-[var(--text-primary)]"
                        }`}
                      >
                        {task.title}
                      </div>
                      {task.assignment && (
                        <div className="text-xs text-[var(--text-secondary)] break-words">
                          {task.assignment}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity">
                      {task.completed ? "✓" : "○"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

CalendarPage.displayName = 'CalendarPage';

export default CalendarPage;