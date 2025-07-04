import { Pencil, Trash2 } from 'lucide-react';

import React from 'react';

interface Note {
  id?: string;
  title: string;
  assignment: string;
  description: string;
  date: string;
  user_id?: string;
}

interface NoteListProps {
  notes: Note[];
  loading: boolean;
  error: string | null;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  editingId: string | null;
  editForm: React.ReactNode;
}

const NoteList: React.FC<NoteListProps> = ({ notes, loading, error, onEdit, onDelete, editingId, editForm }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-6 justify-items-start">
    {error && <div className="text-red-500 mb-4">{error}</div>}
    {loading && notes.length === 0 ? (
      <p className="text-[var(--text-secondary)]">Loading...</p>
    ) : notes.length === 0 ? (
      <p className="text-[var(--text-secondary)]">No notes yet.</p>
    ) : (
      notes.map(note => (
        <div key={note.id || note.title + note.date} className="maincard p-4 border-2 border-[var(--accent-primary)] rounded-xl flex flex-col justify-between min-h-[200px] h-[200px] max-w-[260px] w-full mx-auto items-center">
          <div className="flex justify-center items-center mb-1 w-full">
            <span className="font-bold text-lg text-[var(--text-primary)] text-center w-full">{note.title}</span>
          </div>
          {note.assignment && (
            <div className="text-base  text-[var(--accent-primary)] mb-1"> {note.assignment}</div>
          )}
          <div className="text-[var(--text-secondary)] whitespace-pre-line mb-2">{note.description}</div>
          <div className="flex justify-center w-full mt-1">
            <span className="text-base text-[var(--text-secondary)]">{note.date}</span>
          </div>
          <div className="flex gap-4 mt-2">
            <button
              className="text-[var(--accent-primary)] hover:text-blue-400 p-1 rounded-full"
              onClick={() => onEdit(note)}
              aria-label="Edit note"
              title="Edit"
            >
              <Pencil size={20} />
            </button>
            <button
              className="text-red-500 hover:text-red-400 p-1 rounded-full"
              onClick={() => onDelete(note)}
              aria-label="Delete note"
              title="Delete"
            >
              <Trash2 size={20} />
            </button>
          </div>
          {editingId === note.id && (
            <div className="mt-4">{editForm}</div>
          )}
        </div>
      ))
    )}
  </div>
);

export default NoteList; 