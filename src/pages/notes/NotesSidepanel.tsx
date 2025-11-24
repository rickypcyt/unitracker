import { ChevronDown, ChevronRight, FileText, Folder } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface Note {
  id?: string;
  title: string;
  assignment: string | null;
  description: string;
  date: string;
  user_id?: string;
}

interface NotesSidepanelProps {
  notes: Note[];
  loading: boolean;
  error: string | null;
  onNoteSelect: (noteId: string) => void;
  selectedNoteId?: string | undefined;
  onDelete: (note: Note) => void;
  onCreateNote: () => void;
}

const NotesSidepanel: React.FC<NotesSidepanelProps> = ({
  notes,
  loading,
  error,
  onDelete,
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

  // Expand all assignments initially
  React.useEffect(() => {
    setExpandedAssignments(new Set(Object.keys(notesByAssignment)));
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
    <div className="w-80 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b border-[var(--border-primary)]">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <FileText size={20} />
          Notes
        </h2>
        <p className="text-base text-[var(--text-secondary)] mt-1">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 h-full">
        {Object.keys(notesByAssignment).length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto mb-2 w-8 h-8 text-[var(--text-secondary)] opacity-50" />
            <p className="text-base text-[var(--text-secondary)]">No notes yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(notesByAssignment).map(([assignment, assignmentNotes]) => (
              <div key={assignment} className="border border-[var(--border-primary)] rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleAssignment(assignment)}
                  className="w-full px-3 py-3 bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-between text-left"
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
                
                {expandedAssignments.has(assignment) && (
                  <div className="bg-[var(--bg-secondary)]">
                    {assignmentNotes.map((note) => {
                      const noteKey = note.id || `${note.title.trim().toLowerCase()}-${note.date}`;
                      return (
                        <div
                          key={noteKey}
                          onClick={() => onNoteSelect(note.id || noteKey)}
                          className={`px-3 py-3 border-b border-[var(--border-primary)] last:border-b-0 cursor-pointer transition-colors ${
                            selectedNoteId === note.id
                              ? 'bg-[var(--accent-primary)]/10 border-l-2 border-l-[var(--accent-primary)]'
                              : 'hover:bg-[var(--bg-hover)]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-medium text-[var(--text-primary)] truncate">
                                {note.title}
                              </h4>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-sm text-[var(--text-secondary)]">
                                  {new Date(note.date).toLocaleDateString()}
                                </p>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDelete(note);
                                    }}
                                    className="p-1.5 rounded text-red-500 hover:bg-red-500/10 transition-colors"
                                    title="Delete"
                                  >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="3,6 5,6 21,6"></polyline>
                                      <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                    </svg>
                                  </button>
                                </div>
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
