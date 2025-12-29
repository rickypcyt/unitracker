import React, { useCallback, useEffect, useRef, useState } from 'react';

import MarkdownWysiwyg from '../../MarkdownWysiwyg';
import MobileNotesSelector from './MobileNotesSelector';

interface Note {
  id?: string;
  title: string;
  assignment: string | null;
  description: string;
  date: string;
  user_id?: string;
  last_edited?: string;
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
  const [isInitialized, setIsInitialized] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<{ getCurrentContent: () => string } | null>(null);

  // Helper function to safely update description only when there's an actual change
  const handleDescriptionChange = useCallback((newDescription: string) => {
    if (!isInitialized) return;
    if (newDescription !== description) {
      setDescription(newDescription);
    }
  }, [isInitialized, description]);


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
    // Get current content from editor to ensure we save the latest changes
    const currentContent = editorRef.current?.getCurrentContent() || description;
    const success = await saveNote({ title, assignment: assignment || null, description: currentContent, date });
    if (success) {
      setIsEditing(false);
      setHasUnsavedChanges(false);
    }
  };

  // Auto-save with debounce
  const autoSave = useCallback(async () => {
    if (hasUnsavedChanges && !isSaving) {
      const success = await saveNote({ title, assignment: assignment || null, description, date });
      if (success) {
        setHasUnsavedChanges(false);
      }
    }
  }, [hasUnsavedChanges, isSaving, title, assignment, description, date]);

  // Debounced auto-save
  const debouncedAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 1000); // Save after 1 second of inactivity
  }, [autoSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Track unsaved changes (only after initialization to prevent auto-save on mount)
  useEffect(() => {
    if (!isInitialized) return;

    const hasChanges =
      title !== note.title ||
      description !== note.description ||
      assignment !== (note.assignment || '') ||
      date !== note.date;

    setHasUnsavedChanges(hasChanges);
  }, [title, description, assignment, date, note, isInitialized]);

  // Auto-save when there are changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      debouncedAutoSave();
    }
  }, [hasUnsavedChanges, debouncedAutoSave]);

  // Reset local states when note changes
  useEffect(() => {
    setTitle(note.title);
    setDescription(note.description);
    setAssignment(note.assignment || '');
    setDate(note.date);
    setIsEditingTitle(false);
    setIsEditingAssignment(false);
    setHasUnsavedChanges(false);
    setIsInitialized(true);
  }, [note]);

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

  // Date editing handled in right panel; header date controls removed

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
      <div className="h-full flex flex-col relative">
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
          <div className="space-y-3 sm:space-y-4 mt-6">
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

        {/* Note Title Header */}
        <div className="px-4 py-3 bg-[var(--bg-primary)]">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none text-xl sm:text-2xl font-bold transition-colors"
            placeholder="Note Title"
          />
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-10rem)]">
            <MarkdownWysiwyg
              ref={editorRef}
              initialBody={description}
              onChange={(data: { body: string }) => handleDescriptionChange(data.body)}
              showTitleInput={false}
              variant="notes"
              className="h-full"
            />
          </div>
        </div>
      </div>
    );
  }

  // Render view mode
  return (
    <div className="h-full flex flex-col relative">
      {/* Note Title Header */}
      <div className="p-4 bg-[var(--bg-primary)] border-b border-[var(--border-primary)]">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-xl sm:text-2xl font-bold text-[var(--text-primary)] bg-transparent border-none focus:outline-none focus:ring-0"
          placeholder="Note Title"
        />
      </div>

      {/* Note Properties */}
      <div className="p-0 bg-[var(--bg-primary)]">
        <div className="border-b border-[var(--border-primary)] overflow-hidden">
          <div className="flex flex-col">
            {/* Assignment */}
            <div className="p-3 border-b border-[var(--border-primary)] last:border-b-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)] uppercase tracking-wide">Assignment</span>
                <input
                  type="text"
                  value={assignment}
                  onChange={(e) => setAssignment(e.target.value)}
                  className={`text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-0 text-right flex-1 ml-4 ${
                    !assignment || assignment.trim() === ''
                      ? 'text-red-400 placeholder-red-400'
                      : 'text-[var(--text-primary)]'
                  }`}
                  placeholder="Add here"
                />
              </div>
            </div>

            {/* Created Date */}
            {note.created_at && (
              <div className="p-3 border-b border-[var(--border-primary)] last:border-b-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)] uppercase tracking-wide">Created</span>
                  <span className="text-sm text-[var(--text-primary)] font-medium">{new Date(note.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            )}

            {/* Updated Date */}
            {note.last_edited && (
              <div className="p-3 border-b border-[var(--border-primary)] last:border-b-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)] uppercase tracking-wide">Updated</span>
                  <span className="text-sm text-[var(--text-primary)] font-medium">{new Date(note.last_edited).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full min-h-[calc(100vh-2rem)]">
          <MarkdownWysiwyg
            ref={editorRef}
            initialBody={description}
            onChange={(data: { body: string }) => handleDescriptionChange(data.body)}
            showTitleInput={false}
            variant="notes"
            className="h-full"
          />
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