import React, { useEffect, useState } from 'react';

import NoteList from './NoteList';
import NotesCreateModal from './modals/NotesCreateModal';
import NotesForm from './NotesForm';
import NotesPanel from './NotesPanel';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

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
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Cargar notas al montar (de Supabase si hay usuario, si no de localStorage)
  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      setError(null);
      if (user) {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
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
    if (user) {
      const { data, error } = await supabase
        .from('notes')
        .insert([{ ...note, user_id: user.id }])
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

  // Handler para borrar nota
  const handleDelete = async (note: Note) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    setLoading(true);
    setError(null);
    if (user && note.id) {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', note.id);
      if (error) setError('Error deleting note');
      else setNotes(notes.filter(n => n.id !== note.id));
    } else if (note.id) {
      setNotes(notes.filter(n => n.id !== note.id));
    }
    setLoading(false);
  };

  return (
    <div className="w-full mx-auto p-6 mt-8 relative">
      <button
        className="fixed bottom-8 right-8 z-50 bg-[var(--accent-primary)] text-white rounded-full w-14 h-14 flex items-center justify-center text-3xl shadow-lg hover:bg-blue-700 transition-colors"
        onClick={() => setShowCreateModal(true)}
        aria-label="Add Note"
      >
        +
      </button>
      <NotesCreateModal
        isOpen={showCreateModal || showEditModal}
        onClose={() => { setShowCreateModal(false); setShowEditModal(false); setEditNote(null); setEditingId(null); }}
        onAdd={showEditModal ? handleSaveEdit : handleAddNote}
        loading={loading}
        initialValues={showEditModal && editNote ? editNote : undefined}
        isEdit={showEditModal}
      />
      <div className="">
        <NotesPanel
          notes={notes as Note[]}
          loading={loading}
          error={error}
          onEdit={handleEdit}
          onDelete={handleDelete}
          editingId={editingId}
          editForm={null}
        />
      </div>
    </div>
  );
};

export default Notes;
