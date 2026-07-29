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

export const useHabits = () => {
  const { user, isLoggedIn } = useAuth();
  const [habits, setHabits] = useState<HabitWithCompletions[]>([]);
  const [dailyNotes, setDailyNotes] = useState<Record<string, string>>({}); // key: "YYYY-MM-DD", value: note
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load habits and their completions
  const loadHabits = async () => {
    if (!user || !isLoggedIn) {
      setHabits([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const habitsData = await HabitService.fetchHabits(user.id);
      const habitIds = habitsData.map(h => h.id);
      let completionsData: HabitCompletion[] = [];

      if (habitIds.length > 0) {
        completionsData = await HabitService.fetchCompletions(user.id, habitIds) as HabitCompletion[];
      }

      const notesData = await HabitService.fetchJournalNotes(user.id);

      const notesObject: Record<string, string> = {};
      notesData.forEach(note => {
        notesObject[note.note_date] = note.note || '';
      });

      setDailyNotes(notesObject);

      const habitsWithCompletions: HabitWithCompletions[] = habitsData.map(habit => {
        const habitCompletions = completionsData.filter(c => c.habit_id === habit.id);
        const completions: Record<string, boolean> = {};

        habitCompletions.forEach(comp => {
          const dateKey = comp.completion_date;
          completions[dateKey] = comp.completed;
        });

        return {
          ...habit,
          completions
        };
      });

      setHabits(habitsWithCompletions);
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

      setHabits(prev => [...prev, newHabit]);
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

      setHabits(prev => prev.map(habit =>
        habit.id === habitId
          ? { ...habit, name: newName.trim() }
          : habit
      ));

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

      setHabits(prev => prev.filter(habit => habit.id !== habitId));
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
      setHabits(prev => prev.map(habit => {
        if (habit.id === habitId) {
          const newCompletions = { ...habit.completions };
          newCompletions[dateString] = newCompletedState;
          return { ...habit, completions: newCompletions };
        }
        return habit;
      }));

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
        return newNotes;
      });

      return true;
    } catch (err) {
      console.error('Error saving daily note:', err);
      setError(err instanceof Error ? err.message : 'Failed to save daily note');
      return false;
    }
  };

  // Load habits when user changes
  useEffect(() => {
    loadHabits();
  }, [user, isLoggedIn]);

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