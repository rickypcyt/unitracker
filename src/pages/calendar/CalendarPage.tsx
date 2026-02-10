import { memo, useCallback, useEffect, useState } from 'react';

import AllTasks from '@/pages/calendar/AllTasks';
import Calendar, { } from '@/pages/calendar/Calendar';
import DayFlowCalendarComponent from '@/pages/calendar/DayFlowCalendar';
import { Helmet } from 'react-helmet-async';
import { Task } from '@/types/taskStorage';
import TaskFilter from '@/pages/calendar/TaskFilter';
import { useAppStore } from '@/store/appStore';
import useDemoMode from '@/utils/useDemoMode';
import { useLocation } from 'react-router-dom';

// Constants for localStorage keys
const STORAGE_KEYS = {
  VIEW: 'calendar-view',
  TYPE: 'calendar-type',
  FILTER: 'calendar-filter',
} as const;

// Filter options mapping
const FILTER_LABELS: Record<string, string> = {
  all: 'All Tasks',
  today: 'Today',
  thisweek: 'This Week',
  thismonth: 'This Month',
  nextmonth: 'Next Month',
  overdue: 'Overdue',
  nodeadline: 'No Deadline',
} as const;

const CalendarPage = memo(() => {
  const location = useLocation();
  const { isDemo, demoTasks } = useDemoMode();
  const realTasks = useAppStore((state) => state.tasks.tasks);

  const isVisible = location.pathname === '/calendar';
  const tasks = isDemo ? demoTasks : realTasks;

  // State
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>(() => {
  const savedFilter = localStorage.getItem(STORAGE_KEYS.FILTER);
  return savedFilter && Object.keys(FILTER_LABELS).includes(savedFilter)
    ? savedFilter
    : 'all';
});

  // View and calendar type with localStorage persistence
  const [view, setView] = useState<'month' | 'week' | 'day'>(() => {
    const savedView = localStorage.getItem(STORAGE_KEYS.VIEW);
    return savedView && ['month', 'week', 'day'].includes(savedView)
      ? (savedView as 'month' | 'week' | 'day')
      : 'month';
  });

  const [calendarType, setCalendarType] = useState<'original' | 'dayflow'>(() => {
    const savedType = localStorage.getItem(STORAGE_KEYS.TYPE);
    return savedType && ['original', 'dayflow'].includes(savedType)
      ? (savedType as 'original' | 'dayflow')
      : 'original';
  });

  // Handlers
  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    localStorage.setItem('calendarFilter', filter);
  };

  const handleViewChange = useCallback((newView: 'month' | 'week' | 'day') => {
    setView(newView);
    localStorage.setItem(STORAGE_KEYS.VIEW, newView);
  }, []);

  const handleCalendarTypeChange = useCallback((newType: 'original' | 'dayflow') => {
    setCalendarType(newType);
    localStorage.setItem(STORAGE_KEYS.TYPE, newType);
  }, []);

  const getFilterLabel = (filter: string) => FILTER_LABELS[filter] || 'All Tasks';

  // Filter tasks based on selected filter
  const filterTasks = useCallback((tasksList: Task[], filter: string): Task[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return tasksList.filter(task => {
      if (!task.deadline) {
        return filter === 'all' || filter === 'nodeadline';
      }

      const taskDeadline = new Date(task.deadline);

      switch (filter) {
        case 'all':
          // Show ALL tasks including completed ones
          return true;
        case 'today':
          return taskDeadline.toDateString() === today.toDateString();
        case 'thisweek': {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 7);
          return taskDeadline >= startOfWeek && taskDeadline < endOfWeek;
        }
        case 'thismonth':
          return taskDeadline.getMonth() === today.getMonth() &&
                 taskDeadline.getFullYear() === today.getFullYear();
        case 'nextmonth': {
          const nextMonth = today.getMonth() === 11 ? 0 : today.getMonth() + 1;
          const nextMonthYear = today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear();
          return taskDeadline.getMonth() === nextMonth &&
                 taskDeadline.getFullYear() === nextMonthYear;
        }
        case 'overdue':
          return taskDeadline < today;
        case 'nodeadline':
          return !task.deadline || task.deadline === '';
        default:
          return true;
      }
    });
  }, []);

  // Effects
  // Initialize filtered tasks
  useEffect(() => {
    setFilteredTasks(tasks);
  }, [tasks]);

  // Apply filter when selectedFilter or tasks change
  useEffect(() => {
    const filtered = filterTasks(tasks, selectedFilter);
    setFilteredTasks(filtered);
  }, [selectedFilter, tasks, filterTasks]);

  // Refresh calendar when page becomes visible
  useEffect(() => {
    if (isVisible) {
      window.dispatchEvent(new CustomEvent('refreshCalendar'));
    }
  }, [isVisible]);


  // Render calendar based on type
  const renderCalendarContent = () => {
    if (calendarType === 'dayflow') {
      return (
        <div className="w-full min-h-[calc(100vh-10rem)] lg:min-h-[calc(100vh-8rem)]">
          <DayFlowCalendarComponent />
        </div>
      );
    }

    return (
      <div className="w-full flex flex-col gap-4 min-h-[calc(100vh-10rem)] lg:min-h-[calc(100vh-8rem)]">
        <div className="flex flex-col lg:flex-row gap-4 flex-1 mb-6">
          {/* Left Column - All Tasks and Filter (Desktop) */}
          <div className="hidden lg:flex flex-col gap-4 w-80 flex-shrink-0">
            {/* Filter Dropdown */}
            <div className="w-full">
              <TaskFilter 
                tasks={tasks} 
                onFilteredTasksChange={setFilteredTasks}
                selectedFilter={selectedFilter}
                onFilterChange={handleFilterChange}
              />
            </div>
            
            {/* All Tasks */}
            <div className="flex-1 min-h-0">
              <AllTasks 
                filteredTasks={filteredTasks} 
                title={getFilterLabel(selectedFilter)}
                showCompleted={false}
              />
            </div>
          </div>

          {/* Calendar Panel */}
          <div className="flex-1 min-w-0">
            <div className="w-full">
              <Calendar 
                view={view} 
                onViewChange={handleViewChange} 
              />
            </div>
          </div>
        </div>

        {/* Mobile Filter and All Tasks - Below Calendar */}
        <div className="lg:hidden w-full space-y-4">
          {/* Filter Dropdown - Mobile */}
          <div className="w-full">
            <TaskFilter 
              tasks={tasks} 
              onFilteredTasksChange={setFilteredTasks}
              selectedFilter={selectedFilter}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Mobile All Tasks */}
          <div className="w-full h-96 overflow-hidden">
            <AllTasks 
              filteredTasks={filteredTasks} 
              title={getFilterLabel(selectedFilter)}
              showCompleted={false}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>
          {calendarType === 'dayflow' 
            ? 'DayFlow Calendar | Uni Tracker 2026' 
            : 'UniTracker Calendar | Uni Tracker 2026'
          }
        </title>
        <meta
          name="description"
          content="Academic calendar for students. Plan assignments, track deadlines, and manage your study schedule with our interactive calendar."
        />
        <meta
          name="keywords"
          content="academic calendar, study planner, assignment deadlines, schedule management, student calendar, deadline tracker"
        />
        <meta property="og:title" content={`Calendar & Schedule Management | Uni Tracker 2026 - ${calendarType === 'dayflow' ? 'DayFlow' : 'UniTracker'} Calendar`} />
        <meta
          property="og:description"
          content="Academic calendar for students. Plan assignments, track deadlines, and manage your study schedule with our interactive calendar."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://uni-tracker.vercel.app/calendar" />
        <link rel="canonical" href="https://uni-tracker.vercel.app/calendar" />
      </Helmet>
      
      <div className="w-full px-1 sm:px-2 md:px-2 lg:px-4 session-page mt-2 sm:mt-4">
        {/* Calendar Type Switcher */}
        <div className="flex justify-center mb-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-1 flex gap-1">
            <button
              onClick={() => handleCalendarTypeChange('original')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                calendarType === 'original'
                  ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              UniTracker Calendar
            </button>
            <button
              onClick={() => handleCalendarTypeChange('dayflow')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                calendarType === 'dayflow'
                  ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              DayFlow Calendar
            </button>
          </div>
        </div>
        
        {renderCalendarContent()}
      </div>
    </>
  );
});

CalendarPage.displayName = 'CalendarPage';

export default CalendarPage;