import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/auth/useAuth';
import { HabitService } from '@/services/HabitService';
import posthog from 'posthog-js';


export interface Habit {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completion_date: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface JournalNote {
  id: string;
  user_id: string;
  note_date: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface HabitWithCompletions extends Habit {
  completions: Record<string, boolean>; // key: "YYYY-MM-DD", value: completed
}

type HabitCache = {
  habits: HabitWithCompletions[];
  dailyNotes: Record<string, string>;
  savedAt: number;
};

const HABITS_CACHE_TTL = 5 * 60 * 1000;
const EMPTY: HabitCache = { habits: [], dailyNotes: {}, savedAt: 0 };

export const habitsQueryKey = (userId: string | undefined) => ['habits', userId] as const;

// localStorage copy so the page paints instantly on reload; TanStack Query owns the live cache
const readHabitCache = (userId: string): HabitCache | null => {
  try {
    const saved = localStorage.getItem(`habits-cache:${userId}`);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as HabitCache;
    if (Array.isArray(parsed.habits) && parsed.dailyNotes && typeof parsed.savedAt === 'number') {
      return parsed;
    }
  } catch (error) {
    console.error('Error reading habits cache:', error);
  }
  return null;
};

const saveHabitCache = (userId: string, cache: HabitCache): void => {
  try {
    localStorage.setItem(`habits-cache:${userId}`, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving habits cache:', error);
  }
};

const toDateString = (date: Date): string => {
  // Use local date to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fetchHabitData = async (userId: string): Promise<HabitCache> => {
  const [habitsData, completionsData, notesData] = await Promise.all([
    HabitService.fetchHabits(userId),
    HabitService.fetchCompletions(userId, []),
    HabitService.fetchJournalNotes(userId)
  ]);

  const dailyNotes: Record<string, string> = {};
  notesData.forEach(note => {
    dailyNotes[note.note_date] = note.note || '';
  });

  const habits: HabitWithCompletions[] = habitsData.map(habit => {
    const completions: Record<string, boolean> = {};
    completionsData
      .filter(completion => completion.habit_id === habit.id)
      .forEach(completion => {
        completions[completion.completion_date] = completion.completed;
      });
    return { ...habit, completions };
  });

  const cache = { habits, dailyNotes, savedAt: Date.now() };
  saveHabitCache(userId, cache);
  return cache;
};

export const useHabits = () => {
  const { user, isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const userId = isLoggedIn ? user?.id : undefined;
  const [mutationError, setMutationError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: habitsQueryKey(userId),
    queryFn: () => fetchHabitData(userId!),
    enabled: Boolean(userId),
    staleTime: HABITS_CACHE_TTL,
    initialData: () => (userId ? readHabitCache(userId) ?? undefined : undefined),
    initialDataUpdatedAt: () => (userId ? readHabitCache(userId)?.savedAt : undefined),
  });

  const data = userId ? query.data ?? EMPTY : EMPTY;

  // Apply a local change to the cached data and mirror it to localStorage
  const updateCache = (updater: (prev: HabitCache) => Omit<HabitCache, 'savedAt'>) => {
    if (!userId) return;
    queryClient.setQueryData<HabitCache>(habitsQueryKey(userId), prev => {
      const next = { ...updater(prev ?? EMPTY), savedAt: Date.now() };
      saveHabitCache(userId, next);
      return next;
    });
  };

  const fail = (message: string, err: unknown) => {
    console.error(message, err);
    setMutationError(err instanceof Error ? err.message : message);
  };

  const createHabit = async (name: string): Promise<HabitWithCompletions | null> => {
    if (!userId) return null;
    try {
      const created = await HabitService.createHabit(userId, name);
      const newHabit: HabitWithCompletions = { ...created, completions: {} };
      updateCache(prev => ({ ...prev, habits: [...prev.habits, newHabit] }));
      if (posthog.__loaded) posthog.capture('habit_created');
      return newHabit;
    } catch (err) {
      fail('Failed to create habit', err);
      return null;
    }
  };

  const updateHabit = async (habitId: string, newName: string): Promise<boolean> => {
    if (!userId) return false;
    try {
      await HabitService.updateHabit(habitId, userId, newName);
      updateCache(prev => ({
        ...prev,
        habits: prev.habits.map(habit => habit.id === habitId ? { ...habit, name: newName.trim() } : habit),
      }));
      return true;
    } catch (err) {
      fail('Failed to update habit', err);
      return false;
    }
  };

  const deleteHabit = async (habitId: string): Promise<boolean> => {
    if (!userId) return false;
    try {
      await HabitService.deleteHabit(habitId, userId);
      updateCache(prev => ({ ...prev, habits: prev.habits.filter(habit => habit.id !== habitId) }));
      return true;
    } catch (err) {
      fail('Failed to delete habit', err);
      return false;
    }
  };

  const toggleHabitCompletion = async (habitId: string, date: Date): Promise<boolean> => {
    if (!userId) {
      console.error('toggleHabitCompletion: User not authenticated');
      return false;
    }
    const dateString = toDateString(date);
    try {
      const completed = await HabitService.toggleCompletion(habitId, userId, dateString);
      updateCache(prev => ({
        ...prev,
        habits: prev.habits.map(habit => habit.id === habitId
          ? { ...habit, completions: { ...habit.completions, [dateString]: completed } }
          : habit),
      }));
      if (posthog.__loaded) posthog.capture('habit_completion_toggled', { completed });
      return true;
    } catch (err) {
      fail('Failed to update habit completion', err);
      return false;
    }
  };

  const saveJournalNote = async (date: Date, note: string): Promise<boolean> => {
    if (!userId) return false;
    const dateString = toDateString(date);
    try {
      await HabitService.saveJournalNote(userId, dateString, note);
      const trimmed = note.trim();
      updateCache(prev => {
        const dailyNotes = { ...prev.dailyNotes };
        if (trimmed === '') delete dailyNotes[dateString];
        else dailyNotes[dateString] = trimmed;
        return { ...prev, dailyNotes };
      });
      return true;
    } catch (err) {
      fail('Failed to save daily note', err);
      return false;
    }
  };

  const refreshHabits = async () => {
    if (userId) await query.refetch();
  };

  const queryError = query.error ? (query.error instanceof Error ? query.error.message : 'Failed to load habits') : null;

  return {
    habits: data.habits,
    journalNotes: data.dailyNotes,
    loading: Boolean(userId) && query.isPending,
    error: mutationError ?? queryError,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    saveJournalNote,
    refreshHabits
  };
};
