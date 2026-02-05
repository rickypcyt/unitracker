import "./mobile-calendar.css";

import { handleDateDoubleClick, handleTouchEnd } from "./utils/calendarUtils";

import CalendarHeader from "./components/CalendarHeader";
import DayInfoModal from "./DayInfoModal";
import DayView from "./components/DayView";
import LoginPromptModal from "@/modals/LoginPromptModal";
import MonthView from "./components/MonthView";
import type { Task } from "@/types/taskStorage";
import TaskForm from "@/pages/tasks/TaskForm";
import TaskViewModal from "@/modals/TaskViewModal";
import WeekView from "./components/WeekView";
import { useAuth } from "@/hooks/useAuth";
import { useCalendarData } from "./hooks/useCalendarData";
import { useCalendarKeyboard } from "./hooks/useCalendarKeyboard";
import { useCalendarNavigation } from "./hooks/useCalendarNavigation";
import { useCalendarState } from "./hooks/useCalendarState";
import { useDeleteTaskSuccess } from "@/store/appStore";

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
    selectedTask,
    setSelectedTask,
    viewingTask,
    setViewingTask,
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

  const handleEditTask = (task: Task) => {
    setViewingTask(null);
    setSelectedTask(task);
    setShowTaskForm(true);
  };

  const deleteTaskSuccess = useDeleteTaskSuccess();

  const handleDeleteTask = (task: Task) => {
    // Eliminar la tarea del estado local inmediatamente
    deleteTaskSuccess(task.id);
    
    // Cerrar el modal
    setViewingTask(null);
    
    // TODO: También eliminar de la base de datos si es necesario
    // Por ahora, solo eliminamos del estado local
    console.log('Task deleted:', task.title);
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
              setSelectedTask={setSelectedTask}
              setViewingTask={setViewingTask}
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
            initialTask={selectedTask}
            initialAssignment=""
            initialDeadline={selectedDate}
            onClose={() => {
              setShowTaskForm(false);
              setSelectedTask(null);
            }}
            onTaskCreated={(newTaskId: string) => {
              if (newTaskId)
                window.dispatchEvent(new CustomEvent("refreshTaskList"));
              setShowTaskForm(false);
              setSelectedTask(null);
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
        {/* Task View Modal */}
        {viewingTask && (
          <TaskViewModal
            isOpen={!!viewingTask}
            onClose={() => setViewingTask(null)}
            task={viewingTask}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
        )}
      </div>
    </div>
  );
};

export default Calendar;
