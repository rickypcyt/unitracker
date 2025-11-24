import { Calendar, FileText, Plus, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface Note {
  id?: string;
  title: string;
  assignment: string | null;
  description: string;
  date: string;
  user_id?: string;
}

interface MobileNotesSelectorProps {
  notes: Note[];
  loading: boolean;
  error: string | null;
  onNoteSelect: (noteId: string) => void;
  selectedNoteId?: string | undefined;
  onDelete: (note: Note) => void;
  onCreateNote: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const MobileNotesSelector: React.FC<MobileNotesSelectorProps> = ({
  notes,
  loading,
  error,
  onDelete,
  selectedNoteId,
  onNoteSelect,
  onCreateNote,
  isOpen,
  onClose,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden">
      <div className="fixed inset-x-0 bottom-0 top-16 bg-[var(--bg-primary)] border-t border-[var(--border-primary)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <FileText size={20} />
            Notes ({notes.length})
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && notes.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
                <p className="text-[var(--text-secondary)]">Loading notes...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-red-500 mb-4">{error}</div>
                <p className="text-[var(--text-secondary)]">Failed to load notes</p>
              </div>
            </div>
          ) : Object.keys(notesByAssignment).length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto mb-4 w-12 h-12 text-[var(--text-secondary)] opacity-50" />
              <p className="text-[var(--text-secondary)] mb-4">No notes yet</p>
              <button
                onClick={onCreateNote}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary)]/90 transition-colors"
              >
                <Plus size={16} />
                Create your first note
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {Object.entries(notesByAssignment).map(([assignment, assignmentNotes]) => (
                <div key={assignment} className="border border-[var(--border-primary)] rounded-lg overflow-hidden bg-[var(--bg-secondary)]">
                  <button
                    onClick={() => toggleAssignment(assignment)}
                    className="w-full px-4 py-3 bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--accent-primary)]">
                        {expandedAssignments.has(assignment) ? '▼' : '▶'}
                      </span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {assignment}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-1 rounded-full">
                      {assignmentNotes.length}
                    </span>
                  </button>
                  
                  {expandedAssignments.has(assignment) && (
                    <div className="divide-y divide-[var(--border-primary)]">
                      {assignmentNotes.map((note) => {
                        const noteKey = note.id || `${note.title.trim().toLowerCase()}-${note.date}`;
                        return (
                          <div
                            key={noteKey}
                            onClick={() => {
                              onNoteSelect(note.id || noteKey);
                              onClose();
                            }}
                            className={`px-4 py-3 cursor-pointer transition-colors ${
                              selectedNoteId === note.id
                                ? 'bg-[var(--accent-primary)]/10 border-l-2 border-l-[var(--accent-primary)]'
                                : 'hover:bg-[var(--bg-hover)]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-[var(--text-primary)] truncate mb-1">
                                  {note.title}
                                </h4>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                                    <Calendar size={12} />
                                    <span>{new Date(note.date).toLocaleDateString()}</span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDelete(note);
                                    }}
                                    className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors"
                                    title="Delete"
                                  >
                                    <X size={14} />
                                  </button>
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

        {/* Create Note Button */}
        {notes.length > 0 && (
          <div className="p-4 border-t border-[var(--border-primary)]">
            <button
              onClick={() => {
                onCreateNote();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary)]/90 transition-colors"
            >
              <Plus size={16} />
              Create New Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileNotesSelector;
