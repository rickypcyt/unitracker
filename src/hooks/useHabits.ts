import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './useAuth';

// Función de diagnóstico para probar la conexión directa
const testDirectApiCall = async (habitId: string, dateString: string, userId: string) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const url = `${supabaseUrl}/rest/v1/habit_completions?select=*&habit_id=eq.${habitId}&completion_date=eq.${dateString}&user_id=eq.${userId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Prefer': 'return=representation'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('testDirectApiCall: Error response:', errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('testDirectApiCall: Fetch error:', error);
    return { success: false, error: error.message };
  }
};

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

      // Load habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (habitsError) throw habitsError;

      // Load completions for all habits
      const habitIds = habitsData?.map(h => h.id) || [];
      let completionsData: HabitCompletion[] = [];

      if (habitIds.length > 0) {
        const { data: compData, error: compError } = await supabase
          .from('habit_completions')
          .select('*')
          .eq('user_id', user.id)
          .in('habit_id', habitIds);

        if (compError) throw compError;
        completionsData = compData || [];
      }

      // Load journal notes
      const { data: notesData, error: notesError } = await supabase
        .from('journal_notes')
        .select('*')
        .eq('user_id', user.id);

      if (notesError) throw notesError;

      // Convert notes array to object
      const notesObject: Record<string, string> = {};
      (notesData || []).forEach(note => {
        notesObject[note.note_date] = note.note || '';
      });

      setDailyNotes(notesObject);

      // Combine habits with their completions
      const habitsWithCompletions: HabitWithCompletions[] = (habitsData || []).map(habit => {
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
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name: name.trim()
        })
        .select()
        .single();

      if (error) throw error;

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
      const { error } = await supabase
        .from('habits')
        .update({ name: newName.trim() })
        .eq('id', habitId)
        .eq('user_id', user.id);

      if (error) throw error;

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
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId)
        .eq('user_id', user.id);

      if (error) throw error;

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
      // First, check if completion record exists
      const { data: existing, error: selectError } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('habit_id', habitId)
        .eq('completion_date', dateString)
        .eq('user_id', user.id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('toggleHabitCompletion: Select error:', selectError);
        throw selectError;
      }

      const newCompletedState = !existing?.completed;

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('habit_completions')
          .update({ completed: newCompletedState })
          .eq('id', existing.id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('habit_completions')
          .insert({
            habit_id: habitId,
            user_id: user.id,
            completion_date: dateString,
            completed: newCompletedState
          });

        if (insertError) throw insertError;
      }

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
      // Check if note exists
      const { data: existing, error: selectError } = await supabase
        .from('journal_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('note_date', dateString)
        .single();

      if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = not found
        throw selectError;
      }

      const trimmedNote = note.trim();

      if (existing) {
        if (trimmedNote === '') {
          // Delete empty note
          const { error: deleteError } = await supabase
            .from('journal_notes')
            .delete()
            .eq('id', existing.id)
            .eq('user_id', user.id);

          if (deleteError) throw deleteError;
        } else {
          // Update existing note
          const { error: updateError } = await supabase
            .from('journal_notes')
            .update({ note: trimmedNote })
            .eq('id', existing.id)
            .eq('user_id', user.id);

          if (updateError) throw updateError;
        }
      } else if (trimmedNote !== '') {
        // Create new note
        const { error: insertError } = await supabase
          .from('journal_notes')
          .insert({
            user_id: user.id,
            note_date: dateString,
            note: trimmedNote
          });

        if (insertError) throw insertError;
      }

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