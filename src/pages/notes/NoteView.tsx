import { ArrowLeft, Folder, Save, Trash2, X } from 'lucide-react';
import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import MobileNotesSelector from './MobileNotesSelector';

const MarkdownWysiwyg = lazy(() => import('@/components/editor/MarkdownWysiwyg'));

// Loading component for the editor
const EditorLoader: React.FC = () => (
  <div className="flex items-center justify-center h-32">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
  </div>
);

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

interface NoteViewProps {
  note: Note;
  onSave: (note: Omit<Note, 'id'>) => Promise<void>;
  onDelete: (note: Note) => void;
  allNotes?: Note[];
  onNoteSelect?: (noteId: string) => void;
  selectedNoteId?: string | undefined;
  onDeleteNote?: (note: Note) => void;
  onBack?: () => void;
}

const NoteView: React.FC<NoteViewProps> = ({
  note,
  onSave,
  onDelete,
  allNotes = [],
  onNoteSelect,
  selectedNoteId,
  onDeleteNote,
  onBack
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
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
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  // Assignments already used by other notes: suggestions for the inline assignment field
  const assignmentSuggestions = Array.from(
    new Set(allNotes.map(n => (n.assignment || '').trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  // A brand-new (untitled) note opens with the cursor in the title
  useEffect(() => {
    if (!note.title) {
      const id = requestAnimationFrame(() => titleInputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

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
      // Emit event to notify sidepanel that note was saved
      window.dispatchEvent(new CustomEvent('noteSaved', { detail: { noteId: note.id } }));
    }
  };

  // Auto-save with debounce
  const autoSave = useCallback(async () => {
    if (hasUnsavedChanges && !isSaving) {
      const success = await saveNote({ title, assignment: assignment || null, description, date });
      if (success) {
        setHasUnsavedChanges(false);
        // Emit event to notify sidepanel that note was saved
        window.dispatchEvent(new CustomEvent('noteSaved', { detail: { noteId: note.id } }));
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
    }, 2000); // Save after 2 seconds of inactivity
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
    setHasUnsavedChanges(false);
    setIsInitialized(true);
    // Only when a different note is opened: re-running on every save would overwrite what
    // the user typed while the request was in flight.
  }, [note.id]);

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
    // Emit event to notify sidepanel that note was deleted
    window.dispatchEvent(new CustomEvent('noteDeleted', { detail: { noteId: note.id } }));
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
              <span className="hidden sm:inline">{t('common.cancel')}</span>
              <span className="sm:hidden">✕</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                className="p-1.5 sm:p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                title={t('notes.deleteNote')}
              >
                <Trash2 size={16} className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] bg-transparent rounded-lg hover:bg-[var(--accent-primary)]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                <Save size={14} className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                <span className="hidden xs:inline">{isSaving ? t('notes.saving') : t('common.save')}</span>
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
                  placeholder={t('notes.noteTitlePlaceholder')}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={assignment}
                  onChange={(e) => setAssignment(e.target.value)}
                  className="px-3 py-2 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors text-sm sm:text-base"
                  placeholder={t('notes.assignmentPlaceholder')}
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
        <div className="sticky top-0 z-30 px-4 py-3 bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border-primary)]">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none text-xl sm:text-2xl font-bold transition-colors"
            placeholder={t('notes.noteTitlePlaceholder')}
          />
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-10rem)]">
            <Suspense fallback={<EditorLoader />}>
              <MarkdownWysiwyg
                ref={editorRef}
                initialBody={description}
                onChange={(data: { body: string }) => handleDescriptionChange(data.body)}
                showTitleInput={false}
                variant="notes"
                className="h-full"
              />
            </Suspense>
          </div>
          <div className="mx-4 sm:mx-6 border-t border-[var(--border-primary)]/60" />
          <div className="h-20" />
        </div>
      </div>
    );
  }

  // Render view mode — Obsidian-style: slim header, inline title, readable column
  return (
    <div className="h-full flex flex-col relative bg-[var(--bg-primary)]">
      {/* Slim header: breadcrumb left, status + actions right */}
      <div className="flex h-10 flex-shrink-0 items-center justify-between gap-3 border-b border-[var(--border-primary)] px-3 sm:px-4 text-xs text-[var(--text-secondary)]">
        <div className="flex min-w-0 items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="-ml-2 flex h-10 w-10 flex-shrink-0 items-center justify-center font-medium md:ml-0 md:h-7 md:w-7"
              title={t('notes.backToNotes')}
              aria-label={t('notes.backToNotes')}
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <span className="truncate">
            {assignment.trim() || t('notes.unassigned')}
            <span className="mx-1.5 opacity-50">/</span>
            <span className="text-[var(--text-primary)]">{title || t('notes.noteTitlePlaceholder')}</span>
          </span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <span className="mr-1 tabular-nums" aria-live="polite">
            {isSaving ? t('notes.saving') : hasUnsavedChanges ? 'Unsaved' : 'Saved'}
          </span>
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className="flex h-7 w-7 items-center justify-center rounded-md disabled:opacity-30"
            title={t('common.save')}
            aria-label={t('common.save')}
          >
            <Save size={15} />
          </button>
          <button
            onClick={handleDelete}
            className="flex h-7 w-7 items-center justify-center rounded-md text-red-500"
            title={t('notes.deleteNote')}
            aria-label={t('notes.deleteNote')}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Document */}
      <div className="flex-1 overflow-y-auto">
        <div className="obsidian-doc mx-auto w-full max-w-[46rem] px-6 pb-24 pt-10 sm:px-10">
          {/* Assignment: editable inline (saved with the note) */}
          <div className="mb-3 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Folder size={15} className="shrink-0 text-[var(--accent-primary)]" aria-hidden="true" />
            <input
              type="text"
              list="note-assignment-options"
              value={assignment}
              onChange={(e) => setAssignment(e.target.value)}
              placeholder={t('notes.assignmentPlaceholder')}
              aria-label={t('notes.assignmentPlaceholder')}
              className="min-w-0 flex-1 rounded-md border-none bg-transparent py-1 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 !outline-none"
            />
            <datalist id="note-assignment-options">
              {assignmentSuggestions.map(option => <option key={option} value={option} />)}
            </datalist>
          </div>
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-4 w-full border-none bg-transparent text-3xl font-extrabold tracking-tight text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-0 sm:text-4xl"
            placeholder={t('notes.noteTitlePlaceholder')}
            aria-label={t('notes.noteTitlePlaceholder')}
          />
          <Suspense fallback={<EditorLoader />}>
            <MarkdownWysiwyg
              ref={editorRef}
              initialBody={description}
              onChange={(data: { body: string }) => handleDescriptionChange(data.body)}
              showTitleInput={false}
              variant="notes"
              className="h-full"
            />
          </Suspense>
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
          setShowMobileNotes(false);
        }}
        isOpen={showMobileNotes}
        onClose={() => setShowMobileNotes(false)}
      />
    </div>
  );
};

export default NoteView;