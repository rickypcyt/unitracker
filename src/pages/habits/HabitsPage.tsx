import { memo, useEffect, useState } from 'react';
import { Helmet } from "react-helmet-async";

import { Habit } from '../../types/common';
import HabitCreateModal from '../../modals/HabitCreateModal';
import HabitEditModal from '../../modals/HabitEditModal';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';
import { useAuth } from '../../hooks/useAuth';
import { useCalendarData } from '../calendar/hooks/useCalendarData';
import { useHabits } from '../../hooks/useHabits';

const HabitsPage = memo(() => {
  const { isLoggedIn } = useAuth();
  const currentDate = new Date(); // Use current date directly instead of state
  const { getTasksWithDeadline } = useCalendarData({
    currentDate,
    selectedDate: currentDate,
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [pendingNoteSaves, setPendingNoteSaves] = useState<Record<string, string>>({}); // Track pending saves
  const [tooltipContent, setTooltipContent] = useState<{ date: Date; tasks: any[] } | null>(null);
  const [showPastDays, setShowPastDays] = useState(() => {
    // Load from localStorage with default false
    const saved = localStorage.getItem('habits-show-past-days');
    return saved ? JSON.parse(saved) : false;
  });

  const {
    habits,
    journalNotes,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    saveJournalNote
  } = useHabits();

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Next month calculations
  const nextMonthDate = new Date(currentYear, currentMonth + 1);
  const nextMonth = nextMonthDate.getMonth();
  const nextMonthYear = nextMonthDate.getFullYear();
  const daysInNextMonth = new Date(nextMonthYear, nextMonth + 1, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
  const isNextMonth = today.getMonth() === nextMonth && today.getFullYear() === nextMonthYear;
  const todayDay = isCurrentMonth ? today.getDate() : (isNextMonth ? today.getDate() : null);


  const handleNoteChange = (day: number, note: string) => {
    const date = new Date(currentYear, currentMonth, day);
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    // Update pending saves
    setPendingNoteSaves(prev => ({
      ...prev,
      [dateString]: note
    }));
  };

  const handleNoteKeyDown = async (day: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Save immediately on Enter
      const date = new Date(currentYear, currentMonth, day);
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const noteValue = (e.target as HTMLInputElement).value;

      // Remove from pending saves and save immediately
      setPendingNoteSaves(prev => {
        const newPending = { ...prev };
        delete newPending[dateString];
        return newPending;
      });

      await saveJournalNote(date, noteValue);
    }
  };

  const handleNoteBlur = async (day: number) => {
    // Save when user leaves the input field
    const date = new Date(currentYear, currentMonth, day);
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const noteValue = pendingNoteSaves[dateString] ?? journalNotes[dateString] ?? '';

    // Only save if there are unsaved changes
    if (pendingNoteSaves[dateString] !== undefined) {
      // Remove from pending saves and save
      setPendingNoteSaves(prev => {
        const newPending = { ...prev };
        delete newPending[dateString];
        return newPending;
      });

      await saveJournalNote(date, noteValue);
    }
  };

  const handleToggleHabit = async (habitId: string, day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    await toggleHabitCompletion(habitId, date);
  };

  const handleStartEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsEditModalOpen(true);
  };

  const handleSaveHabitName = async (habitId: string, newName: string) => {
    const success = await updateHabit(habitId, newName);
    if (success) {
      setIsEditModalOpen(false);
      setEditingHabit(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingHabit(null);
  };

  const handleDeleteHabit = async (habitId: string) => {
    const success = await deleteHabit(habitId);
    if (success) {
      setIsEditModalOpen(false);
      setEditingHabit(null);
    }
  };

  const handleAddHabit = async (habit: { name: string }) => {
    await createHabit(habit.name);
  };

  // Helper functions for any month
  const handleNoteChangeForMonth = (year: number, month: number, day: number, note: string) => {
    const date = new Date(year, month, day);
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    // Update pending saves
    setPendingNoteSaves(prev => ({
      ...prev,
      [dateString]: note
    }));
  };

  const handleNoteKeyDownForMonth = async (year: number, month: number, day: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Save immediately on Enter
      const date = new Date(year, month, day);
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const noteValue = (e.target as HTMLInputElement).value;

      // Remove from pending saves and save immediately
      setPendingNoteSaves(prev => {
        const newPending = { ...prev };
        delete newPending[dateString];
        return newPending;
      });

      await saveJournalNote(date, noteValue);
    }
  };

  const handleNoteBlurForMonth = async (year: number, month: number, day: number) => {
    // Save when user leaves the input field
    const date = new Date(year, month, day);
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const noteValue = pendingNoteSaves[dateString] ?? journalNotes[dateString] ?? '';

    // Only save if there are unsaved changes
    if (pendingNoteSaves[dateString] !== undefined) {
      // Remove from pending saves and save
      setPendingNoteSaves(prev => {
        const newPending = { ...prev };
        delete newPending[dateString];
        return newPending;
      });

      await saveJournalNote(date, noteValue);
    }
  };

  const handleToggleHabitForMonth = async (habitId: string, year: number, month: number, day: number) => {
    const date = new Date(year, month, day);
    await toggleHabitCompletion(habitId, date);
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const nextMonthDays = Array.from({ length: daysInNextMonth }, (_, i) => i + 1);

  // Function to render habits table for a specific month
  const renderHabitsTable = (
    year: number,
    month: number,
    daysArray: number[],
    monthTitle: string,
    showToggle: boolean = true
  ) => {
    const isThisMonthCurrent = today.getMonth() === month && today.getFullYear() === year;
    const todayDayForMonth = isThisMonthCurrent ? today.getDate() : null;

    return (
      <div className="mt-4">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
          {showToggle && (
            <div className="px-4 py-2 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex items-center justify-between">
              <button
                onClick={() => setShowPastDays(!showPastDays)}
                className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors"
              >
                {showPastDays ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showPastDays ? 'Hide past days' : 'Show past days'}
              </button>

              <div className="text-lg font-semibold text-[var(--accent-primary)]">
                {monthTitle}
              </div>

              <div className="w-24"></div> {/* Spacer for balance */}
            </div>
          )}
          {!showToggle && (
            <div className="px-4 py-2 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex items-center justify-center">
              <div className="text-lg font-semibold text-[var(--accent-primary)]">
                {monthTitle}
              </div>
            </div>
          )}
          <div>
            <table className="w-full border-collapse">
              <thead className="bg-[var(--bg-tertiary)] sticky top-0 z-10">
                <tr className="border-b border-[var(--border-primary)]">
                  <th className="px-4 py-3 text-center text-sm font-bold text-[var(--text-primary)] border-r border-[var(--border-primary)] w-16">
                    Day
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[var(--text-primary)] border-r border-[var(--border-primary)] min-w-[200px]">
                    Notes
                  </th>
                  {habits.map(habit => (
                    <th key={`${habit.id}-${year}-${month}`} className="px-2 py-3 text-center text-sm font-bold text-[var(--text-primary)] border-r border-[var(--border-primary)] w-12">
                      <span
                        className="truncate cursor-pointer hover:text-[var(--accent-primary)] transition-colors"
                        title={`Click to edit: ${habit.name}`}
                        onClick={() => handleStartEditHabit(habit)}
                      >
                        {habit.name}
                      </span>
                    </th>
                  ))}
                  <th className="px-2 py-3 text-center text-sm font-bold text-[var(--text-primary)] w-12">
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="p-1 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 transition-colors"
                      title="Add new habit"
                    >
                      <Plus size={16} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {daysArray.filter(day => {
                  if (!isThisMonthCurrent) return true; // Show all days for past/future months
                  if (showPastDays) return true; // Show all days when toggle is on

                  // For current month, show from Sunday of current week onwards
                  if (todayDayForMonth === null) return true;

                  // Calculate Sunday of current week
                  const today = new Date();
                  const sundayOfWeek = new Date(today);
                  sundayOfWeek.setDate(today.getDate() - today.getDay()); // Sunday of current week
                  const sundayDayOfMonth = sundayOfWeek.getDate();

                  return day >= sundayDayOfMonth; // Show from Sunday of current week
                }).map((day, index) => {
                  const isPastDay = isThisMonthCurrent && todayDayForMonth !== null && day < todayDayForMonth;
                  const isFutureDay = isThisMonthCurrent && todayDayForMonth !== null && day > todayDayForMonth;

                  // Calculate if day is before Sunday of current week
                  let isBeforeCurrentWeek = false;
                  if (isThisMonthCurrent && todayDayForMonth !== null) {
                    const today = new Date();
                    const sundayOfWeek = new Date(today);
                    sundayOfWeek.setDate(today.getDate() - today.getDay());
                    const sundayDayOfMonth = sundayOfWeek.getDate();
                    isBeforeCurrentWeek = day < sundayDayOfMonth;
                  }

                  return (
                    <tr
                      key={`${year}-${month}-${day}`}
                      className={`border-b border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] transition-colors ${
                        isBeforeCurrentWeek
                          ? (index % 2 === 0 ? 'bg-[var(--bg-secondary)]' : 'bg-[var(--bg-primary)]')
                          : 'bg-[var(--bg-primary)]'
                      } ${isBeforeCurrentWeek ? 'opacity-75' : ''}`}
                    >
                      {/* Day number column */}
                      <td
                        className="px-4 py-3 text-center border-r border-[var(--border-primary)] relative"
                        onMouseLeave={() => setTooltipContent(null)}
                        onClick={() => setTooltipContent(null)}
                      >
                        <span
                          className={`font-bold text-sm cursor-pointer ${
                            day === todayDayForMonth
                              ? 'text-[var(--accent-primary)]'
                              : isFutureDay
                              ? 'text-white'
                              : 'text-gray-400'
                          }`}
                          onMouseEnter={() => {
                            const date = new Date(year, month, day);
                            const tasks = getTasksWithDeadline(date);
                            if (tasks.length > 0) {
                              setTooltipContent({ date, tasks });
                            }
                          }}
                        >
                          {day}
                        </span>
                        {/* Task indicator */}
                        {(() => {
                          const date = new Date(year, month, day);
                          const tasks = getTasksWithDeadline(date);
                          return tasks.length > 0 && (
                            <div
                              className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-[var(--accent-primary)] opacity-90 z-10 cursor-pointer"
                              onMouseEnter={() => setTooltipContent({ date, tasks })}
                            ></div>
                          );
                        })()}

                        {/* Day name */}
                        <div className="text-xs text-[var(--text-secondary)] mt-1 text-center">
                          {(() => {
                            const date = new Date(year, month, day);
                            return date.toLocaleDateString('en-US', { weekday: 'short' });
                          })()}
                        </div>
                      </td>

                      {/* Notes column */}
                      <td className="px-4 py-3 border-r border-[var(--border-primary)]">
                        <input
                          type="text"
                          value={(pendingNoteSaves[`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`] ?? journalNotes[`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`]) || ''}
                          onChange={(e) => handleNoteChangeForMonth(year, month, day, e.target.value)}
                          onKeyDown={(e) => handleNoteKeyDownForMonth(year, month, day, e)}
                          onBlur={() => handleNoteBlurForMonth(year, month, day)}
                          placeholder="Note..."
                          className="w-full px-3 py-2 bg-transparent border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] text-sm"
                        />
                      </td>

                      {/* Habit columns */}
                      {habits.map(habit => {
                        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isCompleted = habit.completions[dateKey] || false;
                        return (
                          <td key={`${habit.id}-${year}-${month}-${day}`} className="px-2 py-3 text-center border-r border-[var(--border-primary)] w-12">
                            <button
                              onClick={() => handleToggleHabitForMonth(habit.id, year, month, day)}
                              className={`w-6 h-6 rounded-full border-2 transition-colors ${
                                isCompleted
                                  ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]'
                                  : 'border-white hover:border-[var(--accent-primary)]'
                              }`}
                              title={isCompleted ? 'Completed' : 'Not completed'}
                            />
                          </td>
                        );
                      })}

                      {/* Empty cell for the + button column */}
                      <td className="px-2 py-3 text-center w-12"></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Save showPastDays to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('habits-show-past-days', JSON.stringify(showPastDays));
  }, [showPastDays]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setTooltipContent(null);
    };

    if (tooltipContent) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    } else {
      return () => {};
    }
  }, [tooltipContent]);

  // Save pending notes when component unmounts
  useEffect(() => {
    return () => {
      // Process any pending saves on unmount
      if (Object.keys(pendingNoteSaves).length > 0) {
        const savesToProcess = { ...pendingNoteSaves };
        // Process synchronously since component is unmounting
        Object.entries(savesToProcess).forEach(async ([dateKey, noteText]) => {
          const dateParts = dateKey.split('-').map(Number);
          const year = dateParts[0];
          const month = dateParts[1];
          const day = dateParts[2];
          if (year !== undefined && month !== undefined && day !== undefined &&
              !isNaN(year) && !isNaN(month) && !isNaN(day)) {
            const saveDate = new Date(year, month - 1, day);
            try {
              await saveJournalNote(saveDate, noteText);
            } catch (error) {
              console.error('Error saving note on unmount:', error);
            }
          }
        });
      }
    };
  }, [pendingNoteSaves, saveJournalNote]);

  // Show message if user is not authenticated
  if (!isLoggedIn) {
    return (
      <div className="w-full px-0 overflow-hidden">
        <div className="space-y-3 mb-4 mx-2 sm:mx-2 md:mx-2 lg:mx-6">
          <div className="mt-4">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-8">
              <div className="text-center text-[var(--text-primary)]">
                Please log in to manage your habits.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }



  return (
    <>
      <Helmet>
        <title>Habit Tracking & Daily Goals | Uni Tracker 2026</title>
        <meta
          name="description"
          content="Build positive study habits with our habit tracker. Set daily goals, track progress, and develop consistent study routines."
        />
        <meta
          name="keywords"
          content="habit tracker, daily goals, study habits, routine builder, habit formation, productivity habits, study consistency"
        />
        <meta property="og:title" content="Habit Tracking & Daily Goals | Uni Tracker 2026" />
        <meta
          property="og:description"
          content="Build positive study habits with our habit tracker. Set daily goals, track progress, and develop consistent study routines."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://uni-tracker.vercel.app/habits" />
        <link rel="canonical" href="https://uni-tracker.vercel.app/habits" />
      </Helmet>
      <div className="w-full px-0 overflow-hidden">
      <div className="space-y-8 mb-4 mx-2 sm:mx-2 md:mx-2 lg:mx-6 lg:max-w-1/2 lg:mx-auto lg:px-8">
        {/* Current Month */}
        {renderHabitsTable(
          currentYear,
          currentMonth,
          days,
          new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          true
        )}

        {/* Next Month */}
        {renderHabitsTable(
          nextMonthYear,
          nextMonth,
          nextMonthDays,
          new Date(nextMonthYear, nextMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          false
        )}
      </div>

      <HabitCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAdd={handleAddHabit}
      />

      <HabitEditModal
        isOpen={isEditModalOpen}
        onClose={handleCancelEdit}
        onSave={handleSaveHabitName}
        onDelete={handleDeleteHabit}
        habit={editingHabit}
      />

      {/* Day Dropdown Menu */}
      {tooltipContent && (
        <div
          className="fixed bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] text-[var(--text-primary)] rounded-lg shadow-xl transition-all duration-200 max-w-xs z-50"
          style={{
            top: '15%',
            left: '50%',
            transform: 'translate(-50%, 0)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-[var(--border-primary)]">
            <div className="text-sm font-semibold text-[var(--accent-primary)] text-center">
              {formatDate(tooltipContent.date.toISOString())}
            </div>
            <div className="text-xs text-[var(--text-secondary)] text-center mt-1">
              {tooltipContent.tasks.length} task{tooltipContent.tasks.length !== 1 ? 's' : ''} due
            </div>
          </div>
          <div className="p-2 max-h-[300px] overflow-y-auto">
            {tooltipContent.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-[var(--bg-secondary)] transition-colors group cursor-pointer"
                onClick={() => {
                  // Navigate to tasks page or open task modal
                  window.location.href = '/tasks';
                }}
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
    </>
  );
});

HabitsPage.displayName = 'HabitsPage';

export default HabitsPage;