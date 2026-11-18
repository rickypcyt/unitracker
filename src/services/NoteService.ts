import { supabase } from '@/utils/supabaseClient';
import type { Note, CreateNoteInput, UpdateNoteInput } from '@/schemas/note';

// Caching and request de-duplication are handled by TanStack Query (see Notes.tsx)
export class NoteService {
  static async fetchNotes(userId: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('last_edited', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Note[];
  }

  static async createNote(noteData: CreateNoteInput & { user_id: string }): Promise<Note> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('notes')
      .insert([{
        title: noteData.title || '',
        assignment: noteData.assignment ?? null,
        ...(noteData.subject_id ? { subject_id: noteData.subject_id } : {}),
        description: noteData.description ?? '',
        date: noteData.date,
        user_id: noteData.user_id,
        last_edited: now,
      }])
      .select()
      .single();

    if (error) throw error;

    return data as Note;
  }

  static async updateNote(noteId: string, updates: Partial<UpdateNoteInput>, _userId?: string): Promise<Note> {
    const updatedNote = {
      ...updates,
      last_edited: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('notes')
      .update(updatedNote)
      .eq('id', noteId)
      .select()
      .single();

    if (error) throw error;

    return data as Note;
  }

  static async deleteNote(noteId: string, _userId?: string): Promise<void> {
    const { error } = await supabase.from('notes').delete().eq('id', noteId);
    if (error) throw error;
  }
}
