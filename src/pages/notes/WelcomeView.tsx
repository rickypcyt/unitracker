import { Calendar, FileText, Folder, Plus } from 'lucide-react';
import React, { useRef, useState } from 'react';

import DatePicker from 'react-datepicker';

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
  onDelete 
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('Welcome to Notes');
  const [tempDate, setTempDate] = useState(new Date().toISOString().split('T')[0] || '');
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const datePickerRef = useRef<any>(null);
  
  const originalTitle = 'Welcome to Notes';
  const description = `Create notes with **rich markdown** support.

*Organize by assignments*
*Format with bold, italic, and lists*
*Search and filter your notes*

Start creating your first note!`;

  const handleTitleEdit = () => {
    setIsEditingTitle(true);
  };

  const handleTitleCancel = () => {
    setTempTitle(originalTitle);
    setIsEditingTitle(false);
  };

  const handleDateSave = async (newDate: Date | null) => {
    if (!newDate) return;
    
    try {
      const dateString = newDate.toISOString().split('T')[0] || '';
      setTempDate(dateString);
      // Don't save automatically, just update temp state
    } catch (error) {
      console.error('Error updating date:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Mobile: Show notes list directly */}
      <div className="md:hidden h-full flex flex-col">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            Notes ({notes.length})
          </h2>
          <button
            onClick={() => onCreateNote()}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] bg-transparent rounded-lg hover:bg-[var(--accent-primary)] hover:text-white transition-colors text-sm"
          >
            New
            <Plus size={16} className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Notes List */}
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
          ) : notes.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="max-w-md mx-auto">
                <div className="relative mb-6">
                  <FileText className="mx-auto w-16 h-16 text-[var(--text-secondary)] opacity-30" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-[var(--accent-primary)] rounded-full flex items-center justify-center animate-pulse">
                    <Plus size={16} className="text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Welcome to Notes</h3>
                <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
                  Start organizing your thoughts and ideas. Create your first note to get started.
                </p>
                <button
                  onClick={() => onCreateNote()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary)]/90 hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
                >
                  <Plus size={18} className="w-5 h-5" />
                  Create your first note
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              {/* Group notes by assignment */}
              {(() => {
                const notesByAssignment: Record<string, any[]> = {};
                notes.forEach(note => {
                  const assignment = note.assignment || 'Unassigned';
                  if (!notesByAssignment[assignment]) {
                    notesByAssignment[assignment] = [];
                  }
                  notesByAssignment[assignment].push(note);
                });

                return Object.entries(notesByAssignment).map(([assignment, assignmentNotes]) => (
                  <div key={assignment} className="mb-6">
                    {/* Assignment Header */}
                    <div className="px-3 py-2.5 bg-gradient-to-r from-[var(--bg-secondary)] to-[var(--bg-primary)] border-b border-[var(--border-primary)] sticky top-0 z-10 mb-4 rounded-t-lg shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                          <Folder size={16} className="text-[var(--accent-primary)]" />
                          {assignment}
                          <span className="text-xs font-normal text-[var(--text-secondary)] bg-[var(--bg-primary)] px-2 py-0.5 rounded-full">
                            {assignmentNotes.length}
                          </span>
                        </h3>
                        <button
                          onClick={() => onCreateNote(assignment)}
                          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all duration-200 hover:scale-110"
                          title={`Create new note in ${assignment}`}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Notes List */}
                    <div className="space-y-2 px-1">
                      {assignmentNotes.map((note) => {
                        const noteKey = note.id || `${note.title.trim().toLowerCase()}-${note.date}`;
                        return (
                          <div
                            key={noteKey}
                            onClick={() => onNoteSelect?.(note.id || noteKey)}
                            className={`relative flex flex-row w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 shadow-sm hover:shadow-xl hover:border-[var(--accent-primary)]/70 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer transform animate-in fade-in slide-in-from-bottom-2 ${
                              selectedNoteId === note.id
                                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/8 shadow-lg scale-[1.01] ring-2 ring-[var(--accent-primary)]/20'
                                : 'hover:bg-gradient-to-r hover:from-[var(--bg-primary)] hover:to-[var(--bg-secondary)]'
                            }`}
                          >
                            {/* Left side - Title */}
                            <div className="flex-1 min-w-0 pr-4">
                              <h4 className="font-semibold text-sm text-[var(--text-primary)] truncate leading-tight mb-1">
                                {note.title}
                              </h4>
                              <div className="text-[var(--text-secondary)] text-xs leading-relaxed line-clamp-2">
                                {note.description && note.description.includes('<')
                                  ? note.description.replace(/<[^>]*>/g, '').substring(0, 100) + (note.description.replace(/<[^>]*>/g, '').length > 100 ? '...' : '')
                                  : note.description?.substring(0, 100) + (note.description && note.description.length > 100 ? '...' : '') || 'No description'
                                }
                              </div>
                            </div>

                            {/* Right side - Date */}
                            <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)] flex-shrink-0">
                              <Calendar size={12} />
                              <span>{new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Show assignments and notes view */}
      <div className="hidden md:flex flex-col h-full">
        {notes.length === 0 ? (
          // Show welcome message only when no notes
          <>
            {/* Header */}
            <div className="border-b border-[var(--border-primary)] p-3 sm:p-6">
              <div className="flex justify-center mb-3 sm:mb-4">
                {/* No navigation buttons for welcome view */}
              </div>

              <div className="mb-2 sm:mb-3 text-center">
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTitleCancel();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        handleTitleCancel();
                      }
                    }}
                    onBlur={handleTitleCancel}
                    className="w-full px-0 py-0 bg-transparent border-0 border-b-2 border-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] text-2xl sm:text-3xl font-bold transition-colors text-center"
                    placeholder="Note Title"
                    autoFocus
                  />
                ) : (
                  <h1 
                    className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] break-words cursor-text hover:bg-[var(--bg-secondary)] rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors inline-block"
                    onClick={handleTitleEdit}
                    title="Click to edit title"
                  >
                    {tempTitle}
                  </h1>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-2 sm:gap-4 text-[var(--text-secondary)]">
                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <DatePicker
                    ref={datePickerRef}
                    selected={tempDate ? new Date(tempDate) : new Date()}
                    onChange={handleDateSave}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="DD/MM/YYYY"
                    popperPlacement="bottom-start"
                    calendarClassName="bg-[var(--bg-primary)] border-2 border-[var(--accent-primary)] rounded-lg shadow-lg text-[var(--text-primary)]"
                    dayClassName={(date) =>
                      (date.getDay() === 0 || date.getDay() === 6) ? 'text-red-500' : ''
                    }
                    showPopperArrow={false}
                    customInput={
                      <div 
                        className="flex items-center gap-1 sm:gap-2 cursor-text hover:bg-[var(--bg-secondary)] rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                        title="Click to edit date"
                      >
                        <Calendar size={12} className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{tempDate ? new Date(tempDate).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        }) : new Date().toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                    }
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="max-w-none sm:max-w-4xl mx-auto">
                <div className="prose prose-sm sm:prose-lg max-w-none dark:prose-invert text-center text-[var(--text-primary)]">
                  <div>{description}</div>
                </div>
                
                <div className="mt-8 text-center space-y-4">
                  {/* Create Note Button - Always visible */}
                  <button
                    onClick={() => onCreateNote()}
                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] rounded-lg hover:bg-[var(--accent-primary)]/10 transition-colors text-sm sm:text-base"
                  >
                    Create New Note
                    <Plus size={16} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Show assignments boxes navigation when there are notes
          <div className="flex-1 overflow-y-auto p-4">
            {selectedAssignment ? (
              // Show notes for selected assignment
              <div>
                {/* Back button */}
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15,18 9,12 15,6"></polyline>
                  </svg>
                  Back to assignments
                </button>

                {/* Assignment header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2 mb-2">
                    <Folder size={24} className="text-[var(--accent-primary)]" />
                    {selectedAssignment}
                  </h2>
                  <p className="text-[var(--text-secondary)]">
                    {(() => {
                      const assignmentNotes = notes.filter(note => (note.assignment || 'Unassigned') === selectedAssignment);
                      return `${assignmentNotes.length} ${assignmentNotes.length === 1 ? 'note' : 'notes'}`;
                    })()}
                  </p>
                </div>

                {/* Notes grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {notes
                    .filter(note => (note.assignment || 'Unassigned') === selectedAssignment)
                    .map((note) => {
                      const noteKey = note.id || `${note.title.trim().toLowerCase()}-${note.date}`;
                      return (
                        <div
                          key={noteKey}
                          onClick={() => onNoteSelect?.(note.id || noteKey)}
                          className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-3 hover:shadow-lg hover:border-[var(--accent-primary)]/70 transition-all duration-200 cursor-pointer group flex items-start gap-2 aspect-square"
                        >
                          <div className="flex-shrink-0">
                            <FileText size={28} className="text-[var(--accent-primary)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate mb-1">
                              {note.title}
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)] mb-2">
                              <Calendar size={10} />
                              <span>{new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="text-xs text-[var(--text-secondary)] line-clamp-3">
                              {renderMarkdownPreview(note.description, 80)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              // Show assignments boxes
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {(() => {
                  const notesByAssignment: Record<string, any[]> = {};
                  notes.forEach(note => {
                    const assignment = note.assignment || 'Unassigned';
                    if (!notesByAssignment[assignment]) {
                      notesByAssignment[assignment] = [];
                    }
                    notesByAssignment[assignment].push(note);
                  });

                  return Object.entries(notesByAssignment).map(([assignment, assignmentNotes]) => (
                    <div
                      key={assignment}
                      onClick={() => {
                        if (assignmentNotes.length === 0) {
                          onCreateNote(assignment);
                        } else {
                          setSelectedAssignment(assignment);
                        }
                      }}
                      className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 hover:shadow-md hover:border-[var(--accent-primary)]/70 transition-all duration-200 cursor-pointer group flex items-start gap-3 aspect-square"
                    >
                      <div className="flex-shrink-0">
                        <Folder size={32} className="text-[var(--accent-primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-[var(--text-primary)] truncate mb-1">
                          {assignment}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {assignmentNotes.length} {assignmentNotes.length === 1 ? 'note' : 'notes'}
                        </p>
                        <div className="mt-2 space-y-1">
                          {assignmentNotes.slice(0, 2).map((note, index) => (
                            <div key={note.id || index} className="text-xs text-[var(--text-secondary)] truncate">
                              • {note.title}
                            </div>
                          ))}
                          {assignmentNotes.length > 2 && (
                            <div className="text-xs text-[var(--text-secondary)] italic">
                              +{assignmentNotes.length - 2} more...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
                
                {/* Create new note item */}
                <div
                  onClick={() => onCreateNote()}
                  className="bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-primary)] rounded-lg p-4 hover:border-[var(--accent-primary)]/50 transition-all duration-200 cursor-pointer group flex items-start gap-3 aspect-square"
                >
                  <div className="flex-shrink-0 opacity-50 group-hover:opacity-70 transition-opacity">
                    <Plus size={32} className="text-[var(--text-secondary)]" />
                  </div>
                  <div className="flex-1 min-w-0 opacity-50 group-hover:opacity-70 transition-opacity">
                    <h3 className="text-base font-medium text-[var(--text-secondary)] mb-1">
                      Create New Note
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Click to create
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeView;
