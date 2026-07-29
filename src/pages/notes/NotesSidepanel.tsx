import { ChevronDown, ChevronRight, FileText, Folder, Plus, Search } from 'lucide-react';
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
  date?: string | undefined;
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
  onCreateNote: (assignment?: string) => void;
}

const NotesSidepanel: React.FC<NotesSidepanelProps> = ({
  notes,
  loading: _loading,
  error,
  selectedNoteId,
  onNoteSelect,
  onCreateNote,
}) => {
  // Get initial state from localStorage
  const getInitialState = (): Set<string> => {
    try {
      const saved = localStorage.getItem('expandedAssignments');
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  };

  const [expandedAssignments, setExpandedAssignments] = useState<Set<string>>(getInitialState());
  const [searchQuery, setSearchQuery] = useState('');

  // Save state to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem('expandedAssignments', JSON.stringify(Array.from(expandedAssignments)));
    } catch (error) {
      console.warn('Failed to save expanded assignments to localStorage:', error);
    }
  }, [expandedAssignments]);

  // Group notes by assignment and remove duplicates, with search filter
  const notesByAssignment = useMemo(() => {
    const grouped: Record<string, Note[]> = {};
    const seenNotes = new Set<string>();
    
    const filtered = searchQuery.trim()
      ? notes.filter(note => 
          note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.assignment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : notes;
    
    filtered.forEach(note => {
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

  // Expand all assignments by default
  React.useEffect(() => {
    setExpandedAssignments(new Set(Object.keys(notesByAssignment)));
  }, [notesByAssignment]);

  if (error) {
    return (
      <div className="w-80 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] h-full p-4">
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--bg-secondary)] flex flex-col h-full">
      {/* Search bar */}
      <div className="p-3 border-b border-[var(--border-primary)]">
        <div className="flex items-center gap-2 h-9 px-3 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-lg focus-within:border-[var(--accent-primary)] transition-colors">
          <Search size={14} className="text-[var(--text-secondary)] flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
          />
        </div>
      </div>

      <div className="flex-1 p-3 overflow-y-auto pb-20">
        {Object.keys(notesByAssignment).length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto mb-2 w-8 h-8 text-[var(--text-secondary)] opacity-50" />
            <p className="text-sm text-[var(--text-secondary)]">
              {searchQuery ? 'No notes match your search' : 'No notes yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(notesByAssignment).map(([assignment, assignmentNotes]) => (
              <div key={assignment} className="border-2 border-[var(--border-primary)] rounded-xl overflow-hidden">
                <div className="flex items-center">
                  <button
                    onClick={() => toggleAssignment(assignment)}
                    className="flex-1 px-3 py-2.5 bg-[var(--bg-primary)] flex items-center justify-between text-left hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {expandedAssignments.has(assignment) ? (
                        <ChevronDown size={16} className="text-[var(--text-secondary)]" />
                      ) : (
                        <ChevronRight size={16} className="text-[var(--text-secondary)]" />
                      )}
                      <Folder size={16} className="text-[var(--accent-primary)]" />
                      <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {assignment}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
                      {assignmentNotes.length}
                    </span>
                  </button>
                  <button
                    onClick={() => onCreateNote(assignment)}
                    className="px-2.5 py-2.5 bg-[var(--bg-primary)] border-l border-[var(--border-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
                    title={`Create new note for "${assignment}"`}
                  >
                    <Plus size={14} className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)]" />
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
                          className={`px-3 py-2.5 border-b border-[var(--border-primary)] last:border-b-0 cursor-pointer transition-colors ${
                            selectedNoteId === note.id
                              ? 'bg-[var(--accent-primary)]/10 border-l-2 border-l-[var(--accent-primary)]'
                              : 'hover:bg-[var(--bg-primary)]/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-[var(--text-primary)] truncate">
                                {note.title}
                              </h4>
                              <div className="mt-0.5">
                                <p className="text-xs text-[var(--text-secondary)]">
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
      <div className="p-3 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] sticky bottom-0">
        <button
          onClick={() => onCreateNote()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] bg-transparent hover:bg-[var(--accent-primary)]/10 transition-colors text-sm font-medium"
          aria-label="Create note"
        >
          <Plus size={16} className="text-[var(--accent-primary)]" />
          <span>Create note</span>
        </button>
      </div>
    </div>
  );
};

export default NotesSidepanel;
