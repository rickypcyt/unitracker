import { ArrowLeft, Calendar, FileText, Save, Trash2, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import DatePicker from 'react-datepicker';
import MarkdownWysiwyg from '../../MarkdownWysiwyg';
import MobileNotesSelector from './MobileNotesSelector';

interface Note {
  id?: string;
  title: string;
  assignment: string | null;
  description: string;
  date: string;
  user_id?: string;
}

interface NoteViewProps {
  note: Note;
  onSave: (note: Omit<Note, 'id'>) => Promise<void>;
  onDelete: (note: Note) => void;
  onBack: () => void;
  allNotes?: Note[];
  onNoteSelect?: (noteId: string) => void;
  selectedNoteId?: string | undefined;
  onDeleteNote?: (note: Note) => void;
}

const NoteView: React.FC<NoteViewProps> = ({ 
  note, 
  onSave, 
  onDelete, 
  onBack, 
  allNotes = [], 
  onNoteSelect, 
  selectedNoteId, 
  onDeleteNote 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingAssignment, setIsEditingAssignment] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [description, setDescription] = useState(note.description);
  const [assignment, setAssignment] = useState(note.assignment || '');
  const [date, setDate] = useState(note.date);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showMobileNotes, setShowMobileNotes] = useState(false);
  const datePickerRef = useRef<any>(null);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(
      title !== note.title || 
      description !== note.description || 
      assignment !== (note.assignment || '') ||
      date !== note.date
    );
  }, [title, description, assignment, date, note]);

  // Reset local states when note changes
  useEffect(() => {
    setTitle(note.title);
    setDescription(note.description);
    setAssignment(note.assignment || '');
    setDate(note.date);
    setIsEditingTitle(false);
    setIsEditingAssignment(false);
  }, [note]);

  // Generic save handler
  const saveNote = async (updates: Partial<Omit<Note, 'id'>>) => {
    setIsSaving(true);
    try {
      await onSave({
        title: updates.title ?? note.title,
        assignment: updates.assignment !== undefined ? updates.assignment : note.assignment,
        description: updates.description ?? note.description,
        date: updates.date ?? note.date
      });
      return true;
    } catch (error) {
      console.error('Error saving note:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    const success = await saveNote({ title, assignment: assignment || null, description, date });
    if (success) {
      setIsEditing(false);
      setHasUnsavedChanges(false);
    }
  };

  const handleCancel = () => {
    setTitle(note.title);
    setDescription(note.description);
    setAssignment(note.assignment || '');
    setDate(note.date);
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const handleDelete = () => {
    onDelete(note);
  };

  // Title editing handlers
  const handleTitleEdit = () => setIsEditingTitle(true);
  
  const handleTitleSave = async () => {
    const success = await saveNote({ title });
    if (success) setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setTitle(note.title);
    setIsEditingTitle(false);
  };

  // Assignment editing handlers
  const handleAssignmentEdit = () => setIsEditingAssignment(true);
  
  const handleAssignmentSave = async () => {
    const success = await saveNote({ assignment: assignment || null });
    if (success) setIsEditingAssignment(false);
  };

  const handleAssignmentCancel = () => {
    setAssignment(note.assignment || '');
    setIsEditingAssignment(false);
  };

  // Date handler
  const handleDateSave = async (newDate: Date | null) => {
    if (!newDate) return;
    const dateString = newDate.toISOString().split('T')[0] as string;
    const success = await saveNote({ date: dateString });
    if (success) setDate(dateString);
  };

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (hasUnsavedChanges && !isSaving) {
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, isSaving]);

  // Render edit mode
  if (isEditing) {
    return (
      <div className="h-full flex flex-col">
        {/* Edit Header */}
        <div className="border-b border-[var(--border-primary)] p-3 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm sm:text-base"
            >
              <X size={16} className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Cancel</span>
              <span className="sm:hidden">✕</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                className="p-1.5 sm:p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                title="Delete note"
              >
                <Trash2 size={16} className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                <Save size={14} className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                <span className="hidden xs:inline">{isSaving ? 'Saving...' : 'Save'}</span>
                <span className="xs:hidden">{isSaving ? '...' : '✓'}</span>
              </button>
            </div>
          </div>

          {/* Edit Form */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] text-lg sm:text-xl font-bold transition-colors"
                  placeholder="Note Title"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={assignment}
                  onChange={(e) => setAssignment(e.target.value)}
                  className="px-3 py-2 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors text-sm sm:text-base"
                  placeholder="Assignment"
                />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-2 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          <MarkdownWysiwyg
            initialBody={description}
            onChange={(data: { body: string }) => setDescription(data.body)}
            showTitleInput={false}
            placeholder="Start writing your note..."
            className="min-h-full"
          />
        </div>
      </div>
    );
  }

  // Render view mode
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 border-b border-[var(--border-primary)] p-2 sm:p-4 bg-[var(--bg-primary)]">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Mobile Notes Button - Left */}
          <div className="flex items-center gap-1 sm:hidden">
            <button
              onClick={() => setShowMobileNotes(true)}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
              title="View all notes"
            >
              <FileText size={16} className="w-4 h-4" />
            </button>
          </div>

          {/* Title - Center on mobile, Left on desktop */}
          <div className={`flex-shrink-0 ${allNotes.length > 0 ? 'sm:flex-1' : ''}`}>
            {isEditingTitle ? (
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
                className="w-full px-0 py-0 bg-transparent border-0 border-b-2 border-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] text-lg sm:text-xl font-bold transition-colors"
                placeholder="Note Title"
                autoFocus
              />
            ) : (
              <h1 
                className="text-lg sm:text-xl font-bold text-[var(--text-primary)] break-words cursor-text hover:bg-[var(--bg-secondary)] rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors truncate text-center sm:text-left"
                onClick={handleTitleEdit}
                title="Click to edit title"
              >
                {note.title}
              </h1>
            )}
          </div>

          {/* Assignment - Middle */}
          <div className="flex-1 flex justify-center min-w-0 max-w-[40%] sm:max-w-[50%]">
            {isEditingAssignment ? (
              <input
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
                className="px-2 sm:px-3 py-1 bg-transparent border-2 border-[var(--accent-primary)] rounded-full text-[var(--accent-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] text-xs sm:text-sm font-medium transition-colors w-full max-w-[120px] sm:max-w-[150px]"
                placeholder="Assignment"
                autoFocus
              />
            ) : (
              <>
                {note.assignment ? (
                  <span 
                    className="inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)] cursor-text hover:bg-[var(--accent-primary)]/20 transition-colors max-w-full truncate"
                    onClick={handleAssignmentEdit}
                    title="Click to edit assignment"
                  >
                    {note.assignment}
                  </span>
                ) : (
                  <span 
                    className="inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-[var(--text-secondary)] cursor-text hover:bg-[var(--bg-secondary)] transition-colors border border-dashed border-[var(--accent-primary)] whitespace-nowrap"
                    onClick={handleAssignmentEdit}
                    title="Click to add assignment"
                  >
                    <span className="hidden sm:inline">+ Add assignment</span>
                    <span className="sm:hidden">+ Add</span>
                  </span>
                )}
              </>
            )}
          </div>

          {/* Date - Right */}
          <div className="flex-shrink-0">
            <DatePicker
              ref={datePickerRef}
              selected={new Date(date)}
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
                  className="flex items-center gap-1 sm:gap-2 cursor-text hover:bg-[var(--bg-secondary)] rounded px-2 py-1 -mx-2 -my-1 transition-colors text-xs sm:text-sm text-[var(--text-secondary)]"
                  title="Click to edit date"
                >
                  <Calendar size={12} className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{new Date(date).toLocaleDateString('en-US', { 
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
        <div className="max-w-none sm:max-w-4xl">
          <MarkdownWysiwyg
            initialBody={description}
            onChange={(data: { body: string }) => setDescription(data.body)}
            showTitleInput={false}
            placeholder="Start writing your note..."
            className="min-h-full"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 w-full border-t border-[var(--border-primary)] px-2 py-1 sm:px-4 sm:py-2 bg-[var(--bg-primary)] h-12 sm:h-14 z-50">
        <div className="flex items-center justify-between w-full h-full">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm sm:text-base flex-shrink-0"
          >
            <ArrowLeft size={16} className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Back to notes</span>
          </button>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              className="p-1 sm:p-1.5 rounded-lg text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isSaving ? 'Saving...' : 'Save'}
            >
              <Save size={16} className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 sm:p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
              title="Delete note"
            >
              <Trash2 size={16} className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Notes Selector */}
      <MobileNotesSelector
        notes={allNotes}
        loading={false}
        error={null}
        onNoteSelect={(noteId) => {
          onNoteSelect?.(noteId);
          setShowMobileNotes(false);
        }}
        selectedNoteId={selectedNoteId}
        onDelete={onDeleteNote || (() => {})}
        onCreateNote={() => {
          // This would need to be passed down from parent
          setShowMobileNotes(false);
        }}
        isOpen={showMobileNotes}
        onClose={() => setShowMobileNotes(false)}
      />
    </div>
  );
};

export default NoteView;