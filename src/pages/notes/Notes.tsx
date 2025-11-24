import { ChevronFirst, ChevronLast } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import DeleteNoteModal from '../../modals/DeleteNoteModal';
import LoginPromptModal from '../../modals/LoginPromptModal';
import NoteView from './NoteView';
import NotesSidepanel from './NotesSidepanel';
import WelcomeView from './WelcomeView';
import { demoNotes } from '@/utils/demoData';
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
  const { isDemo } = useDemoMode();
  const {
    loginPromptOpen,
    closeLoginPrompt,
  } = useDemoMode();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | undefined>(undefined);
  const [isSidepanelCollapsed, setIsSidepanelCollapsed] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

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

  const handleAddNoteWithId = async (noteData: Omit<Note, 'id'>): Promise<string | null> => {
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
          return (data as Note).id || null;
        }
        return null;
      } else {
        const newNote: Note = {
          id: Date.now().toString(),
          title: noteData.title || '',
          assignment: noteData.assignment ?? null,
          description: noteData.description || '',
          date: safeDate
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
    if (user) {
      const { data, error: updateError } = await supabase
        .from('notes')
        .update(note)
        .eq('id', noteId)
        .select()
        .single();
      if (updateError) {
        setError(updateError.message);
      } else if (data) {
        setNotes(notes.map(n => n.id === noteId ? data as Note : n));
      }
    } else {
      setNotes(notes.map(n => n.id === noteId ? { ...n, ...note } as Note : n));
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

  const handleNoteSelect = (noteId: string) => {
    setSelectedNoteId(noteId === selectedNoteId ? undefined : noteId);
  };

  const handleBackToNotes = () => {
    setSelectedNoteId(undefined);
  };

  const handleCreateNote = async () => {
    const today = new Date().toISOString().split('T')[0];
    const newNote: Omit<Note, 'id'> = {
      title: 'New Note',
      assignment: '',
      description: 'Here goes your text',
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
    <React.Fragment>
      <div className="w-full h-full relative">
        {/* Sidepanel - Fixed positioning, below navbar, responsive */}
        <div 
          className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] z-10 transition-all duration-300 md:block hidden ${
            isSidepanelCollapsed ? 'w-12' : 'w-80'
          }`}
        >
          {/* Toggle Button */}
          <button
            onClick={() => setIsSidepanelCollapsed(!isSidepanelCollapsed)}
            className={`absolute right-2 top-4 w-8 h-8 text-[var(--accent-primary)] flex items-center justify-center rounded hover:bg-[var(--accent-primary)]/10 transition-colors focus:outline-none z-20 ${
              isSidepanelCollapsed ? 'ml-2' : ''
            }`}
            title={isSidepanelCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {isSidepanelCollapsed ? (
              <ChevronLast size={24} />
            ) : (
              <ChevronFirst size={24} />
            )}
          </button>
          
          {!isSidepanelCollapsed && (
            <NotesSidepanel
              notes={notesToShow}
              loading={loading}
              error={error}
              onNoteSelect={handleNoteSelect}
              selectedNoteId={selectedNoteId}
              onDelete={(note) => setNoteToDelete(note)}
              onCreateNote={handleCreateNote}
            />
          )}
        </div>
        
        {/* Main Content Container - Separate from sidepanel */}
        <div className={`w-full h-full transition-all duration-300 ${
          isSidepanelCollapsed ? 'md:pl-12' : 'md:pl-80'
        }`}>
          {selectedNote ? (
            <NoteView
              note={selectedNote}
              onSave={selectedNote?.id ? handleUpdateNote : handleAddNote}
              onDelete={(note) => setNoteToDelete(note)}
              onBack={handleBackToNotes}
              allNotes={notesToShow}
              onNoteSelect={handleNoteSelect}
              selectedNoteId={selectedNoteId}
              onDeleteNote={(note) => setNoteToDelete(note)}
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
  );
};

export default Notes;
