import "./mobile-calendar.css";
import { handleDateDoubleClick, handleTouchEnd } from "./utils/calendarUtils";
import CalendarHeader from "./components/CalendarHeader";
import DayContextMenu from "./components/DayContextMenu";
import DayView from "./components/DayView";
import LoginPromptModal from "@/modals/LoginPromptModal";
import MonthView from "./components/MonthView";
import type { Task } from "@/types/taskStorage";
import TaskForm from "@/pages/tasks/TaskForm";
import TaskViewModal from "@/modals/TaskViewModal";
import WeekView from "./components/WeekView";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useCalendarData } from "./hooks/useCalendarData";
import { useCalendarKeyboard } from "./hooks/useCalendarKeyboard";
import { useCalendarNavigation } from "./hooks/useCalendarNavigation";
import { useCalendarState } from "./hooks/useCalendarState";
import { useDeleteTaskSuccess } from "@/store/appStore";
interface CalendarProps {
  view?: 'month' | 'week' | 'day';
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
  tasks?: Task[]; // Optional filtered tasks
}
type ViewType = 'month' | 'week' | 'day';
const Calendar = ({
  view = 'month' as ViewType,
  onViewChange,
  tasks: filteredTasks
}: CalendarProps) => {
  const {
    isLoggedIn
  } = useAuth();

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
    lastTap,
    setLastTap,
    selectedTask,
    setSelectedTask,
    viewingTask,
    setViewingTask
  } = useCalendarState();

  // Data management
  const {
    getTasksForDayAndHour,
    getTasksWithDeadline,
    getStudiedHoursForDate,
    hasTasksWithDeadline,
    calendarDays
  } = useCalendarData({
    currentDate,
    selectedDate,
    ...(filteredTasks && {
      tasks: filteredTasks
    })
  });

  // Navigation functions
  const {
    goToPreviousMonth,
    goToNextMonth,
    goToPreviousWeek,
    goToNextWeek,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    handleDateClick
  } = useCalendarNavigation({
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate,
    focusedDate,
    setFocusedDate
  });

  // Keyboard navigation
  useCalendarKeyboard({
    focusedDate,
    currentDate,
    setFocusedDate,
    setSelectedDate,
    setCurrentDate,
    handleDateDoubleClick: date => handleDateDoubleClick(date, isLoggedIn, setSelectedDate, setIsLoginPromptOpen, setShowTaskForm)
  });
  const handleEditTask = (task: Task) => {
    setViewingTask(null);
    setSelectedTask(task);
    setShowTaskForm(true);
  };

  // Right-click context menu on days / time slots
  const [dayContextMenu, setDayContextMenu] = useState<{
    x: number;
    y: number;
    date: Date;
    hour?: number;
  } | null>(null);

  const openDayContextMenu = (e: React.MouseEvent, date: Date, hour?: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDayContextMenu({ x: e.clientX, y: e.clientY, date: new Date(date), hour });
  };

  const handleCreateEvent = () => {
    if (!dayContextMenu) return;
    const { date, hour } = dayContextMenu;
    setDayContextMenu(null);
    setSelectedTask(null);
    if (hour === undefined) {
      handleDateDoubleClick(new Date(date), isLoggedIn, setSelectedDate, setIsLoginPromptOpen, setShowTaskForm);
      return;
    }
    if (!isLoggedIn) return setIsLoginPromptOpen(true);
    const newDate = new Date(date);
    newDate.setHours(hour, 0, 0, 0);
    setSelectedDate(newDate);
    setFocusedDate(newDate);
    sessionStorage.setItem('calendarTaskHour', hour.toString());
    setShowTaskForm(true);
  };

  const isPastMenuDay = (() => {
    if (!dayContextMenu || dayContextMenu.hour !== undefined) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const menuDay = new Date(dayContextMenu.date);
    menuDay.setHours(0, 0, 0, 0);
    return menuDay < today;
  })();
  const deleteTaskSuccess = useDeleteTaskSuccess();
  const handleDeleteTask = (task: Task) => {
    // Eliminar la tarea del estado local inmediatamente
    deleteTaskSuccess(task.id);

    // Cerrar el modal
    setViewingTask(null);

    // TODO: También eliminar de la base de datos si es necesario
    // Por ahora, solo eliminamos del estado local
  };
  return <div className="w-full h-full flex flex-col">
      <div className={`maincard p-0 pt-4 relative w-full transition-all duration-300 calendar-view flex flex-col h-full ${view === 'month' ? '' : 'flex-1'}`}>
        {/* Calendar Header with navigation and view switcher */}
        <CalendarHeader view={view} currentDate={currentDate} selectedDate={selectedDate} onViewChange={onViewChange || (() => {})} goToPreviousMonth={goToPreviousMonth} goToNextMonth={goToNextMonth} goToPreviousWeek={goToPreviousWeek} goToNextWeek={goToNextWeek} goToPreviousDay={goToPreviousDay} goToNextDay={goToNextDay} goToToday={goToToday} tasks={filteredTasks || []} />

        {/* View Content */}
        <div className={`flex-1 relative ${view === 'month' ? '' : ''}`}>
          {view === 'week' ? <WeekView currentDate={currentDate} isLoggedIn={isLoggedIn} getTasksWithDeadline={getTasksWithDeadline} setSelectedDate={setSelectedDate} setFocusedDate={setFocusedDate} setShowTaskForm={setShowTaskForm} setIsLoginPromptOpen={setIsLoginPromptOpen} setSelectedTask={setSelectedTask} setViewingTask={setViewingTask} handleEditTask={handleEditTask} onDayContextMenu={openDayContextMenu} onTaskContextMenu={(e, task) => {
          e.preventDefault();
          // Context menu logic here - for now just show task details
          setViewingTask(task);
        }} /> : view === 'day' ? <DayView selectedDate={selectedDate} isLoggedIn={isLoggedIn} getTasksForDayAndHour={getTasksForDayAndHour} setSelectedDate={setSelectedDate} setShowTaskForm={setShowTaskForm} setIsLoginPromptOpen={setIsLoginPromptOpen} onDayContextMenu={openDayContextMenu} /> : <MonthView calendarDays={calendarDays} hasTasksWithDeadline={hasTasksWithDeadline} getTasksWithDeadline={getTasksWithDeadline} getStudiedHoursForDate={getStudiedHoursForDate} handleDateClick={handleDateClick} handleDateDoubleClick={date => handleDateDoubleClick(date, isLoggedIn, setSelectedDate, setIsLoginPromptOpen, setShowTaskForm)} handleTouchEnd={(e, date) => handleTouchEnd(e, date, lastTap, setLastTap, date => handleDateDoubleClick(date, isLoggedIn, setSelectedDate, setIsLoginPromptOpen, setShowTaskForm))} onDayContextMenu={openDayContextMenu} />}
        </div>

        {/* Modals */}
        {showTaskForm && <TaskForm initialTask={selectedTask} initialAssignment="" initialDeadline={selectedDate} onClose={() => {
        setShowTaskForm(false);
        setSelectedTask(null);
      }} onTaskCreated={(newTaskId: string) => {
        if (newTaskId) window.dispatchEvent(new CustomEvent("refreshTaskList"));
        setShowTaskForm(false);
        setSelectedTask(null);
      }} />}
        <LoginPromptModal isOpen={isLoginPromptOpen} onClose={() => setIsLoginPromptOpen(false)} />
        {/* Day context menu (right-click) */}
        {dayContextMenu && <DayContextMenu x={dayContextMenu.x} y={dayContextMenu.y} date={dayContextMenu.date} hour={dayContextMenu.hour} disabled={isPastMenuDay} onClose={() => setDayContextMenu(null)} onCreateEvent={handleCreateEvent} />}
        {/* Task View Modal */}
        {viewingTask && <TaskViewModal isOpen={!!viewingTask} onClose={() => setViewingTask(null)} task={{ ...viewingTask, deadline: viewingTask.deadline ?? undefined, due_date: viewingTask.due_date ?? undefined }} onEdit={handleEditTask} onDelete={handleDeleteTask} />}
      </div>
    </div>;
};
export default Calendar;