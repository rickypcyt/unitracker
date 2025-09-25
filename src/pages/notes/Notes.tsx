import React, { useEffect, useState } from 'react';

import DeleteNoteModal from '../../modals/DeleteNoteModal';
import LoginPromptModal from '../../modals/LoginPromptModal';
import NoteList from './NoteList';
import NotesCreateModal from '../../modals/NotesCreateModal';
import { Plus } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import useDemoMode from '@/utils/useDemoMode';

interface Note {
  id?: string;
  title: string;
  assignment: string | null;
  description: string;
  date: string;
  user_id?: string;
}


const Notes: React.FC = () => {
  const { user } = useAuth();
  const {
    isDemo,
    demoNotes,
    loginPromptOpen,
    showLoginPrompt,
    closeLoginPrompt,
  } = useDemoMode();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editNote, setEditNote] = useState<Partial<Note> | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  // Cargar notas al montar (de Supabase si hay usuario, si no de localStorage)
  useEffect(() => {
    setLoading(true); // Always show spinner on mount/user change
    const fetchNotes = async (): Promise<void> => {
      setError(null);
      // Safely extract user id without using any
      const userId: string | undefined = (user && typeof user === 'object' && 'id' in (user as object))
        ? (user as { id?: string }).id
        : undefined;
      if (userId) {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (error) setError('Error loading notes');
        else setNotes((data as Note[]) || []);
      } else {
        const saved = localStorage.getItem('notes');
        setNotes(saved ? JSON.parse(saved) : []);
      }
      setLoading(false);
    };
    fetchNotes();
  }, [user]);

  // Guardar en localStorage si no hay usuario
  useEffect(() => {
    if (!user) {
      localStorage.setItem('notes', JSON.stringify(notes));
    }
  }, [notes, user]);

  // Handler para agregar nota
  const getSafeDate = (dateStr: string | null | undefined): string => {
    if (dateStr && dateStr.trim().length > 0) {
      return dateStr;
    }
    // Return current date in YYYY-MM-DD format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleAddNote = async (noteData: Omit<Note, 'id'>): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const safeDate = getSafeDate(noteData.date);
      
      if (user) {
        const { data, error: insertError } = await supabase
          .from('notes')
          .insert([{ 
            title: noteData.title || '',
            assignment: noteData.assignment ?? null,
            description: noteData.description || '',
            date: safeDate,
            user_id: user.id 
          }])
          .select()
          .single();
          
        if (insertError) throw insertError;
        if (data) {
          setNotes([data as Note, ...notes]);
        }
      } else {
        const newNote: Note = {
          id: Date.now().toString(),
          title: noteData.title || '',
          assignment: noteData.assignment ?? null,
          description: noteData.description || '',
          date: safeDate
        };
        setNotes([newNote, ...notes]);
      }
      setEditNote(null);
      setShowCreateModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handler para iniciar edición
  const handleUpdateNote = async (note: Omit<Note, 'id'>): Promise<void> => {
    if (!editNote?.id) return;
    setLoading(true);
    setError(null);
    if (user) {
      const { data, error: updateError } = await supabase
        .from('notes')
        .update(note)
        .eq('id', editNote.id)
        .select()
        .single();
      if (updateError) {
        setError(updateError.message);
      } else if (data) {
        setNotes(notes.map(n => n.id === editNote.id ? data as Note : n));
      }
    } else {
      setNotes(notes.map(n => n.id === editNote.id ? { ...n, ...note } as Note : n));
    }
    setEditNote(null);
    setShowCreateModal(false);
    setLoading(false);
  };

  const handleEditNote = (note: Note): void => {
    setEditNote(note);
    setShowCreateModal(true);
  };

  // Handler para eliminar nota
  const confirmDeleteNote = async (): Promise<void> => {
    if (!noteToDelete?.id) return;
    
    setLoading(true);
    setError(null);
    try {
      if (user) {
        const { error } = await supabase
          .from('notes')
          .delete()
          .eq('id', noteToDelete.id);
        if (error) {
          throw error;
        }
      }
      setNotes(notes.filter(n => n.id !== noteToDelete.id));
      setNoteToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting note');
    } finally {
      setLoading(false);
    }
  };

  const notesToShow = isDemo ? demoNotes : notes;

  return (
    <div className="w-full  px-3 sm:px-4 md:px-3 lg:px-6 session-page mt-4">
      <button
        onClick={() => {
          if (isDemo) showLoginPrompt();
          else if (!user) setShowLoginModal(true);
          else setShowCreateModal(true);
        }}
        className="fixed bottom-6 right-6 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-transparent border-2 border-dashed border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-lg hover:bg-[var(--accent-primary)]/10 transition-colors flex items-center justify-center z-50"
        aria-label="Add Note"
      >
        <Plus className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9" />
      </button>
      <NotesCreateModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditNote(null);
        }}
        onAdd={editNote?.id ? handleUpdateNote : handleAddNote}
        loading={loading}
        initialValues={{
          title: editNote?.title ?? '',
          assignment: editNote?.assignment ?? '',
          description: editNote?.description ?? '',
          date: editNote?.date ?? new Date().toISOString().split('T')[0]
        } as Partial<Note>}
        isEdit={!!editNote?.id}
      />
      <LoginPromptModal
        isOpen={showLoginModal || loginPromptOpen}
        onClose={() => { setShowLoginModal(false); closeLoginPrompt(); }}
      />
      <NoteList
        notes={notesToShow}
        loading={loading}
        error={error}
        onEdit={handleEditNote}
        onDelete={(note) => setNoteToDelete(note)}
        editingId={null}
        editForm={null}
      />
      <DeleteNoteModal
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={confirmDeleteNote}
        noteTitle={noteToDelete?.title}
      />
    </div>
  );
};

export default Notes;
