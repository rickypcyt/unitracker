import React, { useEffect, useState } from 'react';

import DeleteNoteModal from '../../modals/DeleteNoteModal';
import { FileText } from 'lucide-react';
import Footer from '../../components/Footer';
import LoginPromptModal from '../../modals/LoginPromptModal';
import NoteView from './NoteView';
import NotesSidepanel from './NotesSidepanel';
import Sidepanel from '../../components/Sidepanel';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | undefined>(undefined);
  const [isSidepanelCollapsed, setIsSidepanelCollapsed] = useState(true);
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
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .order('last_edited', { ascending: false });
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
      
      const now = new Date().toISOString();
      if (user) {
        const { data, error: insertError } = await supabase
          .from('notes')
          .insert([{ 
            title: noteData.title || '',
            assignment: noteData.assignment ?? null,
            description: noteData.description || '',
            date: safeDate,
            user_id: user.id,
            created_at: now,
            last_edited: now
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
      const { data, error: updateError } = await supabase
        .from('notes')
        .update(updatedNote)
        .eq('id', noteId)
        .select()
        .single();
      if (updateError) {
        setError(updateError.message);
      } else if (data) {
        setNotes(notes.map(n => n.id === noteId ? data as Note : n));
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

  const handleCreateNote = async (assignment?: string) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    const today = new Date().toISOString().split('T')[0];
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
    <React.Fragment>
      <div className="w-full min-h-screen relative pb-16">
        {/* Left Sidepanel */}
        <Sidepanel
          position="left"
          isCollapsed={isSidepanelCollapsed}
          onToggle={() => setIsSidepanelCollapsed(!isSidepanelCollapsed)}
          width={80}
          collapsedWidth={12}
          toggleTitle={{ expand: 'Expand panel', collapse: 'Collapse panel' }}
          title={
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <FileText size={20} />
                Note Explorer
              </h2>
              <p className="text-base text-[var(--text-secondary)]">
                {notesToShow.length} {notesToShow.length === 1 ? 'note' : 'notes'}
              </p>
            </div>
          }
        >
          <NotesSidepanel
            notes={notesToShow}
            loading={loading}
            error={error}
            onNoteSelect={handleNoteSelect}
            selectedNoteId={selectedNoteId}
            onCreateNote={handleCreateNote}
          />
        </Sidepanel>


        {/* Main Content Container - Separate from sidepanels */}
        <div className={`w-full h-full transition-all duration-300 ${
          isSidepanelCollapsed ? 'md:pl-12' : 'md:pl-80'
        }`}>
          {selectedNote ? (
            <NoteView
              note={selectedNote}
              onSave={selectedNote?.id ? handleUpdateNote : handleAddNote}
              onDelete={(note) => setNoteToDelete(note)}
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
      <Footer
        showActions={!!selectedNote}
        onBackToNotes={handleBackToNotes}
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
  );
};

export default Notes;
