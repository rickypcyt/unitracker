import { Check, ChevronLeft, ChevronRight, Flame, Plus, Target, TrendingUp, Trophy } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';

import { Habit } from '../../types/common';
import EmptyState from '@/components/EmptyState';
import HabitCreateModal from '../../modals/HabitCreateModal';
import HabitEditModal from '../../modals/HabitEditModal';
import { Helmet } from "react-helmet-async";
import { useAuth } from '../../hooks/useAuth';
import useDemoMode from '@/utils/useDemoMode';
import { useHabits } from '../../hooks/useHabits';

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
    const curr = new Date(y ?? 0, (m ?? 0) - 1, d ?? 1);
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

const getTotalCompleted = (completions: Record<string, boolean>): number => {
  return Object.values(completions).filter(v => v).length;
};


const HabitsPage = memo(() => {
  const { isLoggedIn } = useAuth();
  const { demoHabits } = useDemoMode();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [pendingNoteSaves, setPendingNoteSaves] = useState<Record<string, string>>({});
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week

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

  const today = new Date();

  // Compute the 7 days of the selected week
  const weekDays = useMemo(() => {
    const ref = new Date(today);
    ref.setDate(ref.getDate() + weekOffset * 7);
    const weekStart = new Date(ref);
    weekStart.setDate(ref.getDate() - ref.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekOffset, today]);

  const isCurrentWeek = weekOffset === 0;

  // Compute week-based stats
  const stats = useMemo(() => {
    if (!displayHabits || displayHabits.length === 0) {
      return { bestStreak: 0, totalCompletions: 0, weekCompletionRate: 0, activeHabits: 0, topStreak: 0, weekCompleted: 0, weekTotal: 0 };
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

    // Count completions in the selected week
    let weekCompleted = 0;
    let weekTotal = 0;
    for (const date of weekDays) {
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const isFuture = date > today && !isCurrentWeek;
      if (!isFuture) {
        weekTotal += displayHabits.length;
        for (const habit of displayHabits) {
          if ((habit.completions as Record<string, boolean>)?.[dateKey]) weekCompleted++;
        }
      }
    }

    const weekCompletionRate = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

    return {
      bestStreak,
      totalCompletions,
      weekCompletionRate,
      activeHabits: displayHabits.length,
      topStreak,
      weekCompleted,
      weekTotal,
    };
  }, [displayHabits, weekDays, isCurrentWeek, today]);

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
      <EmptyState
        icon={Target}
        title="Track your daily habits"
        message="Log in to create habits, build streaks, and track your daily progress. Start building consistent study routines today."
        ctaLabel="Log in to get started"
        onCtaClick={() => window.dispatchEvent(new Event('openLoginModal'))}
      />
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
            <div className="text-2xl font-bold text-[var(--text-primary)] leading-tight">{stats.weekCompletionRate}%</div>
            <div className="text-xs text-[var(--text-secondary)] truncate">This Week</div>
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

      {/* Week navigation + New Habit button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-[var(--text-primary)] min-w-[140px] text-center">
            {weekDays[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[6]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <button
            onClick={() => setWeekOffset(o => o + 1)}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            aria-label="Next week"
          >
            <ChevronRight size={18} />
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="ml-1 px-2 py-1 text-xs rounded-lg text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 transition-colors"
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Habit</span>
        </button>
      </div>

      {/* Weekly content */}
      <div className="mb-4">
        {displayHabits.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No habits yet"
            message="Create your first habit to start building daily streaks and track your consistency over time."
            ctaLabel="Create your first habit"
            onCtaClick={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="space-y-4">
            {/* Day headers row */}
            <div className="flex items-center gap-2 sm:gap-3 px-1">
              <div className="w-32 sm:w-48 flex-shrink-0" />
              <div className="flex-1 grid grid-cols-7 gap-1.5 sm:gap-2">
                {weekDays.map((date) => {
                  const d = date.getDate();
                  const isToday = isCurrentWeek && d === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
                  const isFuture = date > today && !isToday;
                  return (
                    <div
                      key={`header-${date.toISOString()}`}
                      className={`text-center text-xs font-medium ${
                        isToday
                          ? 'text-[var(--accent-primary)]'
                          : isFuture
                          ? 'text-[var(--text-tertiary)]'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      <div>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className={`text-sm ${isToday ? 'font-bold text-[var(--accent-primary)]' : ''}`}>{d}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Habit rows with 7-day grid */}
            {displayHabits.map((habit) => {
              const completions = habit.completions as Record<string, boolean>;
              const { current, best } = calculateStreak(completions);
              const total = getTotalCompleted(completions);

              return (
                <div
                  key={habit.id}
                  className="flex items-center gap-2 sm:gap-3 p-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)]"
                >
                  {/* Habit name + streak */}
                  <button
                    onClick={() => handleStartEditHabit(habit as Habit)}
                    className="w-32 sm:w-48 flex-shrink-0 text-left min-w-0 group"
                  >
                    <div className="text-sm font-medium truncate text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                      {habit.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--text-secondary)]">
                      {current > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Flame size={10} className="text-[var(--accent-primary)]" />
                          {current}d
                        </span>
                      )}
                      {best > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Trophy size={10} className="text-[var(--accent-primary)]" />
                          {best}d
                        </span>
                      )}
                      <span>{total} total</span>
                    </div>
                  </button>

                  {/* 7-day grid */}
                  <div className="flex-1 grid grid-cols-7 gap-1.5 sm:gap-2">
                    {weekDays.map((date) => {
                      const y = date.getFullYear();
                      const m = date.getMonth();
                      const d = date.getDate();
                      const dateKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                      const isCompleted = !!completions[dateKey];
                      const isToday = isCurrentWeek && d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
                      const isFuture = date > today && !isToday;

                      return (
                        <button
                          key={`${habit.id}-${dateKey}`}
                          onClick={() => handleToggleHabitForMonth(habit.id, y, m, d)}
                          className={`aspect-square rounded-lg border-2 transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${
                            isCompleted
                              ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]'
                              : isToday
                              ? 'border-[var(--accent-primary)]/50 hover:border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                              : 'border-[var(--border-primary)] hover:border-[var(--accent-primary)]/60 bg-[var(--bg-secondary)]'
                          } ${isFuture ? 'opacity-40' : ''}`}
                          aria-label={`${isCompleted ? 'Unmark' : 'Mark'} ${habit.name} for ${date.toLocaleDateString()}`}
                        >
                          {isCompleted && <Check size={16} className="text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Journal notes for the week */}
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] px-1">Journal Notes</h3>
              {weekDays.map((date) => {
                const y = date.getFullYear();
                const m = date.getMonth();
                const d = date.getDate();
                const dateKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const isToday = isCurrentWeek && d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
                const isFuture = date > today && !isToday;

                return (
                  <div
                    key={`note-${dateKey}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] ${isFuture ? 'opacity-50' : ''}`}
                  >
                    <span className={`text-xs font-medium w-20 flex-shrink-0 ${isToday ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}>
                      {date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                    </span>
                    <input
                      type="text"
                      placeholder="Add a note..."
                      className="flex-1 px-2 py-1 text-sm bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                      defaultValue={journalNotes[dateKey] || ''}
                      onChange={(e) => handleNoteChangeForMonth(y, m, d, e.target.value)}
                      onKeyDown={(e) => handleNoteKeyDownForMonth(y, m, d, e)}
                      onBlur={() => handleNoteBlurForMonth(y, m, d)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
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

    </div>
    </>
  );
});

HabitsPage.displayName = 'HabitsPage';

export default HabitsPage;