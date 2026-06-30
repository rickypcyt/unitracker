import { BookOpen, Calendar, FileText, Folder, Plus, Search, Sparkles, Tag } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import NotesCreateModal from '../../modals/NotesCreateModal';
import { getLocalDateString } from '@/utils/dateUtils';

interface WelcomeViewProps {
  onCreateNote: (assignment?: string) => void;
  notes?: any[];
  loading?: boolean;
  error?: string | null;
  onNoteSelect?: (noteId: string) => void;
  selectedNoteId?: string | undefined;
  onDelete?: (note: any) => void;
}

// Simple markdown renderer for preview
const renderMarkdownPreview = (text: string, maxLength: number = 200): string => {
  if (!text) return 'No description';
  
  // Remove HTML tags first
  let cleanText = text.replace(/<[^>]*>/g, '');
  
  // Simple markdown replacements
  cleanText = cleanText
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold** but keep text
    .replace(/\*(.*?)\*/g, '$1')     // Remove *italic* but keep text  
    .replace(/`(.*?)`/g, '$1')      // Remove `code` but keep text
    .replace(/^•\s+/gm, '• ')        // Ensure bullet points have proper spacing
    .replace(/^\d+\.\s+/gm, '• ')    // Convert numbered lists to bullets
    .replace(/\n\n+/g, ' • ')       // Convert paragraph breaks to bullet separation
    .replace(/\n+/g, ' ')           // Convert single line breaks to spaces
    .replace(/\s+/g, ' ')           // Remove extra spaces
    .trim();
  
  // Add spacing between bullet points
  cleanText = cleanText.replace(/•\s+/g, ' • ');
  
  // Truncate if too long
  if (cleanText.length > maxLength) {
    return cleanText.substring(0, maxLength) + '...';
  }
  
  return cleanText;
};

const WelcomeView: React.FC<WelcomeViewProps> = ({ 
  onCreateNote, 
  notes = [], 
  loading = false, 
  error = null, 
  onNoteSelect, 
  selectedNoteId, 
  }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalAssignment, setModalAssignment] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(note => 
      note.title?.toLowerCase().includes(q) ||
      note.assignment?.toLowerCase().includes(q) ||
      note.description?.toLowerCase().includes(q)
    );
  }, [notes, searchQuery]);

  const notesByAssignmentFiltered = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    filteredNotes.forEach(note => {
      const assignment = note.assignment || 'Unassigned';
      if (!grouped[assignment]) grouped[assignment] = [];
      grouped[assignment].push(note);
    });
    return grouped;
  }, [filteredNotes]);
  
  const handleOpenCreateModal = (assignment?: string) => {
    setModalAssignment(assignment || '');
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setModalAssignment('');
  };

  const handleCreateNoteInModal = async (noteData: any) => {
    await onCreateNote(noteData);
    handleCloseCreateModal();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Mobile: Show notes list directly */}
      <div className="md:hidden h-full flex flex-col">
        {/* Mobile Header with Search */}
        <div className="p-4 border-b border-[var(--border-primary)] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <BookOpen size={20} className="text-[var(--accent-primary)]" />
              Notes ({notes.length})
            </h2>
            <button
              onClick={() => handleOpenCreateModal()}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-[var(--accent-primary)] text-[var(--accent-primary)] bg-transparent rounded-lg hover:bg-[var(--accent-primary)]/10 transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              New
            </button>
          </div>
          {notes.length > 0 && (
            <div className="flex items-center gap-2 h-9 px-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus-within:border-[var(--accent-primary)] transition-colors">
              <Search size={16} className="text-[var(--text-secondary)] flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
              />
            </div>
          )}
        </div>

        {/* Mobile Notes List */}
        <div className="flex-1 overflow-y-auto">
          {loading && notes.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
                <p className="text-[var(--text-secondary)] text-sm">Loading notes...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="text-red-500 mb-4 text-sm">{error}</div>
                <p className="text-[var(--text-secondary)] text-sm">Failed to load notes</p>
              </div>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="max-w-md mx-auto">
                <div className="relative mb-6 inline-block">
                  <div className="absolute inset-0 bg-[var(--accent-primary)]/20 blur-2xl rounded-full"></div>
                  <FileText className="relative mx-auto w-16 h-16 text-[var(--accent-primary)] opacity-80" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Welcome to Notes</h3>
                <p className="text-[var(--text-secondary)] mb-6 leading-relaxed text-sm">
                  Start organizing your thoughts and ideas. Create your first note to get started.
                </p>
                <button
                  onClick={() => handleOpenCreateModal()}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-[var(--accent-primary)] text-[var(--accent-primary)] bg-transparent rounded-lg hover:bg-[var(--accent-primary)]/10 hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
                >
                  <Plus size={18} />
                  Create your first note
                </button>
              </div>
            </div>
          ) : Object.keys(notesByAssignmentFiltered).length === 0 ? (
            <div className="text-center py-16 px-6">
              <Search className="mx-auto mb-3 w-10 h-10 text-[var(--text-secondary)] opacity-40" />
              <p className="text-[var(--text-secondary)] text-sm">No notes match your search</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {Object.entries(notesByAssignmentFiltered).map(([assignment, assignmentNotes]) => (
                <div key={assignment}>
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                      <Folder size={15} className="text-[var(--accent-primary)]" />
                      {assignment}
                      <span className="text-xs font-normal text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
                        {assignmentNotes.length}
                      </span>
                    </h3>
                    <button
                      onClick={() => handleOpenCreateModal(assignment)}
                      className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all duration-200 hover:scale-110"
                      title={`Create new note in ${assignment}`}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {assignmentNotes.map((note) => {
                      const noteKey = note.id || `${note.title.trim().toLowerCase()}-${note.date}`;
                      return (
                        <div
                          key={noteKey}
                          onClick={() => onNoteSelect?.(note.id || noteKey)}
                          className={`relative bg-[var(--bg-secondary)] border rounded-xl p-3.5 transition-all duration-200 cursor-pointer ${
                            selectedNoteId === note.id
                              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/8 shadow-md ring-1 ring-[var(--accent-primary)]/20'
                              : 'border-[var(--border-primary)] hover:border-[var(--accent-primary)]/50 hover:shadow-md hover:-translate-y-0.5'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-[var(--text-primary)] truncate leading-tight mb-1">
                                {note.title}
                              </h4>
                              <div className="text-[var(--text-secondary)] text-xs leading-relaxed line-clamp-2">
                                {renderMarkdownPreview(note.description, 100)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)] flex-shrink-0 mt-0.5">
                              <Calendar size={11} />
                              <span>{note.date ? new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Show assignments and notes view */}
      <div className="hidden md:flex flex-col h-full">
        {loading && notes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
          </div>
        ) : notes.length === 0 ? (
          // Show welcome message only when no notes
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full">
              {/* Hero icon */}
              <div className="relative mb-8 text-center">
                <div className="absolute inset-0 bg-[var(--accent-primary)]/10 blur-3xl rounded-full mx-auto w-48 h-48"></div>
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
                  <FileText className="w-10 h-10 text-[var(--accent-primary)]" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-[var(--text-primary)] text-center mb-3">
                Welcome to Notes
              </h1>
              <p className="text-[var(--text-secondary)] text-center mb-8 leading-relaxed">
                Create rich markdown notes, organize by assignments, and access your study materials anywhere.
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                  <Sparkles className="mx-auto mb-2 w-6 h-6 text-[var(--accent-primary)]" />
                  <p className="text-sm font-medium text-[var(--text-primary)]">Rich Markdown</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Format with bold, italic, lists</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                  <Folder className="mx-auto mb-2 w-6 h-6 text-[var(--accent-primary)]" />
                  <p className="text-sm font-medium text-[var(--text-primary)]">Organized</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Group notes by assignment</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                  <Tag className="mx-auto mb-2 w-6 h-6 text-[var(--accent-primary)]" />
                  <p className="text-sm font-medium text-[var(--text-primary)]">Searchable</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Find notes instantly</p>
                </div>
              </div>

              {/* Create button */}
              <div className="text-center">
                <button
                  onClick={() => handleOpenCreateModal()}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-[var(--accent-primary)] text-[var(--accent-primary)] bg-transparent rounded-xl hover:bg-[var(--accent-primary)]/10 hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
                >
                  <Plus size={18} />
                  Create your first note
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Show assignments and notes with search
          <div className="flex-1 overflow-y-auto">
            {/* Search bar */}
            <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/95 backdrop-blur-sm p-4 border-b border-[var(--border-primary)]">
              <div className="max-w-2xl mx-auto flex items-center gap-2 h-10 px-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl focus-within:border-[var(--accent-primary)] transition-colors">
                <Search size={18} className="text-[var(--text-secondary)] flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes by title, assignment, or content..."
                  className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
                />
              </div>
            </div>

            <div className="p-4 max-w-4xl mx-auto">
              {Object.keys(notesByAssignmentFiltered).length === 0 ? (
                <div className="text-center py-20">
                  <Search className="mx-auto mb-3 w-12 h-12 text-[var(--text-secondary)] opacity-40" />
                  <p className="text-[var(--text-secondary)]">No notes match your search</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Create new note button */}
                  <button
                    onClick={() => handleOpenCreateModal()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[var(--border-primary)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--accent-primary)]/5 transition-all duration-200 text-sm font-medium"
                  >
                    <Plus size={18} />
                    New Note
                  </button>

                  {Object.entries(notesByAssignmentFiltered).map(([assignment, assignmentNotes]) => (
                    <div key={assignment}>
                      {/* Assignment tag header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Tag size={16} className="text-[var(--accent-primary)]" />
                          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                            {assignment}
                          </h3>
                          <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
                            {assignmentNotes.length}
                          </span>
                        </div>
                        <button
                          onClick={() => handleOpenCreateModal(assignment)}
                          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all duration-200 hover:scale-110"
                          title={`Create new note in ${assignment}`}
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      {/* Notes list under this assignment */}
                      <div className="space-y-2">
                        {assignmentNotes.map((note) => {
                          const noteKey = note.id || `${note.title.trim().toLowerCase()}-${note.date}`;
                          return (
                            <div
                              key={noteKey}
                              onClick={() => onNoteSelect?.(note.id || noteKey)}
                              className={`bg-[var(--bg-secondary)] border rounded-xl p-4 transition-all duration-200 cursor-pointer ${
                                selectedNoteId === note.id
                                  ? 'border-[var(--accent-primary)] shadow-md ring-1 ring-[var(--accent-primary)]/20'
                                  : 'border-[var(--border-primary)] hover:border-[var(--accent-primary)]/50 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-1.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText size={16} className="text-[var(--accent-primary)] flex-shrink-0" />
                                  <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                    {note.title}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)] flex-shrink-0">
                                  <Calendar size={11} />
                                  <span>{note.date ? new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
                                </div>
                              </div>
                              <p className="text-xs text-[var(--text-secondary)] line-clamp-2 pl-6">
                                {renderMarkdownPreview(note.description, 150)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Create Note Modal */}
      <NotesCreateModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onAdd={handleCreateNoteInModal}
        loading={loading}
        initialValues={{
          title: '',
          assignment: modalAssignment,
          description: '',
          date: getLocalDateString() || ''
        }}
        isEdit={false}
      />
    </div>
  );
};

export default WelcomeView;
