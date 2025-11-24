import { Calendar, FileText, Folder, Plus, X } from 'lucide-react';
import React, { useRef, useState } from 'react';

import DatePicker from 'react-datepicker';
import ReactMarkdown from 'react-markdown';

interface WelcomeViewProps {
  onCreateNote: () => void;
  notes?: any[];
  loading?: boolean;
  error?: string | null;
  onNoteSelect?: (noteId: string) => void;
  selectedNoteId?: string | undefined;
  onDelete?: (note: any) => void;
}

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
  const datePickerRef = useRef<any>(null);
  
  const originalTitle = 'Welcome to Notes';
  const description = `Create and organize your notes with rich markdown support. Here you can organize your thoughts, create markdown documents, and keep track of your assignments.

## Features

📝 Create and edit notes with rich markdown support

📚 Organize notes by assignments

✨ Format text with bold, italic, lists, and more

🔍 Quick search and filtering capabilities`;

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
            onClick={onCreateNote}
            className="inline-flex items-center gap-2 px-3 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary)]/90 transition-colors text-sm"
          >
            <Plus size={16} className="w-4 h-4" />
            New
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
            <div className="text-center py-8">
              <FileText className="mx-auto mb-4 w-12 h-12 text-[var(--text-secondary)] opacity-50" />
              <p className="text-[var(--text-secondary)] mb-4">No notes yet</p>
              <button
                onClick={onCreateNote}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary)]/90 transition-colors"
              >
                <Plus size={16} className="w-4 h-4" />
                Create your first note
              </button>
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
                    <div className="px-2 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] sticky top-0 z-10 mb-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                          <Folder size={14} className="text-[var(--accent-primary)]" />
                          {assignment}
                        </h3>
                        <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-primary)] px-2 py-1 rounded-full">
                          {assignmentNotes.length}
                        </span>
                      </div>
                    </div>
                    
                    {/* Notes Grid - 2 columns */}
                    <div className="grid grid-cols-2 gap-3">
                      {assignmentNotes.map((note) => {
                        const noteKey = note.id || `${note.title.trim().toLowerCase()}-${note.date}`;
                        return (
                          <div
                            key={noteKey}
                            onClick={() => onNoteSelect?.(note.id || noteKey)}
                            className={`relative flex flex-col w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-3 shadow-sm hover:shadow-lg hover:border-[var(--accent-primary)]/70 transition-all duration-200 group aspect-square cursor-pointer ${
                              selectedNoteId === note.id
                                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                : ''
                            }`}
                          >
                            {/* Note Header */}
                            <div className="mb-2 flex flex-col gap-1">
                              <h4 className="font-semibold text-sm text-[var(--text-primary)] truncate leading-tight">
                                {note.title}
                              </h4>
                            </div>

                            {/* Note Content - Truncated description */}
                            <div className="mb-2 flex-1 overflow-hidden relative">
                              {note.description && note.description.includes('<') ? (
                                <div
                                  className="text-[var(--text-primary)] text-xs leading-relaxed break-words prose prose-sm prose-p:my-1 prose-p:whitespace-pre-wrap prose-ul:my-1 prose-ol:my-1 prose-ul:list-disc prose-ol:list-decimal prose-li:my-0 prose-li:whitespace-pre-wrap prose-headings:mt-1 prose-headings:mb-2 max-w-none overflow-hidden bg-transparent p-0 border-0 shadow-none rounded-none h-full"
                                  dangerouslySetInnerHTML={{ __html: note.description }}
                                />
                              ) : (
                                <div
                                  className="text-[var(--text-primary)] text-xs leading-relaxed break-words whitespace-pre-line max-w-none overflow-hidden bg-transparent p-0 border-0 shadow-none rounded-none h-full"
                                >
                                  {note.description}
                                </div>
                              )}
                              {/* Fade bottom to indicate more content */}
                              {note.description && note.description.length > 50 && (
                                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[var(--bg-secondary)] to-transparent" />
                              )}
                            </div>

                            {/* Note Footer */}
                            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-primary)] mt-auto">
                              <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                                <Calendar size={10} />
                                <span className="text-[10px]">{new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete?.(note);
                                }}
                                className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete"
                              >
                                <X size={12} />
                              </button>
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

      {/* Desktop: Show original welcome view */}
      <div className="hidden md:flex flex-col h-full">
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

          <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-2 sm:gap-4 text-[var(--text-secondary]">
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
            <div className="prose prose-sm sm:prose-lg max-w-none dark:prose-invert text-center">
              <ReactMarkdown>{description}</ReactMarkdown>
            </div>
            
            <div className="mt-8 text-center space-y-4">
              {/* Create Note Button - Always visible */}
              <button
                onClick={onCreateNote}
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] rounded-lg hover:bg-[var(--accent-primary)]/10 transition-colors text-sm sm:text-base"
              >
                Create New Note
                <Plus size={16} className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeView;
