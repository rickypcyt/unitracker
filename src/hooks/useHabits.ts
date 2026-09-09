import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { HabitService } from '@/services/HabitService';


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
const habitMemoryCache = new Map<string, HabitCache>();
const habitRequests = new Map<string, Promise<HabitCache>>();

const getHabitCache = (userId: string): HabitCache | null => {
  const memoryCache = habitMemoryCache.get(userId);
  if (memoryCache) return memoryCache;

  try {
    const saved = localStorage.getItem(`habits-cache:${userId}`);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as HabitCache;
    if (Array.isArray(parsed.habits) && parsed.dailyNotes && typeof parsed.savedAt === 'number') {
      habitMemoryCache.set(userId, parsed);
      return parsed;
    }
  } catch (error) {
    console.error('Error reading habits cache:', error);
  }

  return null;
};

const saveHabitCache = (userId: string, cache: HabitCache): void => {
  habitMemoryCache.set(userId, cache);
  try {
    localStorage.setItem(`habits-cache:${userId}`, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving habits cache:', error);
  }
};

const fetchHabitData = async (userId: string): Promise<HabitCache> => {
  const existingRequest = habitRequests.get(userId);
  if (existingRequest) return existingRequest;

  const request = (async () => {
    const habitsData = await HabitService.fetchHabits(userId);
    const habitIds = habitsData.map(h => h.id);
    const completionsData = habitIds.length > 0
      ? await HabitService.fetchCompletions(userId, habitIds) as HabitCompletion[]
      : [];
    const notesData = await HabitService.fetchJournalNotes(userId);
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
  })();

  habitRequests.set(userId, request);
  try {
    return await request;
  } finally {
    habitRequests.delete(userId);
  }
};

export const useHabits = () => {
  const { user, isLoggedIn } = useAuth();
  const cachedHabits = user?.id ? getHabitCache(user.id) : null;
  const [habits, setHabits] = useState<HabitWithCompletions[]>(cachedHabits?.habits ?? []);
  const [dailyNotes, setDailyNotes] = useState<Record<string, string>>(cachedHabits?.dailyNotes ?? {});
  const [loading, setLoading] = useState(Boolean(isLoggedIn && user && !cachedHabits));
  const [error, setError] = useState<string | null>(null);

  const loadHabits = async (showLoading = true) => {
    if (!user || !isLoggedIn) {
      setHabits([]);
      setDailyNotes({});
      setLoading(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);
      setError(null);
      const cache = await fetchHabitData(user.id);
      setHabits(cache.habits);
      setDailyNotes(cache.dailyNotes);
    } catch (err) {
      console.error('Error loading habits:', err);
      setError(err instanceof Error ? err.message : 'Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  // Create a new habit
  const createHabit = async (name: string): Promise<HabitWithCompletions | null> => {
    if (!user || !isLoggedIn) return null;

    try {
      const data = await HabitService.createHabit(user.id, name);

      const newHabit: HabitWithCompletions = {
        ...data,
        completions: {}
      };

      setHabits(prev => {
        const nextHabits = [...prev, newHabit];
        saveHabitCache(user.id, { habits: nextHabits, dailyNotes, savedAt: Date.now() });
        return nextHabits;
      });
      return newHabit;
    } catch (err) {
      console.error('Error creating habit:', err);
      setError(err instanceof Error ? err.message : 'Failed to create habit');
      return null;
    }
  };

  // Update habit name
  const updateHabit = async (habitId: string, newName: string): Promise<boolean> => {
    if (!user || !isLoggedIn) return false;

    try {
      await HabitService.updateHabit(habitId, user.id, newName);

      setHabits(prev => {
        const nextHabits = prev.map(habit =>
          habit.id === habitId
            ? { ...habit, name: newName.trim() }
            : habit
        );
        saveHabitCache(user.id, { habits: nextHabits, dailyNotes, savedAt: Date.now() });
        return nextHabits;
      });

      return true;
    } catch (err) {
      console.error('Error updating habit:', err);
      setError(err instanceof Error ? err.message : 'Failed to update habit');
      return false;
    }
  };

  // Delete habit
  const deleteHabit = async (habitId: string): Promise<boolean> => {
    if (!user || !isLoggedIn) return false;

    try {
      await HabitService.deleteHabit(habitId, user.id);

      setHabits(prev => {
        const nextHabits = prev.filter(habit => habit.id !== habitId);
        saveHabitCache(user.id, { habits: nextHabits, dailyNotes, savedAt: Date.now() });
        return nextHabits;
      });
      return true;
    } catch (err) {
      console.error('Error deleting habit:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete habit');
      return false;
    }
  };

  // Toggle habit completion for a specific date
  const toggleHabitCompletion = async (habitId: string, date: Date): Promise<boolean> => {
    if (!user || !isLoggedIn) {
      console.error('toggleHabitCompletion: User not authenticated');
      return false;
    }

    // Use local date to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`; // YYYY-MM-DD format

    try {
      const newCompletedState = await HabitService.toggleCompletion(habitId, user.id, dateString);

      // Update local state
      setHabits(prev => {
        const nextHabits = prev.map(habit => {
          if (habit.id === habitId) {
            const newCompletions = { ...habit.completions };
            newCompletions[dateString] = newCompletedState;
            return { ...habit, completions: newCompletions };
          }
          return habit;
        });
        saveHabitCache(user.id, { habits: nextHabits, dailyNotes, savedAt: Date.now() });
        return nextHabits;
      });

      return true;
    } catch (err) {
      console.error('Error toggling habit completion:', err);
      setError(err instanceof Error ? err.message : 'Failed to update habit completion');
      return false;
    }
  };

  // Save or update journal note
  const saveJournalNote = async (date: Date, note: string): Promise<boolean> => {
    if (!user || !isLoggedIn) return false;

    // Use local date to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`; // YYYY-MM-DD format

    try {
      await HabitService.saveJournalNote(user.id, dateString, note);

      const trimmedNote = note.trim();
      // Update local state
      setDailyNotes(prev => {
        const newNotes = { ...prev };
        if (trimmedNote === '') {
          delete newNotes[dateString];
        } else {
          newNotes[dateString] = trimmedNote;
        }
        saveHabitCache(user.id, { habits, dailyNotes: newNotes, savedAt: Date.now() });
        return newNotes;
      });

      return true;
    } catch (err) {
      console.error('Error saving daily note:', err);
      setError(err instanceof Error ? err.message : 'Failed to save daily note');
      return false;
    }
  };

  // Load once per cache window and keep cached data visible while refreshing.
  useEffect(() => {
    if (!user || !isLoggedIn) {
      setHabits([]);
      setDailyNotes({});
      setLoading(false);
      return;
    }

    const cache = getHabitCache(user.id);
    if (cache) {
      setHabits(cache.habits);
      setDailyNotes(cache.dailyNotes);
      setLoading(false);

      if (Date.now() - cache.savedAt < HABITS_CACHE_TTL) return;
    }

    void loadHabits(!cache);
  }, [user?.id, isLoggedIn]);

  return {
    habits,
    journalNotes: dailyNotes,
    loading,
    error,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    saveJournalNote,
    refreshHabits: loadHabits
  };
};