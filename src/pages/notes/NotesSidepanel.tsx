import { ChevronDown, ChevronRight, FileText, Folder, Plus } from 'lucide-react';
import React, { useMemo, useState } from 'react';

// Utility function to get time ago string
const getTimeAgo = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';

  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
};

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

interface NotesSidepanelProps {
  notes: Note[];
  loading: boolean;
  error: string | null;
  onNoteSelect: (noteId: string) => void;
  selectedNoteId?: string | undefined;
  onCreateNote: () => void;
}

const NotesSidepanel: React.FC<NotesSidepanelProps> = ({
  notes,
  loading,
  error,
  selectedNoteId,
  onNoteSelect,
  onCreateNote,
}) => {
  const [expandedAssignments, setExpandedAssignments] = useState<Set<string>>(new Set());

  // Group notes by assignment and remove duplicates
  const notesByAssignment = useMemo(() => {
    const grouped: Record<string, Note[]> = {};
    const seenNotes = new Set<string>();
    
    notes.forEach(note => {
      // Create a unique identifier for the note using ID if available, otherwise use title+date
      const noteId = note.id || `${note.title.trim().toLowerCase()}-${note.date}`;
      
      // Skip if we've already seen this note
      if (seenNotes.has(noteId)) {
        return;
      }
      
      seenNotes.add(noteId);
      const assignment = note.assignment || 'Unassigned';
      if (!grouped[assignment]) {
        grouped[assignment] = [];
      }
      grouped[assignment].push(note);
    });

    return grouped;
  }, [notes]);

  const toggleAssignment = (assignment: string) => {
    const newExpanded = new Set(expandedAssignments);
    if (newExpanded.has(assignment)) {
      newExpanded.delete(assignment);
    } else {
      newExpanded.add(assignment);
    }
    setExpandedAssignments(newExpanded);
  };

  // Collapse all assignments initially (none expanded by default)
  React.useEffect(() => {
    setExpandedAssignments(new Set());
  }, [notesByAssignment]);

  if (loading && notes.length === 0) {
    return (
      <div className="w-80 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent-primary)] mx-auto mb-2"></div>
          <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-80 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] h-full p-4">
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col">
      <div className="flex-1 p-4">
        {Object.keys(notesByAssignment).length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto mb-2 w-8 h-8 text-[var(--text-secondary)] opacity-50" />
            <p className="text-base text-[var(--text-secondary)]">No notes yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(notesByAssignment).map(([assignment, assignmentNotes]) => (
              <div key={assignment} className="border border-[var(--border-primary)] rounded-lg overflow-hidden">
                <div className="flex items-center">
                  <button
                    onClick={() => toggleAssignment(assignment)}
                    className="flex-1 px-3 py-3 bg-[var(--bg-primary)] flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2">
                      {expandedAssignments.has(assignment) ? (
                        <ChevronDown size={18} className="text-[var(--text-secondary)]" />
                      ) : (
                        <ChevronRight size={18} className="text-[var(--text-secondary)]" />
                      )}
                      <Folder size={18} className="text-[var(--accent-primary)]" />
                      <span className="text-base font-medium text-[var(--text-primary)]">
                        {assignment}
                      </span>
                    </div>
                    <span className="text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-1 rounded-full">
                      {assignmentNotes.length}
                    </span>
                  </button>
                  <button
                    onClick={() => onCreateNote(assignment)}
                    className="px-2 py-3 bg-[var(--bg-primary)] border-l border-[var(--border-primary)]"
                    title={`Create new note for "${assignment}"`}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                {expandedAssignments.has(assignment) && (
                  <div className="bg-[var(--bg-secondary)]">
                    {assignmentNotes.map((note) => {
                      const noteKey = note.id || `${note.title.trim().toLowerCase()}-${note.date}`;
                      return (
                        <div
                          key={noteKey}
                          onClick={() => onNoteSelect(note.id || noteKey)}
                          className={`px-3 py-3 border-b border-[var(--border-primary)] last:border-b-0 cursor-pointer ${
                            selectedNoteId === note.id
                              ? 'bg-[var(--accent-primary)]/10 border-l-2 border-l-[var(--accent-primary)]'
                              : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-medium text-[var(--text-primary)] truncate">
                                {note.title}
                              </h4>
                              <div className="mt-1">
                                <p className="text-sm text-[var(--text-secondary)]">
                                  Updated {getTimeAgo(note.last_edited)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesSidepanel;
