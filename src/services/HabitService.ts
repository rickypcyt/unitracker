import { supabase } from '@/utils/supabaseClient';

export class HabitService {
  static async fetchHabits(userId: string) {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  static async fetchCompletions(userId: string, habitIds: string[]) {
    if (habitIds.length === 0) return [];
    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId)
      .in('habit_id', habitIds);

    if (error) throw error;
    return data ?? [];
  }

  static async fetchJournalNotes(userId: string) {
    const { data, error } = await supabase
      .from('journal_notes')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data ?? [];
  }

  static async createHabit(userId: string, name: string) {
    const { data, error } = await supabase
      .from('habits')
      .insert({ user_id: userId, name: name.trim() })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateHabit(habitId: string, userId: string, newName: string) {
    const { error } = await supabase
      .from('habits')
      .update({ name: newName.trim() })
      .eq('id', habitId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  static async deleteHabit(habitId: string, userId: string) {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  static async toggleCompletion(habitId: string, userId: string, dateString: string) {
    const { data: existing, error: selectError } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('habit_id', habitId)
      .eq('completion_date', dateString)
      .eq('user_id', userId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') throw selectError;

    const newCompletedState = !existing?.completed;

    if (existing) {
      const { error: updateError } = await supabase
        .from('habit_completions')
        .update({ completed: newCompletedState })
        .eq('id', existing.id)
        .eq('user_id', userId);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('habit_completions')
        .insert({
          habit_id: habitId,
          user_id: userId,
          completion_date: dateString,
          completed: newCompletedState
        });

      if (insertError) throw insertError;
    }

    return newCompletedState;
  }

  static async saveJournalNote(userId: string, dateString: string, note: string) {
    const { data: existing, error: selectError } = await supabase
      .from('journal_notes')
      .select('*')
      .eq('user_id', userId)
      .eq('note_date', dateString)
      .single();

    if (selectError && selectError.code !== 'PGRST116') throw selectError;

    const trimmedNote = note.trim();

    if (existing) {
      if (trimmedNote === '') {
        const { error: deleteError } = await supabase
          .from('journal_notes')
          .delete()
          .eq('id', existing.id)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;
      } else {
        const { error: updateError } = await supabase
          .from('journal_notes')
          .update({ note: trimmedNote })
          .eq('id', existing.id)
          .eq('user_id', userId);

        if (updateError) throw updateError;
      }
    } else if (trimmedNote !== '') {
      const { error: insertError } = await supabase
        .from('journal_notes')
        .insert({
          user_id: userId,
          note_date: dateString,
          note: trimmedNote
        });

      if (insertError) throw insertError;
    }
  }
}
