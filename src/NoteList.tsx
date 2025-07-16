import { Pencil, Trash2 } from 'lucide-react';

import React from 'react';
import ReactMarkdown from 'react-markdown';

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

const getGridClass = (count: number) => {
  if (count === 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-2';
  if (count === 3) return 'grid-cols-2 grid-rows-2';
  if (count === 4) return 'grid-cols-2';
  if (count <= 6) return 'grid-cols-3';
  return 'grid-cols-4';
};

const NoteList: React.FC<NoteListProps> = ({ notes, loading, error, onEdit, onDelete, editingId, editForm }) => {
  const gridClass = getGridClass(notes.length);
  return (
    <div className={`grid ${gridClass} gap-6 justify-items-center w-full max-w-5xl mx-auto`}>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {loading && notes.length === 0 ? (
        <p className="text-[var(--text-secondary)]">Loading...</p>
      ) : notes.length === 0 ? (
        <p className="text-[var(--text-secondary)]">No notes yet.</p>
      ) : (
        notes.map((note, idx) => (
          <div
            key={note.id || note.title + note.date}
            className={`maincard p-4 border-2 border-[var(--accent-primary)] rounded-xl flex flex-col justify-between w-80 max-w-xs mx-auto items-center
              ${notes.length === 3 && idx === 2 ? 'col-span-2 mx-auto' : ''}`}
          >
            <div className="flex justify-center items-center mb-1 w-full">
              <span className="font-bold text-lg text-[var(--text-primary)] text-center w-full">{note.title}</span>
            </div>
            {note.assignment && (
              <div className="text-base  text-[var(--accent-primary)] mb-1"> {note.assignment}</div>
            )}
            <div className="text-[var(--text-secondary)] whitespace-pre-line mb-2 w-full prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: note.description }}
            />
            <div className="flex justify-center w-full">
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
};

export default NoteList; 