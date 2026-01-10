import "./mobile-calendar.css";

import { handleDateDoubleClick, handleTouchEnd } from "./utils/calendarUtils";

import CalendarHeader from "./components/CalendarHeader";
import DayInfoModal from "./DayInfoModal";
import DayView from "./components/DayView";
import LoginPromptModal from "@/modals/LoginPromptModal";
import MonthView from "./components/MonthView";
import TaskForm from "@/pages/tasks/TaskForm";
import WeekView from "./components/WeekView";
import { useAuth } from "@/hooks/useAuth";
import { useCalendarData } from "./hooks/useCalendarData";
import { useCalendarKeyboard } from "./hooks/useCalendarKeyboard";
import { useCalendarNavigation } from "./hooks/useCalendarNavigation";
import { useCalendarState } from "./hooks/useCalendarState";

export interface TooltipContent {
  date: Date;
  tasks: any[];
}

interface CalendarProps {
  view?: 'month' | 'week' | 'day';
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
  onTooltipShow?: (content: TooltipContent | null) => void;
}

type ViewType = 'month' | 'week' | 'day';

const Calendar = ({ view = 'month' as ViewType, onViewChange, onTooltipShow }: CalendarProps) => {
  const { isLoggedIn } = useAuth();

  // State management
  const {
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate,
    focusedDate,
    setFocusedDate,
    showTaskForm,
    setShowTaskForm,
    isLoginPromptOpen,
    setIsLoginPromptOpen,
    isInfoModalOpen,
    setIsInfoModalOpen,
    lastTap,
    setLastTap,
  } = useCalendarState();

  // Data management
  const {
    getTasksForDate,
    getStudiedHoursForDate,
    hasTasksWithDeadline,
    getTasksWithDeadline,
    getTasksForDayAndHour,
    calendarDays,
  } = useCalendarData({ currentDate, selectedDate });

  // Navigation functions
  const {
    goToPreviousMonth,
    goToNextMonth,
    goToPreviousWeek,
    goToNextWeek,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    handleDateClick,
  } = useCalendarNavigation({
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate,
    focusedDate,
    setFocusedDate,
  });

  // Keyboard navigation
  useCalendarKeyboard({
    focusedDate,
    currentDate,
    setFocusedDate,
    setSelectedDate,
    setCurrentDate,
    handleDateDoubleClick: (date) => handleDateDoubleClick(
      date,
      isLoggedIn,
      setSelectedDate,
      setIsLoginPromptOpen,
      setShowTaskForm,
      setIsInfoModalOpen
    ),
  });

  const setTooltipContent = (content: TooltipContent | null) => {
    onTooltipShow?.(content);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div
        className={`maincard p-0 pt-4 relative w-full transition-all duration-300 calendar-view flex flex-col ${
          view === 'month' ? 'min-h-[600px] lg:min-h-[650px] overflow-hidden' : 'flex-1 min-h-0 lg:min-h-[500px]'
        }`}
      >
        {/* Calendar Header with navigation and view switcher */}
        <CalendarHeader
          view={view}
          currentDate={currentDate}
          selectedDate={selectedDate}
          onViewChange={onViewChange || (() => {})}
          goToPreviousMonth={goToPreviousMonth}
          goToNextMonth={goToNextMonth}
          goToPreviousWeek={goToPreviousWeek}
          goToNextWeek={goToNextWeek}
          goToPreviousDay={goToPreviousDay}
          goToNextDay={goToNextDay}
          goToToday={goToToday}
        />

        {/* View Content */}
        <div className={`flex-1 min-h-0 relative ${view === 'month' ? 'overflow-hidden' : ''}`}>
          {view === 'week' ? (
            <WeekView
              currentDate={currentDate}
              selectedDate={selectedDate}
              isLoggedIn={isLoggedIn}
              getTasksForDayAndHour={getTasksForDayAndHour}
              getTasksWithDeadline={getTasksWithDeadline}
              setSelectedDate={setSelectedDate}
              setFocusedDate={setFocusedDate}
              setShowTaskForm={setShowTaskForm}
              setIsLoginPromptOpen={setIsLoginPromptOpen}
              setIsInfoModalOpen={setIsInfoModalOpen}
              setTooltipContent={setTooltipContent}
            />
          ) : view === 'day' ? (
            <DayView
              selectedDate={selectedDate}
              isLoggedIn={isLoggedIn}
              getTasksForDayAndHour={getTasksForDayAndHour}
              setSelectedDate={setSelectedDate}
              setShowTaskForm={setShowTaskForm}
              setIsLoginPromptOpen={setIsLoginPromptOpen}
            />
          ) : (
            <MonthView
              calendarDays={calendarDays}
              hasTasksWithDeadline={hasTasksWithDeadline}
              getTasksWithDeadline={getTasksWithDeadline}
              getStudiedHoursForDate={getStudiedHoursForDate}
              handleDateClick={handleDateClick}
              handleDateDoubleClick={(date) => handleDateDoubleClick(
                date,
                isLoggedIn,
                setSelectedDate,
                setIsLoginPromptOpen,
                setShowTaskForm,
                setIsInfoModalOpen
              )}
              handleTouchEnd={(e, date) => handleTouchEnd(e, date, lastTap, setLastTap, (date) => handleDateDoubleClick(
                date,
                isLoggedIn,
                setSelectedDate,
                setIsLoginPromptOpen,
                setShowTaskForm,
                setIsInfoModalOpen
              ))}
              setTooltipContent={setTooltipContent}
            />
          )}
        </div>

        {/* Modals */}
        {showTaskForm && (
          <TaskForm
            initialAssignment=""
            initialDeadline={selectedDate}
            onClose={() => setShowTaskForm(false)}
            onTaskCreated={(newTaskId: string) => {
              if (newTaskId)
                window.dispatchEvent(new CustomEvent("refreshTaskList"));
            }}
          />
        )}
        <DayInfoModal
          isOpen={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          date={selectedDate}
          tasks={getTasksForDate(selectedDate)}
          studiedHours={getStudiedHoursForDate(selectedDate)}
        />
        <LoginPromptModal
          isOpen={isLoginPromptOpen}
          onClose={() => setIsLoginPromptOpen(false)}
        />
      </div>
    </div>
  );
};

export default Calendar;
