import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import DeleteNoteModal from '@/modals/notes/DeleteNoteModal';
import { Helmet } from "react-helmet-async";
import LoginPromptModal from '@/modals/auth/LoginPromptModal';
import NoteView from './NoteView';
import NotesSidepanel from './NotesSidepanel';
import { toast } from 'sonner';
import { FileText, Plus } from 'lucide-react';
import { getDemoNotes } from '@/utils/demoData';
import { useAuth } from '@/hooks/auth/useAuth';
import useDemoMode from '@/utils/useDemoMode';
import { NoteService } from '@/services/NoteService';
import { useTranslation } from 'react-i18next';

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


// Last list of notes per user: painted instantly on load, then refreshed from the server
const NOTES_CACHE_KEY = 'unitracker.notesCache.v1';

const readNotesCache = (): { userId: string; notes: Note[] } | null => {
  try {
    const raw = localStorage.getItem(NOTES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.userId === 'string' && Array.isArray(parsed.notes) ? parsed : null;
  } catch {
    return null;
  }
};

const writeNotesCache = (userId: string, notes: Note[]) => {
  try {
    localStorage.setItem(NOTES_CACHE_KEY, JSON.stringify({ userId, notes }));
  } catch {
    // quota exceeded or storage unavailable: skip caching
  }
};

const Notes: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthLoading } = useAuth();
  const { isDemo } = useDemoMode();
  const {
    loginPromptOpen,
    closeLoginPrompt,
  } = useDemoMode();
  const queryClient = useQueryClient();
  const userId: string | undefined = user?.id;
  // Logged in: notes come from Supabase. Guest: notes live in localStorage under 'notes'.
  const notesKey = ['notes', userId ?? 'guest'] as const;
  const notesQuery = useQuery({
    queryKey: notesKey,
    enabled: !isAuthLoading,
    queryFn: async (): Promise<Note[]> => {
      if (userId) {
        const data = (await NoteService.fetchNotes(userId)) as Note[];
        writeNotesCache(userId, data);
        return data;
      }
      const saved = localStorage.getItem('notes');
      return saved ? JSON.parse(saved) : [];
    },
    // Instant paint from the per-user cache, refreshed in the background
    initialData: () => {
      const cached = readNotesCache();
      return userId && cached?.userId === userId ? cached.notes : undefined;
    },
    initialDataUpdatedAt: 0,
  });
  // While auth resolves, keep showing the last cached list
  const notes: Note[] = isAuthLoading ? (readNotesCache()?.notes ?? []) : (notesQuery.data ?? []);
  const setNotes = (next: Note[] | ((previous: Note[]) => Note[])) => {
    queryClient.setQueryData<Note[]>(notesKey, previous =>
      typeof next === 'function' ? next(previous ?? []) : next);
  };
  const [mutating, setLoading] = useState(false);
  const loading = mutating || (isAuthLoading ? !readNotesCache() : notesQuery.isPending);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | undefined>(undefined);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 768px)').matches);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('notesSidebarWidth'));
      return saved >= 220 && saved <= 520 ? saved : 288;
    } catch {
      return 288;
    }
  });

  const startResize = (event: React.MouseEvent) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = sidebarWidth;
    let latest = startWidth;
    const onMove = (e: MouseEvent) => {
      latest = Math.min(520, Math.max(220, startWidth + e.clientX - startX));
      setSidebarWidth(latest);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      try { localStorage.setItem('notesSidebarWidth', String(latest)); } catch { /* storage unavailable */ }
    };
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // New note: no modal. Create it right away and open it, with the title focused
  // and the assignment editable inline in the editor.
  const openCreate = async (assignment?: string) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (creating) return;
    setCreating(true);
    try {
      const data = await NoteService.createNote({
        title: '',
        assignment: assignment?.trim() ? assignment.trim() : null,
        description: '',
        date: getSafeDate(null),
        user_id: user.id,
      });
      setNotes(previous => [data as Note, ...previous]);
      setSelectedNoteId((data as Note).id);
    } catch (err) {
      console.error('Error creating note:', err);
      toast.error((err as { message?: string } | null)?.message || t('notes.errorGeneric'));
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (notesQuery.error) setError(t('notes.errorLoading'));
  }, [notesQuery.error, t]);

  // Persist local edits: per-user cache when logged in, 'notes' when guest
  useEffect(() => {
    if (isAuthLoading || !notesQuery.isSuccess) return;
    if (userId) writeNotesCache(userId, notes);
    else localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes, userId, isAuthLoading, notesQuery.isSuccess]);

  // Handler para agregar nota
  const getSafeDate = (dateStr: string | null | undefined): string => {
    if (dateStr && dateStr.trim().length > 0) {
      return dateStr;
    }
    // Return current date in YYYY-MM-DD format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleAddNoteWithId = async (noteData: Omit<Note, 'id'>): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const safeDate = getSafeDate(noteData.date);
      
      if (user) {
        try {
          const data = await NoteService.createNote({
            title: noteData.title || '',
            assignment: noteData.assignment ?? null,
            description: noteData.description || '',
            date: safeDate,
            user_id: user.id,
          });
          setNotes([data as Note, ...notes]);
          return (data as Note).id || null;
        } catch (err) {
          throw err;
        }
      } else {
        const now = new Date().toISOString();
        const newNote: Note = {
          id: Date.now().toString(),
          title: noteData.title || '',
          assignment: noteData.assignment ?? null,
          description: noteData.description || '',
          date: safeDate,
          created_at: now,
          last_edited: now
        };
        setNotes([newNote, ...notes]);
        return newNote.id || null;
      }
    } catch (err) {
      // Supabase errors are plain objects (not Error instances), so read .message too
      console.error('Error creating note:', err);
      const message = (err as { message?: string } | null)?.message;
      setError(message || t('notes.errorGeneric'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (noteData: Omit<Note, 'id'>): Promise<void> => {
    await handleAddNoteWithId(noteData);
  };

  // Handler para actualizar nota
  const handleUpdateNote = async (note: Omit<Note, 'id'>): Promise<void> => {
    const noteId = selectedNote?.id;
    if (!noteId) return;
    
    setLoading(true);
    setError(null);
    
    const updatedNote = {
      ...note,
      last_edited: new Date().toISOString()
    };
    
    if (user) {
      try {
        const data = await NoteService.updateNote(noteId, updatedNote, user.id);
        setNotes(notes.map(n => n.id === noteId ? data as Note : n));
      } catch (err) {
        setError(err instanceof Error ? err.message : t('notes.errorUpdate'));
      }
    } else {
      setNotes(notes.map(n => n.id === noteId ? { ...n, ...updatedNote } as Note : n));
    }
    setLoading(false);
  };

  // Handler para eliminar nota
  const confirmDeleteNote = async (): Promise<void> => {
    if (!noteToDelete?.id) return;
    
    setLoading(true);
    setError(null);
    try {
      if (user) {
        await NoteService.deleteNote(noteToDelete.id, user.id);
      }
      setNotes(notes.filter(n => n.id !== noteToDelete.id));
      setNoteToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('notes.errorDelete'));
    } finally {
      setLoading(false);
    }
  };

  const notesToShow = isDemo ? getDemoNotes() : notes;

  const handleNoteSelect = (noteId: string) => {
    setSelectedNoteId(noteId === selectedNoteId ? undefined : noteId);
  };

  const selectedNote = selectedNoteId ? notesToShow.find((note: Note) => note.id === selectedNoteId) : null;

  return (
    <>
      <Helmet>
        <title>Study Notes & Note Taking | UniTracker 2026</title>
        <meta
          name="description"
          content="Take and organize study notes digitally. Create rich text notes, organize by assignments, and access your study materials anywhere."
        />
        <meta
          name="keywords"
          content="study notes, note taking, digital notes, assignment notes, study materials, note organization, rich text notes"
        />
        <meta property="og:title" content="Study Notes & Note Taking | UniTracker 2026" />
        <meta
          property="og:description"
          content="Take and organize study notes digitally. Create rich text notes, organize by assignments, and access your study materials anywhere."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://unitracker.me/notes" />
        <link rel="canonical" href="https://unitracker.me/notes" />
      </Helmet>
      <React.Fragment>
        {isDesktop ? (
          /* Obsidian-style two-pane layout: file tree left, editor right */
          <div className="flex h-[calc(100dvh-var(--navbar-h)-var(--demo-banner-h,0px))] w-full overflow-hidden">
            <aside className="relative h-full flex-shrink-0 border-r border-[var(--border-primary)]" style={{ width: sidebarWidth }}>
              <NotesSidepanel
                notes={notesToShow}
                loading={loading}
                error={error}
                selectedNoteId={selectedNoteId}
                onNoteSelect={setSelectedNoteId}
                onCreateNote={openCreate}
              />
              {/* Drag handle to resize the sidebar */}
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize sidebar"
                onMouseDown={startResize}
                className="absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize"
              />
            </aside>
            <main className="h-full min-w-0 flex-1 overflow-hidden">
              {selectedNote ? (
                <NoteView
                  key={selectedNote.id}
                  note={selectedNote}
                  onSave={selectedNote?.id ? handleUpdateNote : handleAddNote}
                  onDelete={(note) => setNoteToDelete(note)}
                  allNotes={notesToShow}
                  onNoteSelect={setSelectedNoteId}
                  selectedNoteId={selectedNoteId}
                  onDeleteNote={(note) => setNoteToDelete(note)}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                  <FileText className="h-12 w-12 text-[var(--accent-primary)] opacity-60" />
                  <p className="text-sm text-[var(--text-secondary)]">
                    {notesToShow.length === 0 ? t('notes.emptyDesc') : t('notes.selectNote', { defaultValue: 'Select a note from the sidebar' })}
                  </p>
                  <button
                    onClick={() => openCreate()}
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-[var(--accent-primary)]"
                  >
                    <Plus size={16} />
                    {t('notes.newNote')}
                  </button>
                </div>
              )}
            </main>
          </div>
        ) : (
        <div className="w-full relative">
        {/* Main Content Container */}
        <div className="h-[calc(100dvh-var(--navbar-h)-var(--demo-banner-h,0px))] w-full overflow-hidden">
          {selectedNote ? (
            <NoteView
              note={selectedNote}
              onSave={selectedNote?.id ? handleUpdateNote : handleAddNote}
              onDelete={(note) => setNoteToDelete(note)}
              allNotes={notesToShow}
              onNoteSelect={handleNoteSelect}
              selectedNoteId={selectedNoteId}
              onDeleteNote={(note) => setNoteToDelete(note)}
              onBack={() => setSelectedNoteId(undefined)}
            />
          ) : (
            /* Obsidian-style file explorer, full screen on phones */
            <div className="h-full w-full">
              <NotesSidepanel
                roomy
                notes={notesToShow}
                loading={loading}
                error={error}
                selectedNoteId={selectedNoteId}
                onNoteSelect={handleNoteSelect}
                onCreateNote={openCreate}
              />
            </div>
          )}
        </div>
      </div>
        )}

    {/* Modals - always rendered */}

    <LoginPromptModal
      isOpen={showLoginModal || loginPromptOpen}
      onClose={() => { setShowLoginModal(false); closeLoginPrompt(); }}
    />
    <DeleteNoteModal
      isOpen={!!noteToDelete}
      onClose={() => setNoteToDelete(null)}
      onConfirm={confirmDeleteNote}
      noteTitle={noteToDelete?.title || ''}
    />
      </React.Fragment>
    </>
  );
};

export default Notes;
