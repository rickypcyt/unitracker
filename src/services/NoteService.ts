import { supabase } from '@/utils/supabaseClient';
import type { Note, CreateNoteInput, UpdateNoteInput } from '@/schemas/note';

const NOTES_CACHE_TTL = 30 * 1000; // 30 seconds
const notesCache = new Map<string, { notes: Note[]; savedAt: number }>();
const ongoingNoteRequests = new Map<string, Promise<Note[]>>();

export class NoteService {
  static async fetchNotes(userId: string, forceRefresh: boolean = false): Promise<Note[]> {
    const requestKey = `${userId}-${forceRefresh ? 'force' : 'cached'}`;

    if (ongoingNoteRequests.has(requestKey)) {
      return ongoingNoteRequests.get(requestKey)!;
    }

    const requestPromise = (async () => {
      // Check cache first
      if (!forceRefresh) {
        const cached = notesCache.get(userId);
        if (cached && Date.now() - cached.savedAt < NOTES_CACHE_TTL) {
          return cached.notes;
        }
      }

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('last_edited', { ascending: false });

      if (error) throw error;

      const notes = (data ?? []) as Note[];
      notesCache.set(userId, { notes, savedAt: Date.now() });

      return notes;
    })();

    ongoingNoteRequests.set(requestKey, requestPromise);
    try {
      return await requestPromise;
    } finally {
      ongoingNoteRequests.delete(requestKey);
    }
  }

  static invalidateCache(userId: string): void {
    notesCache.delete(userId);
  }

  static async createNote(noteData: CreateNoteInput & { user_id: string }): Promise<Note> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('notes')
      .insert([{
        title: noteData.title || '',
        assignment: noteData.assignment ?? null,
        subject_id: noteData.subject_id ?? null,
        description: noteData.description ?? '',
        date: noteData.date,
        user_id: noteData.user_id,
        last_edited: now,
      }])
      .select()
      .single();

    if (error) throw error;

    // Invalidate cache after creating
    this.invalidateCache(noteData.user_id);

    return data as Note;
  }

  static async updateNote(noteId: string, updates: Partial<UpdateNoteInput>, userId: string): Promise<Note> {
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

    // Invalidate cache after updating
    this.invalidateCache(userId);

    return data as Note;
  }

  static async deleteNote(noteId: string, userId: string): Promise<void> {
    const { error } = await supabase.from('notes').delete().eq('id', noteId);
    if (error) throw error;

    // Invalidate cache after deleting
    this.invalidateCache(userId);
  }
}
