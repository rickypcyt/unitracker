import { Calendar, Edit2, Save, Tag, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

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

interface NotesInfoPanelProps {
  note: Note;
  onUpdateNote?: (updates: Partial<Omit<Note, 'id'>>) => Promise<void>;
}

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value?: string | null }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 py-1 text-sm text-[var(--text-secondary)]">
    <div className="text-[var(--accent-primary)]">{icon}</div>
    <span className="font-medium text-[var(--text-primary)]">{label}</span>
    <span className="truncate">{value ?? '-'}</span>
  </div>
);

const NotesInfoPanel: React.FC<NotesInfoPanelProps> = ({ note, onUpdateNote }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingAssignment, setIsEditingAssignment] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [assignment, setAssignment] = useState(note.assignment || '');

  useEffect(() => {
    setTitle(note.title);
    setAssignment(note.assignment || '');
    setIsEditingTitle(false);
    setIsEditingAssignment(false);
  }, [note]);

  const handleTitleSave = async () => {
    if (onUpdateNote && title.trim() !== note.title) {
      await onUpdateNote({ title: title.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setTitle(note.title);
    setIsEditingTitle(false);
  };

  const handleAssignmentSave = async () => {
    if (onUpdateNote) {
      await onUpdateNote({ assignment: assignment.trim() || null });
    }
    setIsEditingAssignment(false);
  };

  const handleAssignmentCancel = () => {
    setAssignment(note.assignment || '');
    setIsEditingAssignment(false);
  };

  const createdDisplay = note.created_at
    ? new Date(note.created_at).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
    : '-';
  const editedDisplay = note.last_edited
    ? new Date(note.last_edited).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
    : '-';

  return (
    <div className="w-80 h-full flex flex-col border-l border-[var(--border-primary)] bg-[var(--bg-secondary)]">
      <div className="p-4 space-y-3 overflow-y-auto">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Title</div>
            <button
              onClick={() => setIsEditingTitle(true)}
              className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-primary)] transition-colors"
              title="Edit title"
            >
              <Edit2 size={12} />
            </button>
          </div>
          {isEditingTitle ? (
            <div className="space-y-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTitleSave();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    handleTitleCancel();
                  }
                }}
                onBlur={handleTitleSave}
                className="w-full px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm"
                autoFocus
              />
              <div className="flex gap-1">
                <button
                  onClick={handleTitleSave}
                  className="p-1 rounded text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
                  title="Save"
                >
                  <Save size={12} />
                </button>
                <button
                  onClick={handleTitleCancel}
                  className="p-1 rounded text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] transition-colors"
                  title="Cancel"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-[var(--text-primary)] font-medium break-words cursor-text hover:bg-[var(--bg-primary)] rounded px-1 py-0.5 -mx-1 -my-0.5 transition-colors" onClick={() => setIsEditingTitle(true)}>
              {note.title || '-'}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Assignment</div>
            <button
              onClick={() => setIsEditingAssignment(true)}
              className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-primary)] transition-colors"
              title="Edit assignment"
            >
              <Edit2 size={12} />
            </button>
          </div>
          {isEditingAssignment ? (
            <div className="space-y-2">
              <input
                type="text"
                value={assignment}
                onChange={(e) => setAssignment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAssignmentSave();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    handleAssignmentCancel();
                  }
                }}
                onBlur={handleAssignmentSave}
                className="w-full px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm"
                placeholder="Assignment"
                autoFocus
              />
              <div className="flex gap-1">
                <button
                  onClick={handleAssignmentSave}
                  className="p-1 rounded text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
                  title="Save"
                >
                  <Save size={12} />
                </button>
                <button
                  onClick={handleAssignmentCancel}
                  className="p-1 rounded text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] transition-colors"
                  title="Cancel"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-[var(--accent-primary)]" />
              <span 
                className="text-[var(--text-primary)] cursor-text hover:bg-[var(--bg-primary)] rounded px-1 py-0.5 -mx-1 -my-0.5 transition-colors"
                onClick={() => setIsEditingAssignment(true)}
              >
                {note.assignment || 'Unassigned'}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-[var(--border-primary)] pt-3 mt-1" />

        <InfoRow icon={<Calendar size={14} />} label="Created:" value={createdDisplay} />
        <InfoRow icon={<Calendar size={14} />} label="Last edited:" value={editedDisplay} />
      </div>
    </div>
  );
};

export default NotesInfoPanel;
