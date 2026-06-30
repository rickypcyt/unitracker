import { Calendar, Check, ChevronLeft, ChevronRight, EyeOff, Flame, Grid3x3, History, Plus, Target, TrendingUp, Trophy } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';

import { Habit } from '../../types/common';
import HabitCreateModal from '../../modals/HabitCreateModal';
import HabitEditModal from '../../modals/HabitEditModal';
import { Helmet } from "react-helmet-async";
import { formatDate } from '@/utils/dateUtils';
import { useAuth } from '../../hooks/useAuth';
import { useCalendarData } from '../calendar/hooks/useCalendarData';
import useDemoMode from '@/utils/useDemoMode';
import { useHabits } from '../../hooks/useHabits';

type ViewMode = 'today' | 'history';
type HistorySubView = 'calendar' | 'heatmap' | 'week';

const calculateStreak = (completions: Record<string, boolean>): { current: number; best: number } => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const completedDates = Object.keys(completions).filter(d => completions[d]).sort();
  if (completedDates.length === 0) return { current: 0, best: 0 };

  let current = 0;
  let checkDate = completedDates.includes(todayStr) ? today : (completedDates.includes(yesterdayStr) ? yesterday : null);
  if (checkDate) {
    let d = new Date(checkDate);
    while (true) {
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (completions[ds]) {
        current++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
  }

  let best = 0;
  let temp = 0;
  let prev: Date | null = null;
  for (const ds of completedDates) {
    const [y, m, d] = ds.split('-').map(Number);
    const curr = new Date(y, (m ?? 0) - 1, d ?? 1);
    if (prev) {
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        temp++;
      } else {
        best = Math.max(best, temp);
        temp = 1;
      }
    } else {
      temp = 1;
    }
    prev = curr;
  }
  best = Math.max(best, temp);

  return { current, best };
};

const getMonthCompletionRate = (completions: Record<string, boolean>, year: number, month: number): number => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
  const effectiveDays = isCurrentMonth ? today.getDate() : daysInMonth;
  let completed = 0;
  for (let day = 1; day <= effectiveDays; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (completions[dateKey]) completed++;
  }
  return effectiveDays > 0 ? Math.round((completed / effectiveDays) * 100) : 0;
};

const getTotalCompleted = (completions: Record<string, boolean>): number => {
  return Object.values(completions).filter(v => v).length;
};


const HabitsPage = memo(() => {
  const { isLoggedIn } = useAuth();
  const { demoHabits } = useDemoMode();
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
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [historySubView, setHistorySubView] = useState<HistorySubView>('week');
  const [historyMonthOffset, setHistoryMonthOffset] = useState(0); // 0 = current month, -1 = prev, etc.
  const [historyWeekOffset, setHistoryWeekOffset] = useState(0); // 0 = current week
  
  // Load preferences from localStorage
  const [showPastMonths, setShowPastMonths] = useState(() => {
    const saved = localStorage.getItem('habits-showPastMonths');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showPastDays, setShowPastDays] = useState(() => {
    const saved = localStorage.getItem('habits-showPastDays');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [heatmapRange, setHeatmapRange] = useState(() => {
    const saved = localStorage.getItem('habits-heatmapRange');
    return saved !== null ? JSON.parse(saved) : 90;
  });

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('habits-showPastMonths', JSON.stringify(showPastMonths));
  }, [showPastMonths]);

  useEffect(() => {
    localStorage.setItem('habits-showPastDays', JSON.stringify(showPastDays));
  }, [showPastDays]);

  useEffect(() => {
    localStorage.setItem('habits-heatmapRange', JSON.stringify(heatmapRange));
  }, [heatmapRange]);

  // Use demo habits when in demo mode, otherwise use real habits
  const {
    habits,
    journalNotes,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    saveJournalNote
  } = useHabits();

  // Combine real habits with demo habits for demo mode
  const displayHabits = isLoggedIn ? habits : demoHabits;

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const completedToday = useMemo(() => {
    if (!displayHabits || displayHabits.length === 0) return 0;
    return displayHabits.filter(h => (h.completions as Record<string, boolean>)?.[todayStr]).length;
  }, [displayHabits, todayStr]);

  // Compute aggregate stats
  const stats = useMemo(() => {
    if (!displayHabits || displayHabits.length === 0) {
      return { bestStreak: 0, totalCompletions: 0, monthCompletionRate: 0, activeHabits: 0, topStreak: 0 };
    }

    let bestStreak = 0;
    let totalCompletions = 0;
    let topStreak = 0;

    for (const habit of displayHabits) {
      const { current, best } = calculateStreak(habit.completions as Record<string, boolean>);
      bestStreak = Math.max(bestStreak, best);
      topStreak = Math.max(topStreak, current);
      totalCompletions += getTotalCompleted(habit.completions as Record<string, boolean>);
    }

    const monthRate = getMonthCompletionRate(
      displayHabits.reduce((acc, h) => ({ ...acc, ...h.completions }), {} as Record<string, boolean>),
      currentYear,
      currentMonth
    );

    return {
      bestStreak,
      totalCompletions,
      monthCompletionRate: monthRate,
      activeHabits: displayHabits.length,
      topStreak,
    };
  }, [displayHabits, currentYear, currentMonth]);

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

  // Generate months to display based on historyMonthOffset
  const generateMonths = () => {
    const months: Array<{
      year: number;
      month: number;
      days: number[];
      realDays: number;
      title: string;
      isCurrent: boolean;
      opacity: string;
    }> = [];
    
    const baseDate = new Date(currentYear, currentMonth + historyMonthOffset);
    const prevMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1);
    const currMonth = new Date(baseDate.getFullYear(), baseDate.getMonth());
    const nextMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1);
    
    const isCurrentMonth = (d: Date) => d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    
    const monthsToShow = [
      { date: prevMonth, isCurrent: isCurrentMonth(prevMonth), opacity: 'opacity-60' },
      { date: currMonth, isCurrent: isCurrentMonth(currMonth), opacity: 'opacity-100' },
      { date: nextMonth, isCurrent: isCurrentMonth(nextMonth), opacity: 'opacity-80' }
    ];
    
    monthsToShow.forEach(({ date, isCurrent, opacity }) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
      
      // Add ghost days to make all months have 31 days
      const ghostDays = Array.from({ length: 31 - daysInMonth }, (_, i) => daysInMonth + i + 1);
      const allDays = [...monthDays, ...ghostDays];
      
      months.push({
        year: year,
        month: month,
        days: allDays,
        realDays: daysInMonth, // Track real days count
        title: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        isCurrent: isCurrent,
        opacity: opacity
      });
    });
    
    return months;
  };
  
  const months = generateMonths();

  // Function to render habits table for a specific month
  const renderHabitsTable = (
    year: number,
    month: number,
    daysArray: number[],
    realDaysCount: number,
    monthTitle: string,
    opacity: string,
    showPastDays: boolean = true
  ) => {
    const isThisMonthCurrent = today.getMonth() === month && today.getFullYear() === year;
    const todayDayForMonth = isThisMonthCurrent ? today.getDate() : null;

    return (
      <div className={`mt-4 ${opacity}`}>
        <div className="bg-[var(--bg-secondary)] border border-1 border-[var(--border-primary)] rounded-lg overflow-hidden">
          {/* Month title header */}
          <div className="px-4 py-2 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex items-center justify-center">
            <div className="text-lg font-semibold text-[var(--accent-primary)]">
              {monthTitle}
            </div>
          </div>
          {/* Table with natural height */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-[var(--bg-tertiary)] sticky top-0 z-10">
                <tr className="border-b border-[var(--border-primary)]">
                  <th className="px-4 py-3 text-center text-sm font-bold text-[var(--text-primary)] border-r border-[var(--border-primary)] w-16">
                    Day
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[var(--text-primary)] border-r border-[var(--border-primary)] min-w-[200px]">
                    Notes
                  </th>
                  {displayHabits.map(habit => (
                    <th key={`${habit.id}-${year}-${month}`} className="px-2 py-3 text-center text-sm font-bold text-[var(--text-primary)] border-r border-[var(--border-primary)] w-12">
                      <span
                        className="truncate cursor-pointer hover:text-[var(--accent-primary)] transition-colors"
                        title={`Click to edit: ${habit.name}`}
                        onClick={() => handleStartEditHabit(habit as Habit)}
                      >
                        {habit.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {daysArray
                  .filter((day) => {
                    // Always show current and future days
                    // Show past days only if showPastDays is true
                    const isGhostDay = day > realDaysCount;
                    const isPastDay = !isGhostDay && isThisMonthCurrent && todayDayForMonth !== null && day < todayDayForMonth;
                    
                    return !isPastDay || showPastDays;
                  })
                  .map((day) => {
                    const isGhostDay = day > realDaysCount;
                    const isFutureDay = !isGhostDay && isThisMonthCurrent && todayDayForMonth !== null && day > todayDayForMonth;
                    const isPastDay = !isGhostDay && isThisMonthCurrent && todayDayForMonth !== null && day < todayDayForMonth;

                    return (
                      <tr
                        key={`${year}-${month}-${day}`}
                        className={`border-b border-[var(--border-primary)] transition-colors ${
                          isGhostDay 
                            ? 'bg-transparent opacity-20' 
                            : isPastDay
                            ? 'bg-[var(--bg-primary)] opacity-60 hover:bg-[var(--bg-tertiary)]/60'
                            : 'bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)]'
                        }`}
                      >
                      {/* Day number column */}
                      <td
                        className="px-4 py-3 text-center border-r border-[var(--border-primary)] relative"
                        onMouseLeave={() => setTooltipContent(null)}
                        onClick={() => setTooltipContent(null)}
                      >
                        <span
                          className={`font-bold text-sm ${
                            isGhostDay
                              ? 'text-[var(--text-tertiary)]'
                              : day === todayDayForMonth
                              ? 'text-[var(--accent-primary)]'
                              : isPastDay
                              ? 'text-[var(--text-secondary)]'
                              : isFutureDay
                              ? 'text-[var(--text-tertiary)]'
                              : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {isGhostDay ? '' : day}
                        </span>
                        
                        {/* Task indicator - only for real days */}
                        {!isGhostDay && (() => {
                          const date = new Date(year, month, day);
                          const tasks = getTasksWithDeadline(date);
                          return tasks.length > 0 && (
                            <div
                              className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-[var(--accent-primary)] opacity-90 z-10 cursor-pointer"
                              onMouseEnter={() => {
                                if (tasks.length > 0) {
                                  setTooltipContent({ date, tasks });
                                }
                              }}
                            ></div>
                          );
                        })()}

                        {/* Day name - only for real days */}
                        {!isGhostDay && (
                          <div className="text-xs text-[var(--text-secondary)] mt-1 text-center">
                            {(() => {
                              const date = new Date(year, month, day);
                              return date.toLocaleDateString('en-US', { weekday: 'short' });
                            })()}
                          </div>
                        )}
                      </td>

                      {/* Notes column */}
                      <td className="px-4 py-3 border-r border-[var(--border-primary)] min-w-32">
                        {!isGhostDay ? (
                          <input
                            type="text"
                            placeholder="Add notes..."
                            className="w-full px-2 py-1 text-sm bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                            defaultValue={journalNotes[`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`] || ''}
                            onChange={(e) => handleNoteChangeForMonth(year, month, day, e.target.value)}
                            onKeyDown={(e) => handleNoteKeyDownForMonth(year, month, day, e)}
                            onBlur={() => handleNoteBlurForMonth(year, month, day)}
                          />
                        ) : (
                          <div className="w-full h-11"></div>
                        )}
                      </td>

                      {/* Habit columns */}
                      {displayHabits.map(habit => {
                        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isCompleted = !isGhostDay && ((habit.completions as Record<string, boolean>)?.[dateKey] || false);
                        return (
                          <td key={`${habit.id}-${year}-${month}-${day}`} className="px-2 py-3 text-center border-r border-[var(--border-primary)] w-12">
                            {!isGhostDay ? (
                              <button
                                onClick={() => handleToggleHabitForMonth(habit.id, year, month, day)}
                                className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${
                                  isPastDay
                                    ? isCompleted
                                      ? 'bg-[var(--accent-primary)]/60 border-[var(--accent-primary)]/60'
                                      : 'border-[var(--text-secondary)]/40 hover:border-[var(--accent-primary)]/60'
                                    : isCompleted
                                    ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] scale-110'
                                    : 'border-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:scale-105'
                                }`}
                                title={isCompleted ? 'Completed' : 'Not completed'}
                              />
                            ) : (
                              <div className="w-6 h-6 mx-auto mt-3"></div>
                            )}
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

  // Show message if user is not authenticated AND no demo habits available
  if (!isLoggedIn && demoHabits.length === 0) {
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
        <title>Habit Tracking & Daily Goals | UniTracker 2026</title>
        <meta
          name="description"
          content="Build positive study habits with our habit tracker. Set daily goals, track progress, and develop consistent study routines."
        />
        <meta
          name="keywords"
          content="habit tracker, daily goals, study habits, routine builder, habit formation, productivity habits, study consistency"
        />
        <meta property="og:title" content="Habit Tracking & Daily Goals | UniTracker 2026" />
        <meta
          property="og:description"
          content="Build positive study habits with our habit tracker. Set daily goals, track progress, and develop consistent study routines."
        />
      </Helmet>
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 overflow-hidden">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 mb-4">
        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center flex-shrink-0">
            <Flame size={20} className="text-[var(--accent-primary)]" />
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-bold text-[var(--text-primary)] leading-tight">{stats.topStreak}</div>
            <div className="text-xs text-[var(--text-secondary)] truncate">Current Streak</div>
          </div>
        </div>
        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center flex-shrink-0">
            <Trophy size={20} className="text-[var(--accent-primary)]" />
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-bold text-[var(--text-primary)] leading-tight">{stats.bestStreak}</div>
            <div className="text-xs text-[var(--text-secondary)] truncate">Best Streak</div>
          </div>
        </div>
        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={20} className="text-[var(--accent-primary)]" />
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-bold text-[var(--text-primary)] leading-tight">{stats.monthCompletionRate}%</div>
            <div className="text-xs text-[var(--text-secondary)] truncate">This Month</div>
          </div>
        </div>
        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center flex-shrink-0">
            <Target size={20} className="text-[var(--accent-primary)]" />
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-bold text-[var(--text-primary)] leading-tight">{stats.totalCompletions}</div>
            <div className="text-xs text-[var(--text-secondary)] truncate">Total Completions</div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-[var(--bg-secondary)] rounded-lg p-1">
          <button
            onClick={() => setViewMode('today')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'today'
                ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Check size={14} />
            <span>Today</span>
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'history'
                ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <History size={14} />
            <span>History</span>
          </button>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Habit</span>
        </button>
      </div>

      {/* Content area */}
      {viewMode === 'today' ? (
        /* Today's Habits Checklist */
        <div className="mb-4">
          {displayHabits.length === 0 ? (
            <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">No habits yet. Create your first habit to start tracking!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Today header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {completedToday} of {displayHabits.length} completed
                  </p>
                </div>
                {completedToday === displayHabits.length && displayHabits.length > 0 && (
                  <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--accent-primary)]">
                    <Trophy size={16} />
                    All done!
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-300"
                  style={{ width: `${displayHabits.length > 0 ? (completedToday / displayHabits.length) * 100 : 0}%` }}
                />
              </div>

              {/* Habit checklist items */}
              {displayHabits.map((habit) => {
                const completions = habit.completions as Record<string, boolean>;
                const isCompleted = !!completions[todayStr];
                const { current, best } = calculateStreak(completions);
                const total = getTotalCompleted(completions);

                return (
                  <div
                    key={habit.id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 ${
                      isCompleted
                        ? 'bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/30'
                        : 'bg-[var(--bg-primary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleHabitForMonth(habit.id, today.getFullYear(), today.getMonth(), today.getDate())}
                      className={`flex-shrink-0 w-7 h-7 rounded-full border-2 transition-all hover:scale-110 active:scale-95 flex items-center justify-center ${
                        isCompleted
                          ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]'
                          : 'border-[var(--text-secondary)]/40 hover:border-[var(--accent-primary)]'
                      }`}
                    >
                      {isCompleted && <Check size={16} className="text-white" />}
                    </button>

                    {/* Habit name + streak */}
                    <button
                      onClick={() => handleStartEditHabit(habit as Habit)}
                      className="flex-1 text-left min-w-0 group"
                    >
                      <div className={`text-sm font-medium truncate transition-colors ${
                        isCompleted
                          ? 'text-[var(--text-secondary)] line-through'
                          : 'text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]'
                      }`}>
                        {habit.name}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--text-secondary)]">
                        {current > 0 && (
                          <span className="flex items-center gap-1">
                            <Flame size={11} className="text-[var(--accent-primary)]" />
                            {current}d streak
                          </span>
                        )}
                        {best > 0 && (
                          <span className="flex items-center gap-1">
                            <Trophy size={11} className="text-[var(--accent-primary)]" />
                            {best}d best
                          </span>
                        )}
                        <span>{total} total</span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* History View */
        <div className="mb-4">
          {/* History sub-toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-1 bg-[var(--bg-secondary)] rounded-lg p-1">
              <button
                onClick={() => setHistorySubView('calendar')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  historySubView === 'calendar'
                    ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Calendar size={14} />
                <span className="hidden sm:inline">Calendar</span>
              </button>
              <button
                onClick={() => setHistorySubView('week')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  historySubView === 'week'
                    ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <History size={14} />
                <span className="hidden sm:inline">Week</span>
              </button>
              <button
                onClick={() => setHistorySubView('heatmap')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  historySubView === 'heatmap'
                    ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Grid3x3 size={14} />
                <span className="hidden sm:inline">Heatmap</span>
              </button>
            </div>

            {/* Month/Week navigation */}
            <div className="flex items-center gap-2">
              {(historySubView === 'calendar' || historySubView === 'week') && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => historySubView === 'week' ? setHistoryWeekOffset(o => o - 1) : setHistoryMonthOffset(o => o - 1)}
                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                    aria-label="Previous"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-medium text-[var(--text-primary)] min-w-[120px] text-center">
                    {historySubView === 'week'
                      ? (() => {
                          const ref = new Date(currentYear, currentMonth, currentDate.getDate() + historyWeekOffset * 7);
                          const weekStart = new Date(ref);
                          weekStart.setDate(ref.getDate() - ref.getDay());
                          const weekEnd = new Date(weekStart);
                          weekEnd.setDate(weekStart.getDate() + 6);
                          return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                        })()
                      : new Date(currentYear, currentMonth + historyMonthOffset).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    }
                  </span>
                  <button
                    onClick={() => historySubView === 'week' ? setHistoryWeekOffset(o => o + 1) : setHistoryMonthOffset(o => o + 1)}
                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                    aria-label="Next"
                  >
                    <ChevronRight size={18} />
                  </button>
                  {(historyMonthOffset !== 0 || historyWeekOffset !== 0) && (
                    <button
                      onClick={() => { setHistoryMonthOffset(0); setHistoryWeekOffset(0); }}
                      className="ml-1 px-2 py-1 text-xs rounded-lg text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 transition-colors"
                    >
                      Today
                    </button>
                  )}
                </div>
              )}
              {historySubView === 'heatmap' && (
                <select
                  value={heatmapRange}
                  onChange={(e) => setHeatmapRange(Number(e.target.value))}
                  className="px-2 py-1.5 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                >
                  <option value={90}>90 days</option>
                  <option value={180}>180 days</option>
                  <option value={365}>1 year</option>
                </select>
              )}
            </div>

            <div className="flex items-center gap-2">
              {historySubView === 'calendar' && (
                <>
                  <button
                    onClick={() => setShowPastMonths(!showPastMonths)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors text-sm ${
                      showPastMonths
                        ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <EyeOff size={14} />
                    <span className="hidden sm:inline">Past Months</span>
                  </button>
                  <button
                    onClick={() => setShowPastDays(!showPastDays)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors text-sm ${
                      showPastDays
                        ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <EyeOff size={14} />
                    <span className="hidden sm:inline">Past Days</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {historySubView === 'heatmap' ? (
            /* Heatmap View */
            <div className="space-y-6">
              {displayHabits.map((habit) => {
                const completions = habit.completions as Record<string, boolean>;
                const { current, best } = calculateStreak(completions);
                const total = getTotalCompleted(completions);

                // Generate last N days for heatmap
                const days: Array<{ date: Date; key: string; completed: boolean }> = [];
                const heatToday = new Date();
                for (let i = heatmapRange - 1; i >= 0; i--) {
                  const d = new Date(heatToday);
                  d.setDate(d.getDate() - i);
                  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  days.push({ date: d, key, completed: !!completions[key] });
                }

                // Group into weeks (columns)
                const weeks: Array<typeof days> = [];
                let currentWeek: typeof days = [];
                let prevDay = -1;
                for (const day of days) {
                  const dow = day.date.getDay();
                  if (prevDay !== -1 && dow === 0 && currentWeek.length > 0) {
                    weeks.push(currentWeek);
                    currentWeek = [];
                  }
                  currentWeek.push(day);
                  prevDay = dow;
                }
                if (currentWeek.length > 0) weeks.push(currentWeek);

                return (
                  <div key={habit.id} className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => handleStartEditHabit(habit as Habit)}
                        className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors"
                      >
                        {habit.name}
                      </button>
                      <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1"><Flame size={12} className="text-[var(--accent-primary)]" />{current}d streak</span>
                        <span className="flex items-center gap-1"><Trophy size={12} className="text-[var(--accent-primary)]" />{best}d best</span>
                        <span>{total} total</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <div className="flex gap-1 min-w-fit">
                        {weeks.map((week, wi) => (
                          <div key={wi} className="flex flex-col gap-1">
                            {week.map((day) => (
                              <button
                                key={day.key}
                                onClick={() => handleToggleHabitForMonth(habit.id, day.date.getFullYear(), day.date.getMonth(), day.date.getDate())}
                                className={`w-3.5 h-3.5 rounded-sm transition-all hover:ring-1 hover:ring-[var(--accent-primary)] hover:ring-offset-1 ${
                                  day.completed ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-secondary)] border border-[var(--border-primary)]'
                                }`}
                                title={`${day.key}: ${day.completed ? 'Completed' : 'Not completed'}`}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center justify-end gap-1.5 mt-3 text-xs text-[var(--text-secondary)]">
                      <span>Less</span>
                      <div className="w-3 h-3 rounded-sm bg-[var(--bg-secondary)] border border-[var(--border-primary)]" />
                      <div className="w-3 h-3 rounded-sm bg-[var(--accent-primary)]/25" />
                      <div className="w-3 h-3 rounded-sm bg-[var(--accent-primary)]/50" />
                      <div className="w-3 h-3 rounded-sm bg-[var(--accent-primary)]/75" />
                      <div className="w-3 h-3 rounded-sm bg-[var(--accent-primary)]" />
                      <span>More</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : historySubView === 'week' ? (
            /* Week View - Card-based list matching Today's style */
            <div className="space-y-6">
              {(() => {
                const ref = new Date(currentYear, currentMonth, currentDate.getDate() + historyWeekOffset * 7);
                const weekStart = new Date(ref);
                weekStart.setDate(ref.getDate() - ref.getDay());
                const weekDays = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(weekStart);
                  d.setDate(weekStart.getDate() + i);
                  return d;
                });
                const isThisWeek = historyWeekOffset === 0;

                return weekDays.map((date) => {
                  const y = date.getFullYear();
                  const m = date.getMonth();
                  const d = date.getDate();
                  const dateKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const isToday = isThisWeek && d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
                  const isPast = date < today && !isToday;
                  const isFuture = date > today && !isToday;
                  const dow = date.getDay();
                  const isWeekend = dow === 0 || dow === 6;

                  const dayCompleted = displayHabits.filter(h => (h.completions as Record<string, boolean>)?.[dateKey]).length;
                  const dayTotal = displayHabits.length;
                  const allDone = dayTotal > 0 && dayCompleted === dayTotal;

                  return (
                    <div key={dateKey}>
                      {/* Day header */}
                      <div className="flex items-center justify-between mb-2 px-1">
                        <div>
                          <h3 className={`text-base font-bold ${
                            isToday ? 'text-[var(--accent-primary)]' : isFuture ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'
                          }`}>
                            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            {isToday && <span className="ml-2 text-xs font-normal text-[var(--accent-primary)]">• Today</span>}
                            {isWeekend && !isToday && <span className="ml-2 text-xs font-normal text-[var(--text-tertiary)]">• Weekend</span>}
                          </h3>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {dayCompleted} of {dayTotal} completed
                          </p>
                        </div>
                        {allDone && (
                          <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--accent-primary)]">
                            <Trophy size={14} />
                            All done!
                          </div>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-300"
                          style={{ width: `${dayTotal > 0 ? (dayCompleted / dayTotal) * 100 : 0}%` }}
                        />
                      </div>

                      {/* Habit checklist items */}
                      <div className={`space-y-2 ${isFuture ? 'opacity-50' : ''}`}>
                        {displayHabits.map((habit) => {
                          const completions = habit.completions as Record<string, boolean>;
                          const isCompleted = !!completions[dateKey];
                          const { current, best } = calculateStreak(completions);
                          const total = getTotalCompleted(completions);

                          return (
                            <div
                              key={`${habit.id}-${dateKey}`}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 ${
                                isCompleted
                                  ? 'bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/30'
                                  : 'bg-[var(--bg-primary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
                              } ${isPast && !isCompleted ? 'opacity-70' : ''}`}
                            >
                              {/* Checkbox */}
                              <button
                                onClick={() => handleToggleHabitForMonth(habit.id, y, m, d)}
                                className={`flex-shrink-0 w-7 h-7 rounded-full border-2 transition-all hover:scale-110 active:scale-95 flex items-center justify-center ${
                                  isCompleted
                                    ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]'
                                    : isPast
                                    ? 'border-[var(--text-secondary)]/40 hover:border-[var(--accent-primary)]/60'
                                    : 'border-[var(--text-secondary)]/40 hover:border-[var(--accent-primary)]'
                                }`}
                              >
                                {isCompleted && <Check size={16} className="text-white" />}
                              </button>

                              {/* Habit name + streak */}
                              <button
                                onClick={() => handleStartEditHabit(habit as Habit)}
                                className="flex-1 text-left min-w-0 group"
                              >
                                <div className={`text-sm font-medium truncate transition-colors ${
                                  isCompleted
                                    ? 'text-[var(--text-secondary)] line-through'
                                    : 'text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]'
                                }`}>
                                  {habit.name}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--text-secondary)]">
                                  {current > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Flame size={11} className="text-[var(--accent-primary)]" />
                                      {current}d streak
                                    </span>
                                  )}
                                  {best > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Trophy size={11} className="text-[var(--accent-primary)]" />
                                      {best}d best
                                    </span>
                                  )}
                                  <span>{total} total</span>
                                </div>
                              </button>
                            </div>
                          );
                        })}

                        {/* Notes input for this day */}
                        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                          <input
                            type="text"
                            placeholder="Add a note for this day..."
                            className="flex-1 px-2 py-1 text-sm bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                            defaultValue={journalNotes[dateKey] || ''}
                            onChange={(e) => handleNoteChangeForMonth(y, m, d, e.target.value)}
                            onKeyDown={(e) => handleNoteKeyDownForMonth(y, m, d, e)}
                            onBlur={() => handleNoteBlurForMonth(y, m, d)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            /* Calendar View */
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-6">
                {months
                  .filter(monthData => {
                    if (monthData.isCurrent) return true;
                    const monthDate = new Date(monthData.year, monthData.month, 1);
                    const isFutureMonth = monthDate > today;
                    const isPastMonth = monthDate < today;
                    return isFutureMonth || (showPastMonths && isPastMonth);
                  })
                  .map((monthData) => (
                  <div key={`${monthData.year}-${monthData.month}`}>
                    {renderHabitsTable(
                      monthData.year,
                      monthData.month,
                      monthData.days,
                      monthData.realDays,
                      monthData.title,
                      monthData.opacity,
                      showPastDays
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
          className="fixed bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-lg shadow-xl transition-all duration-200 max-w-xs z-50"
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