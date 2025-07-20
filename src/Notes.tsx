import React, { useEffect, useState } from 'react';

import DeleteCompletedModal from './modals/DeleteTasksPop';
import LoginPromptModal from './modals/LoginPromptModal';
import NoteList from './NoteList';
import NotesCreateModal from './modals/NotesCreateModal';
import NotesForm from './NotesForm';
import NotesPanel from './NotesPanel';
import { Plus } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import useDemoMode from '@/utils/useDemoMode';

interface Note {
  id?: string;
  title: string;
  assignment: string;
  description: string;
  date: string;
  user_id?: string;
}

const getToday = () => new Date().toISOString().slice(0, 10);

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Cargar notas al montar (de Supabase si hay usuario, si no de localStorage)
  useEffect(() => {
    setLoading(true); // Always show spinner on mount/user change
    const fetchNotes = async () => {
      setError(null);
      if (user && (user as any).id) {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', (user as any).id)
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
  const handleAddNote = async (note: Omit<Note, 'id'>) => {
    setLoading(true);
    setError(null);
    if (user && (user as any).id) {
      const { data, error } = await supabase
        .from('notes')
        .insert([{ ...note, user_id: (user as any).id }])
        .select()
        .single();
      if (error) setError('Error saving note');
      else setNotes([(data as Note), ...notes]);
    } else {
      setNotes([{ ...note, id: Date.now().toString() }, ...notes]);
    }
    setLoading(false);
    setShowCreateModal(false);
  };

  // Handler para iniciar edición
  const handleEdit = (note: Note) => {
    setEditingId(note.id || null);
    setEditNote(note);
    setShowEditModal(true);
  };

  // Handler para guardar edición
  const handleSaveEdit = async (updated: Omit<Note, 'id'>) => {
    if (!editNote) return;
    setLoading(true);
    setError(null);
    if (user && editNote.id) {
      const { data, error } = await supabase
        .from('notes')
        .update({ ...updated })
        .eq('id', editNote.id)
        .select()
        .single();
      if (error) setError('Error updating note');
      else setNotes(notes.map(n => n.id === editNote.id ? (data as Note) : n));
    } else if (editNote.id) {
      setNotes(notes.map(n => n.id === editNote.id ? { ...n, ...updated } : n));
    }
    setEditingId(null);
    setEditNote(null);
    setShowEditModal(false);
    setLoading(false);
  };

  // Handler para cancelar edición
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditNote(null);
    setShowEditModal(false);
  };

  // Confirm delete modal state
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  // Handler para borrar nota (abre modal)
  const handleDelete = (note: Note) => {
    setNoteToDelete(note);
  };

  // Confirmación real de borrado
  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    setLoading(true);
    setError(null);
    if (user && noteToDelete.id) {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteToDelete.id);
      if (error) setError('Error deleting note');
      else setNotes(notes.filter(n => n.id !== noteToDelete.id));
    } else if (noteToDelete.id) {
      setNotes(notes.filter(n => n.id !== noteToDelete.id));
    }
    setLoading(false);
    setNoteToDelete(null);
  };

  // Usar demoNotes si isDemo
  const notesToShow = isDemo ? demoNotes : notes;

  return (
    <div className="w-full mx-auto p-6 mt-3 relative">
      {/* Floating Action Button - estilo dashed, border, animación bacán */}
      <button
        onClick={() => {
          if (isDemo) showLoginPrompt();
          else if (!user) setShowLoginModal(true);
          else setShowCreateModal(true);
        }}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-transparent border-2 border-dashed border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-lg hover:bg-[var(--accent-primary)]/10 transition-colors flex items-center justify-center z-50"
        aria-label="Add Note"
      >
        <Plus size={32} />
      </button>
      <NotesCreateModal
        isOpen={showCreateModal || showEditModal}
        onClose={() => { setShowCreateModal(false); setShowEditModal(false); setEditNote(null); setEditingId(null); }}
        onAdd={showEditModal ? handleSaveEdit : handleAddNote}
        loading={loading}
        initialValues={showEditModal && editNote ? editNote : undefined}
        isEdit={showEditModal}
      />
      <LoginPromptModal
        isOpen={showLoginModal || loginPromptOpen}
        onClose={() => { setShowLoginModal(false); closeLoginPrompt(); }}
      />
      <div className="">
        <NotesPanel
          notes={notesToShow as Note[]}
          loading={loading}
          error={error}
          onEdit={isDemo ? showLoginPrompt : handleEdit}
          onDelete={isDemo ? showLoginPrompt : handleDelete}
        />
      </div>
      {noteToDelete && (
        <DeleteCompletedModal
          onClose={() => setNoteToDelete(null)}
          onConfirm={confirmDeleteNote}
          message={`Are you sure you want to delete the note "${noteToDelete.title || 'Untitled'}"? This action cannot be undone.`}
          confirmButtonText="Delete Note"
        />
      )}
    </div>
  );
};

export default Notes;
