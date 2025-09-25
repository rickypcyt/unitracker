import { Calendar, Pencil, Trash2 } from 'lucide-react';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Note {
  id?: string;
  title: string;
  assignment: string | null;
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

const NoteList: React.FC<NoteListProps> = ({ notes, loading, error, onEdit, onDelete, editingId, editForm }) => {
  const { isLoggedIn } = useAuth();
  // Solo mostrar el spinner si loading y aún no se sabe si hay notas (notes.length === 0)
  if (loading && notes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading notes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <p className="text-[var(--text-secondary)]">Failed to load notes</p>
        </div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Pencil className="mx-auto mb-4 w-10 h-10 text-[var(--accent-primary)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No notes yet</h3>
          <p className="text-[var(--text-secondary)]">Create your first note to get started</p>
          {!isLoggedIn && (
            <p className="text-sm text-[var(--text-secondary)] opacity-70 mt-2">
              Remember to login first
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 md:gap-5 lg:gap-6 justify-items-stretch">
        {notes.map((note) => (
          <div
            key={note.id || note.title + note.date}
            className="relative flex flex-col w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-1.5 sm:p-2 shadow-sm hover:shadow-lg hover:border-[var(--accent-primary)]/70 transition-all duration-200 group aspect-square"
            onDoubleClick={() => onEdit(note)}
            tabIndex={0}
            role="button"
            aria-label="Edit note"
          >
            {/* Card Header */}
            <div className="mb-2 flex flex-col gap-1">
              <h3 className="font-semibold text-lg text-[var(--text-primary)] truncate mb-1">
                {note.title}
              </h3>
              <span className="inline-block py-0.5 rounded-full text-sm font-medium bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] max-w-full truncate">
                {note.assignment ?? 'None'}
              </span>
            </div>

            {/* Card Content */}
            <div className="mb-1.5 flex-1 overflow-hidden relative">
              {note.description && note.description.includes('<') ? (
                <div
                  className="text-[var(--text-primary)] dark:text-white text-sm sm:text-base leading-relaxed break-words prose dark:prose-invert space-y-1 prose-p:my-1 prose-p:whitespace-pre-wrap prose-ul:my-1 prose-ol:my-1 prose-ul:list-disc prose-ol:list-decimal prose-li:my-0 prose-li:whitespace-pre-wrap prose-headings:mt-1 prose-headings:mb-2 max-w-none overflow-hidden bg-transparent p-0 border-0 shadow-none rounded-none h-full pl-4"
                  style={{ border: 'none', borderRadius: 0, background: 'transparent', boxShadow: 'none', padding: 0 }}
                  dangerouslySetInnerHTML={{ __html: note.description }}
                />
              ) : (
                <div
                  className="text-[var(--text-primary)] dark:text-white text-sm sm:text-base leading-relaxed break-words whitespace-pre-line max-w-none overflow-hidden bg-transparent p-0 border-0 shadow-none rounded-none h-full"
                  style={{ border: 'none', borderRadius: 0, background: 'transparent', boxShadow: 'none', padding: 0 }}
                >
                  {note.description}
                </div>
              )}
              {/* Fade bottom to indicate more content */}
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 md:h-8 bg-gradient-to-t from-[var(--bg-secondary)] to-transparent" />
            </div>

            {/* Card Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-primary)] mt-auto">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Calendar size={14} />
                <span>{new Date(note.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="p-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
                  onClick={(e) => { e.stopPropagation(); onEdit(note); }}
                  aria-label="Edit note"
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="p-2 rounded-md text-red-500 hover:bg-red-500/10 transition-colors"
                  onClick={(e) => { e.stopPropagation(); onDelete(note); }}
                  aria-label="Delete note"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            {/* Edit Form Overlay */}
            {editingId === note.id && (
              <div className="absolute inset-0 bg-[var(--bg-primary)]/95 backdrop-blur-sm rounded-xl p-4 z-10 flex items-center justify-center">
                {editForm}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NoteList; 