import { memo, useEffect, useState } from 'react';

import { Habit } from '../../types/common';
import HabitCreateModal from '../../modals/HabitCreateModal';
import HabitEditModal from '../../modals/HabitEditModal';
import { Helmet } from "react-helmet-async";
import { Plus } from 'lucide-react';
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
  const today = new Date();


  // Note: These handlers are kept for compatibility but may not be used with the new 12-month view
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleNoteChange = (day: number, note: string) => {
    const date = new Date(currentYear, currentMonth, day);
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    // Update pending saves
    setPendingNoteSaves(prev => ({
      ...prev,
      [dateString]: note
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Generate months to display (all months of current year)
  const generateMonths = () => {
    const months = [];
    
    // Add all 12 months of current year
    for (let month = 0; month <= 11; month++) {
      const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
      const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
      const monthDate = new Date(currentYear, month);
      const isCurrentMonth = month === currentMonth;
      
      months.push({
        year: currentYear,
        month: month,
        days: monthDays,
        title: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        isCurrent: isCurrentMonth
      });
    }
    
    return months;
  };
  
  const months = generateMonths();

  // Function to render habits table for a specific month
  const renderHabitsTable = (
    year: number,
    month: number,
    daysArray: number[],
    monthTitle: string
  ) => {
    const isThisMonthCurrent = today.getMonth() === month && today.getFullYear() === year;
    const todayDayForMonth = isThisMonthCurrent ? today.getDate() : null;

    return (
      <div className="mt-4">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
          {/* Month title header */}
          <div className="px-4 py-2 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex items-center justify-center">
            <div className="text-lg font-semibold text-[var(--accent-primary)]">
              {monthTitle}
            </div>
          </div>
          {/* Table with fixed height for consistency */}
          <div className="overflow-hidden" style={{ height: 'calc(31 * 3.5rem + 3rem)' }}>
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
                </tr>
              </thead>
              <tbody>
                {daysArray.map((day) => {
                  const isFutureDay = isThisMonthCurrent && todayDayForMonth !== null && day > todayDayForMonth;

                  return (
                    <tr
                      key={`${year}-${month}-${day}`}
                      className={`border-b border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] transition-colors bg-[var(--bg-primary)]`}
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
      <div className="w-full px-1 sm:px-2 md:px-2 lg:px-4 xl:px-8 overflow-hidden">
      {/* Toolbar */}
      <div className="maincard flex items-center justify-between mb-0 mt-4 p-3 sm:p-4 w-full bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] shadow-none">
        <div className="text-sm font-medium text-[var(--text-secondary)]">
          {currentYear} - All Months
        </div>
        
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] rounded-md hover:bg-[var(--accent-primary)]/10 transition-colors"
        >
          <Plus size={16} />
          Create Habit
        </button>
      </div>
      
      <div className="space-y-8 mb-4">
        {/* Months Grid - 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {months.map((monthData) => (
            <div key={`${monthData.year}-${monthData.month}`}>
              {renderHabitsTable(
                monthData.year,
                monthData.month,
                monthData.days,
                monthData.title
              )}
            </div>
          ))}
        </div>
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