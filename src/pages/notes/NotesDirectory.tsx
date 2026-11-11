import { Calendar, ChevronLeft, FileText, FolderOpen, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import NotesCreateModal from '@/modals/notes/NotesCreateModal';
import { getLocalDateString } from '@/utils/dateUtils';

type Note = {
  id?: string;
  title: string;
  assignment: string | null;
  description: string;
  date?: string;
  created_at?: string;
  last_edited?: string;
};

interface NotesDirectoryProps {
  notes: Note[];
  loading: boolean;
  error: string | null;
  onCreateNote: (noteData: Note) => void | Promise<void>;
  onNoteSelect?: (noteId: string) => void;
  selectedNoteId?: string;
  onDelete?: (note: Note) => void;
}

const getMonthKey = (note: Note): string => {
  const raw = note.created_at ?? note.date;
  if (!raw) return 'undated';
  const dateOnly = raw.match(/^(\d{4})-(\d{2})-\d{2}$/);
  const parsed = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, 1)
    : new Date(raw);
  if (Number.isNaN(parsed.getTime())) return 'undated';
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthLabel = (monthKey: string, locale: string, undatedLabel: string): string => {
  if (monthKey === 'undated') return undatedLabel;
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;

  return new Date(year, month - 1, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
};

const getShortDateLabel = (note: Note, locale: string, noDateLabel: string): string => {
  const raw = note.created_at ?? note.date;
  if (!raw) return noDateLabel;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return noDateLabel;

  return parsed.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  });
};

const getEditedLabel = (note: Note, locale: string): string | null => {
  if (!note.last_edited) return null;
  const edited = new Date(note.last_edited);
  if (Number.isNaN(edited.getTime())) return null;

  const rawCreated = note.created_at ?? note.date;
  const created = rawCreated ? new Date(rawCreated) : null;
  if (created && !Number.isNaN(created.getTime()) && edited.toDateString() === created.toDateString()) {
    return null;
  }

  return edited.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  });
};

const getPreview = (description: string, emptyLabel: string): string => {
  const plainText = description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return plainText || emptyLabel;
};

const NotesDirectory = ({
  notes,
  loading,
  error,
  onCreateNote,
  onNoteSelect,
  selectedNoteId,
  onDelete,
}: NotesDirectoryProps) => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(() => {
    try { return sessionStorage.getItem('notesSelectedAssignment'); } catch { return null; }
  });

  useEffect(() => {
    try {
      if (selectedAssignment) sessionStorage.setItem('notesSelectedAssignment', selectedAssignment);
      else sessionStorage.removeItem('notesSelectedAssignment');
    } catch {}
  }, [selectedAssignment]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return notes;

    return notes.filter(note =>
      note.title.toLowerCase().includes(query) ||
      note.assignment?.toLowerCase().includes(query) ||
      getPreview(note.description, t('notes.emptyNote')).toLowerCase().includes(query),
    );
  }, [notes, searchQuery, t]);

  // Clear a persisted selection if that assignment no longer exists
  useEffect(() => {
    if (loading || !selectedAssignment || notes.length === 0) return;
    const exists = notes.some(n => (n.assignment || t('notes.unassigned')) === selectedAssignment);
    if (!exists) setSelectedAssignment(null);
  }, [loading, notes, selectedAssignment, t]);

  const assignmentGroups = useMemo(() => {
    const groups = new Map<string, Note[]>();
    filteredNotes.forEach(note => {
      const assignment = note.assignment || t('notes.unassigned');
      const group = groups.get(assignment) ?? [];
      group.push(note);
      groups.set(assignment, group);
    });

    return [...groups.entries()].sort(([firstAssignment], [secondAssignment]) =>
      firstAssignment.localeCompare(secondAssignment),
    );
  }, [filteredNotes, t]);

  const activeAssignmentNotes = selectedAssignment
    ? assignmentGroups.find(([assignment]) => assignment === selectedAssignment)?.[1] ?? []
    : [];

  const activeMonthGroups = useMemo(() => {
    const groups = new Map<string, Note[]>();
    activeAssignmentNotes.forEach(note => {
      const monthKey = getMonthKey(note);
      const group = groups.get(monthKey) ?? [];
      group.push(note);
      groups.set(monthKey, group);
    });

    return [...groups.entries()].sort(([firstMonth], [secondMonth]) => {
      if (firstMonth === 'undated') return 1;
      if (secondMonth === 'undated') return -1;
      return secondMonth.localeCompare(firstMonth);
    });
  }, [activeAssignmentNotes]);

  const closeCreateModal = () => setIsCreateModalOpen(false);

  const handleCreate = async (noteData: Note) => {
    await onCreateNote(noteData);
    closeCreateModal();
  };

  if (loading && notes.length === 0) {
    return (
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6" aria-label={t('notes.loadingNotes')}>
        <div className="mb-6 h-11 w-full animate-pulse rounded-xl bg-[var(--bg-secondary)]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl border-2 border-[var(--border-primary)] bg-[var(--bg-secondary)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col p-4 pb-24 sm:p-6 sm:pb-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-primary)]">{t('notes.title')}</p>
          <div className="mt-1 flex items-center gap-1">
            {selectedAssignment && (
              <button
                onClick={() => setSelectedAssignment(null)}
                className="-ml-1.5 rounded-lg p-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                aria-label={t('notes.backToAssignments')}
              >
                <ChevronLeft size={22} />
              </button>
            )}
            <h1 className="text-2xl font-bold text-[var(--text-primary)] truncate">
              {selectedAssignment || t('notes.yourLibrary')}
            </h1>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {selectedAssignment ? t('notes.notesInAssignment', { count: activeAssignmentNotes.length }) : t('notes.chooseAssignment')}
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Plus size={17} />
          {t('notes.newNote')}
        </button>
      </div>

      <div className="mb-6 flex h-11 items-center gap-2 rounded-xl border-2 border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 transition-colors focus-within:border-[var(--accent-primary)]">
        <Search size={17} className="flex-shrink-0 text-[var(--text-secondary)]" />
        <input
          value={searchQuery}
          onChange={event => setSearchQuery(event.target.value)}
          placeholder={t('notes.searchPlaceholder')}
          className="min-w-0 flex-1 border-none bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:ring-0"
        />
      </div>

      {error && notes.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
          {t('notes.refreshError')}
        </div>
      )}

      {notes.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-primary)] p-8 text-center">
          <div className="max-w-sm">
            <FileText className="mx-auto mb-4 h-12 w-12 text-[var(--accent-primary)]" />
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">{t('notes.emptyTitle')}</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{t('notes.emptyDesc')}</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border-2 border-[var(--accent-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)]/10"
            >
              <Plus size={17} />
              {t('notes.createFirstNote')}
            </button>
          </div>
        </div>
      ) : assignmentGroups.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-primary)] p-8 text-center">
          <p className="text-sm text-[var(--text-secondary)]">{t('notes.noMatch')}</p>
        </div>
      ) : selectedAssignment ? (
        <section>
          <div className="space-y-8">
            {activeMonthGroups.map(([monthKey, monthNotes]) => (
              <div key={monthKey}>
                <div className="mb-3 flex items-center gap-2 pb-1">
                  <Calendar size={15} className="text-[var(--accent-primary)]" />
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">{getMonthLabel(monthKey, i18n.language, t('notes.undated'))}</h2>
                  <span className="text-xs text-[var(--text-secondary)]">{monthNotes.length}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {monthNotes.map(note => {
              const noteKey = note.id || `${note.title}-${note.date}`;
              return (
                <article
                  key={noteKey}
                  onClick={() => onNoteSelect?.(note.id || noteKey)}
                  className={`group cursor-pointer rounded-xl border-2 bg-[var(--bg-primary)] p-3 transition-colors hover:border-[var(--accent-primary)]/60 ${selectedNoteId === note.id ? 'border-[var(--accent-primary)]' : 'border-[var(--border-primary)]'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="line-clamp-2 break-words text-sm font-semibold text-[var(--text-primary)]">{note.title}</h2>
                    {onDelete && (
                      <button
                        onClick={event => { event.stopPropagation(); onDelete(note); }}
                        className="-mr-1 -mt-1 flex-shrink-0 rounded-md p-1 text-[var(--text-secondary)] transition-colors hover:bg-red-500/10 hover:text-red-500"
                        aria-label={t('notes.deleteAria', { title: note.title })}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="mt-2 space-y-0.5 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="flex-shrink-0" />
                      <span className="truncate">{t('notes.created', { date: getShortDateLabel(note, i18n.language, t('notes.noDate')) })}</span>
                    </div>
                    {getEditedLabel(note, i18n.language) && (
                      <div className="flex items-center gap-1.5">
                        <FileText size={12} className="flex-shrink-0" />
                        <span className="truncate">{t('notes.edited', { date: getEditedLabel(note, i18n.language) })}</span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-3">
          {assignmentGroups.map(([assignment, assignmentNotes]) => (
            <button
              key={assignment}
              onClick={() => setSelectedAssignment(assignment)}
              className="group flex items-center gap-3 rounded-xl border-2 border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3 text-left transition-colors hover:border-[var(--accent-primary)]/60"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                <FolderOpen size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold capitalize text-[var(--text-primary)]">{assignment}</h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  {t('notes.noteCount', { count: assignmentNotes.length })}
                </p>
              </div>
            </button>
          ))}
        </section>
      )}

      <NotesCreateModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onAdd={handleCreate}
        loading={loading}
        initialValues={{ title: '', assignment: '', description: '', date: getLocalDateString() || '' }}
        isEdit={false}
      />
    </div>
  );
};

export default NotesDirectory;
