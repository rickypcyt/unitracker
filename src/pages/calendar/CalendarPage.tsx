import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore, useWorkspace } from '@/store/appStore';

import { ALL_WORKSPACE_ID } from '@/hooks/useTaskBoard';
import AllTasks from '@/pages/calendar/AllTasks';
import Calendar, { } from '@/pages/calendar/Calendar';
import { Helmet } from 'react-helmet-async';
import { RecurringTasksProvider } from '@/pages/calendar/RecurringTasksContext';
import { Task } from '@/types/taskStorage';
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
  const { currentWorkspace: activeWorkspace } = useWorkspace();

  const isVisible = location.pathname === '/calendar';
  
  // Filter tasks based on active workspace
  const tasks = useMemo(() => {
    const allTasks = isDemo ? demoTasks : realTasks;
    
    // If "All" workspace is selected or no workspace, show all tasks
    if (!activeWorkspace || activeWorkspace.id === ALL_WORKSPACE_ID) {
      return allTasks;
    }
    
    // Filter tasks by workspace
    return allTasks.filter(task => task.workspace_id === activeWorkspace.id);
  }, [isDemo, demoTasks, realTasks, activeWorkspace]);

  // State
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>(() => {
  const savedFilter = localStorage.getItem(STORAGE_KEYS.FILTER);
  return savedFilter && Object.keys(FILTER_LABELS).includes(savedFilter)
    ? savedFilter
    : 'all';
});
  const [taskSortBy, setTaskSortBy] = useState<'name-asc' | 'name-desc' | 'count-asc' | 'count-desc'>('count-desc');

  // View and calendar type with localStorage persistence
  const [view, setView] = useState<'month' | 'week' | 'day'>(() => {
    const savedView = localStorage.getItem(STORAGE_KEYS.VIEW);
    return savedView && ['month', 'week', 'day'].includes(savedView)
      ? (savedView as 'month' | 'week' | 'day')
      : 'month';
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


  // Render calendar content
  const renderCalendarContent = () => {
    return (
      <div className="w-full flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-4 flex-1">
          {/* Left Column - All Tasks and Filter (Desktop) */}
          <div className="hidden lg:flex flex-col gap-4 w-80 flex-shrink-0">
            <AllTasks 
              filteredTasks={filteredTasks} 
              title={getFilterLabel(selectedFilter)}
              showCompleted={false}
              sortBy={taskSortBy}
              hideSortMenu={false}
              allTasks={tasks}
              onFilteredTasksChange={setFilteredTasks}
              selectedFilter={selectedFilter}
              onFilterChange={handleFilterChange}
              onSortChange={setTaskSortBy}
            />
          </div>

          {/* Calendar Panel */}
          <div className="flex-1 min-w-0">
            <div className="w-full h-full">
              <Calendar 
                view={view} 
                onViewChange={handleViewChange}
                tasks={tasks}
              />
            </div>
          </div>
        </div>

        {/* Mobile Filter and All Tasks - Below Calendar */}
        <div className="lg:hidden w-full space-y-4">
          <AllTasks 
            filteredTasks={filteredTasks} 
            title={getFilterLabel(selectedFilter)}
            showCompleted={false}
            sortBy={taskSortBy}
            hideSortMenu={false}
            allTasks={tasks}
            onFilteredTasksChange={setFilteredTasks}
            selectedFilter={selectedFilter}
            onFilterChange={handleFilterChange}
            onSortChange={setTaskSortBy}
          />
        </div>
      </div>
    );
  };

  return (
    <RecurringTasksProvider>
      <Helmet>
        <title>UniTracker Calendar | UniTracker 2026</title>
        <meta
          name="description"
          content="Academic calendar for students. Plan assignments, track deadlines, and manage your study schedule with our interactive calendar."
        />
        <meta
          name="keywords"
          content="academic calendar, study planner, assignment deadlines, schedule management, student calendar, deadline tracker"
        />
        <meta property="og:title" content="Calendar & Schedule Management | UniTracker 2026" />
        <meta
          property="og:description"
          content="Academic calendar for students. Plan assignments, track deadlines, and manage your study schedule with our interactive calendar."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://unitracker.me/calendar" />
        <link rel="canonical" href="https://unitracker.me/calendar" />
      </Helmet>
      
      <div className="w-full px-1 sm:px-2 md:px-2 lg:px-4 session-page mt-2 sm:mt-4">
        {renderCalendarContent()}
      </div>
    </RecurringTasksProvider>
  );
});

CalendarPage.displayName = 'CalendarPage';

export default CalendarPage;