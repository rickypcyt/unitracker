import React, { useEffect, useState } from 'react';

import DeleteNoteModal from '../../modals/DeleteNoteModal';
import Footer from '../../components/Footer';
import { Helmet } from "react-helmet-async";
import LoginPromptModal from '../../modals/LoginPromptModal';
import NoteView from './NoteView';
import WelcomeView from './WelcomeView';
import { demoNotes } from '@/utils/demoData';
import { getLocalDateString } from '@/utils/dateUtils';
import { useAuth } from '@/hooks/useAuth';
import useDemoMode from '@/utils/useDemoMode';
import { NoteService } from '@/services/NoteService';

interface Note {
  id?: string;
  title: string;
  assignment: string | null;
  description: string;
  date?: string | undefined;
  user_id?: string;
  created_at?: string;
  last_edited?: string;
}


const Notes: React.FC = () => {
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  const {
    loginPromptOpen,
    closeLoginPrompt,
  } = useDemoMode();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | undefined>(undefined);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Cargar notas al montar (de Supabase si hay usuario, si no de localStorage)
  useEffect(() => {
    const fetchNotes = async (): Promise<void> => {
      setError(null);
      // Safely extract user id without using any
      const userId: string | undefined = (user && typeof user === 'object' && 'id' in (user as object))
        ? (user as { id?: string }).id
        : undefined;
      if (userId) {
        try {
          const data = await NoteService.fetchNotes(userId);
          setNotes(data as Note[]);
        } catch {
          setError('Error loading notes');
        }
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

  const handleAddNoteWithId = async (noteData: Omit<Note, 'id'>): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const safeDate = getSafeDate(noteData.date);
      
      const now = new Date().toISOString();
      if (user) {
        try {
          const data = await NoteService.createNote({
            title: noteData.title || '',
            assignment: noteData.assignment ?? null,
            description: noteData.description || '',
            date: safeDate,
            user_id: user.id,
          });
          setNotes([data as Note, ...notes]);
          return (data as Note).id || null;
        } catch (err) {
          throw err;
        }
      } else {
        const now = new Date().toISOString();
        const newNote: Note = {
          id: Date.now().toString(),
          title: noteData.title || '',
          assignment: noteData.assignment ?? null,
          description: noteData.description || '',
          date: safeDate,
          created_at: now,
          last_edited: now
        };
        setNotes([newNote, ...notes]);
        return newNote.id || null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (noteData: Omit<Note, 'id'>): Promise<void> => {
    await handleAddNoteWithId(noteData);
  };

  // Handler para actualizar nota
  const handleUpdateNote = async (note: Omit<Note, 'id'>): Promise<void> => {
    const noteId = selectedNote?.id;
    if (!noteId) return;
    
    setLoading(true);
    setError(null);
    
    const updatedNote = {
      ...note,
      last_edited: new Date().toISOString()
    };
    
    if (user) {
      try {
        const data = await NoteService.updateNote(noteId, updatedNote);
        setNotes(notes.map(n => n.id === noteId ? data as Note : n));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error updating note');
      }
    } else {
      setNotes(notes.map(n => n.id === noteId ? { ...n, ...updatedNote } as Note : n));
    }
    setLoading(false);
  };

  // Handler para eliminar nota
  const confirmDeleteNote = async (): Promise<void> => {
    if (!noteToDelete?.id) return;
    
    setLoading(true);
    setError(null);
    try {
      if (user) {
        await NoteService.deleteNote(noteToDelete.id);
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

  const handleNoteSelect = (noteId: string) => {
    setSelectedNoteId(noteId === selectedNoteId ? undefined : noteId);
  };

  const handleCreateNote = async (assignment?: string) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    const today = getLocalDateString();
    const newNote: Omit<Note, 'id'> = {
      title: 'New Note',
      assignment: assignment || '',
      description: '',
      date: today || ''
    };
    
    const newNoteId = await handleAddNoteWithId(newNote);
    
    // Select the newly created note using its ID
    if (newNoteId) {
      setSelectedNoteId(newNoteId);
    }
  };

  const selectedNote = selectedNoteId ? notesToShow.find((note: Note) => note.id === selectedNoteId) : null;

  return (
    <>
      <Helmet>
        <title>Study Notes & Note Taking | UniTracker 2026</title>
        <meta
          name="description"
          content="Take and organize study notes digitally. Create rich text notes, organize by assignments, and access your study materials anywhere."
        />
        <meta
          name="keywords"
          content="study notes, note taking, digital notes, assignment notes, study materials, note organization, rich text notes"
        />
        <meta property="og:title" content="Study Notes & Note Taking | UniTracker 2026" />
        <meta
          property="og:description"
          content="Take and organize study notes digitally. Create rich text notes, organize by assignments, and access your study materials anywhere."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://unitracker.me/notes" />
        <link rel="canonical" href="https://unitracker.me/notes" />
      </Helmet>
      <React.Fragment>
        <div className="w-full min-h-screen relative pb-16">
        {/* Main Content Container */}
        <div className="w-full h-full">
          {selectedNote ? (
            <NoteView
              note={selectedNote}
              onSave={selectedNote?.id ? handleUpdateNote : handleAddNote}
              onDelete={(note) => setNoteToDelete(note)}
              allNotes={notesToShow}
              onNoteSelect={handleNoteSelect}
              selectedNoteId={selectedNoteId}
              onDeleteNote={(note) => setNoteToDelete(note)}
              onBack={() => setSelectedNoteId(undefined)}
            />
          ) : (
            <WelcomeView
              onCreateNote={handleCreateNote}
              notes={notesToShow}
              loading={loading}
              error={error}
              onNoteSelect={handleNoteSelect}
              selectedNoteId={selectedNoteId}
              onDelete={(note) => setNoteToDelete(note)}
            />
          )}
        </div>
      </div>
      <Footer
        showActions={!!selectedNote}
        {...(selectedNote && {
          onSave: () => { handleUpdateNote({ title: selectedNote.title, assignment: selectedNote.assignment, description: selectedNote.description, date: selectedNote.date }); },
          onDelete: () => { setNoteToDelete(selectedNote); }
        })}
      />

    {/* Modals - always rendered */}
    <LoginPromptModal
      isOpen={showLoginModal || loginPromptOpen}
      onClose={() => { setShowLoginModal(false); closeLoginPrompt(); }}
    />
    <DeleteNoteModal
      isOpen={!!noteToDelete}
      onClose={() => setNoteToDelete(null)}
      onConfirm={confirmDeleteNote}
      noteTitle={noteToDelete?.title || ''}
    />
      </React.Fragment>
    </>
  );
};

export default Notes;
