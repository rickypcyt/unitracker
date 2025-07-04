import NoteList from './NoteList';
import React from 'react';

interface Note {
  id?: string;
  title: string;
  assignment: string;
  description: string;
  date: string;
  user_id?: string;
}

interface NotesPanelProps {
  notes: Note[];
  loading: boolean;
  error: string | null;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

const NotesPanel: React.FC<NotesPanelProps> = ({ notes, loading, error, onEdit, onDelete }) => (
  <div className="space-y-4">
    <NoteList
      notes={notes}
      loading={loading}
      error={error}
      onEdit={onEdit}
      onDelete={onDelete}
      editingId={null}
      editForm={null}
    />
  </div>
);

export default NotesPanel; 