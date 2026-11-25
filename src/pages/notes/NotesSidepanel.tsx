import { ArrowDownAZ, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Clock, FileText, Folder, FolderOpen, Plus, Search, X } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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

interface NotesSidepanelProps {
  notes: Note[];
  loading: boolean;
  error: string | null;
  onNoteSelect: (noteId: string) => void;
  selectedNoteId?: string | undefined;
  onCreateNote: (assignment?: string) => void;
  /** Bigger rows and touch targets (phones) */
  roomy?: boolean;
}

type SortMode = 'name' | 'recent';

const COLLAPSED_KEY = 'notesCollapsedFolders';
const SORT_KEY = 'notesTreeSort';

const noteKeyOf = (note: Note) => note.id || `${note.title.trim().toLowerCase()}-${note.date}`;

const timeOf = (note: Note) => {
  const raw = note.last_edited ?? note.created_at ?? note.date;
  const time = raw ? new Date(raw).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
};

/**
 * Obsidian-style file explorer: flat tree, assignments as folders, notes as
 * files. Folder state + sort mode persist, the active note's folder is
 * revealed automatically, and the tree is keyboard navigable.
 */
const NotesSidepanel: React.FC<NotesSidepanelProps> = ({
  notes,
  error,
  selectedNoteId,
  onNoteSelect,
  onCreateNote,
  roomy = false,
}) => {
  const { t } = useTranslation();
  const treeRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(COLLAPSED_KEY);
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    try {
      return localStorage.getItem(SORT_KEY) === 'recent' ? 'recent' : 'name';
    } catch {
      return 'name';
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const searching = searchQuery.trim().length > 0;

  useEffect(() => {
    try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify(Array.from(collapsed))); } catch { /* storage unavailable */ }
  }, [collapsed]);

  useEffect(() => {
    try { localStorage.setItem(SORT_KEY, sortMode); } catch { /* storage unavailable */ }
  }, [sortMode]);

  const folders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? notes.filter(note =>
          note.title?.toLowerCase().includes(query) ||
          note.assignment?.toLowerCase().includes(query) ||
          note.description?.toLowerCase().includes(query))
      : notes;

    const grouped = new Map<string, Note[]>();
    const seen = new Set<string>();
    filtered.forEach(note => {
      const key = noteKeyOf(note);
      if (seen.has(key)) return;
      seen.add(key);
      const folder = note.assignment || t('notes.unassigned');
      const list = grouped.get(folder) ?? [];
      list.push(note);
      grouped.set(folder, list);
    });

    const sortNotes = (list: Note[]) => [...list].sort((a, b) =>
      sortMode === 'recent'
        ? timeOf(b) - timeOf(a)
        : (a.title || '').localeCompare(b.title || ''));

    return [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, list]) => [name, sortNotes(list)] as const);
  }, [notes, searchQuery, sortMode, t]);

  // Reveal the active note: make sure its folder is open
  useEffect(() => {
    if (!selectedNoteId) return;
    const active = notes.find(n => n.id === selectedNoteId);
    if (!active) return;
    const folder = active.assignment || t('notes.unassigned');
    setCollapsed(prev => {
      if (!prev.has(folder)) return prev;
      const next = new Set(prev);
      next.delete(folder);
      return next;
    });
  }, [selectedNoteId, notes, t]);

  const allCollapsed = folders.length > 0 && folders.every(([name]) => collapsed.has(name));

  const toggleFolder = (name: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleAll = () => {
    setCollapsed(allCollapsed ? new Set() : new Set(folders.map(([name]) => name)));
  };

  // Up/Down move between visible rows; Left/Right collapse/expand folders
  const handleTreeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const rows = Array.from(treeRef.current?.querySelectorAll<HTMLButtonElement>('[data-row]') ?? []);
    const current = rows.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = e.key === 'ArrowDown' ? Math.min(rows.length - 1, current + 1) : Math.max(0, current - 1);
      rows[next]?.focus();
    } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && current >= 0) {
      const folder = rows[current]?.dataset['folder'];
      if (!folder) return;
      const isCollapsed = collapsed.has(folder);
      if ((e.key === 'ArrowLeft' && !isCollapsed) || (e.key === 'ArrowRight' && isCollapsed)) {
        e.preventDefault();
        toggleFolder(folder);
      }
    }
  };

  const iconBtn = `flex items-center justify-center rounded-md text-(--text-secondary) ${roomy ? 'h-10 w-10' : 'h-7 w-7'}`;
  const iconSize = roomy ? 20 : 16;
  const rowText = roomy ? 'text-base' : 'text-[13px]';
  const rowPad = roomy ? 'py-2.5' : 'py-1';

  if (error) {
    return (
      <div className="h-full w-full bg-(--bg-secondary) p-4">
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-(--bg-secondary)">
      {/* Toolbar */}
      <div className={`flex items-center gap-1 px-2 pt-2 ${roomy ? 'justify-end' : 'justify-center'}`}>
        <button onClick={() => onCreateNote()} className={`${iconBtn} text-(--accent-primary)`} aria-label={t('notes.createNote')} title={t('notes.createNote')}>
          <Plus size={iconSize + 1} />
        </button>
        <button
          onClick={() => setSortMode(m => (m === 'name' ? 'recent' : 'name'))}
          className={iconBtn}
          aria-label={sortMode === 'name' ? t('notes.sortRecent', { defaultValue: 'Sort by recent' }) : t('notes.sortName', { defaultValue: 'Sort by name' })}
          title={sortMode === 'name' ? t('notes.sortRecent', { defaultValue: 'Sort by recent' }) : t('notes.sortName', { defaultValue: 'Sort by name' })}
        >
          {sortMode === 'name' ? <ArrowDownAZ size={iconSize} /> : <Clock size={iconSize} />}
        </button>
        <button
          onClick={toggleAll}
          className={iconBtn}
          disabled={folders.length === 0}
          aria-label={allCollapsed ? t('notes.expandAll', { defaultValue: 'Expand all' }) : t('notes.collapseAll', { defaultValue: 'Collapse all' })}
          title={allCollapsed ? t('notes.expandAll', { defaultValue: 'Expand all' }) : t('notes.collapseAll', { defaultValue: 'Collapse all' })}
        >
          {allCollapsed ? <ChevronsUpDown size={iconSize} /> : <ChevronsDownUp size={iconSize} />}
        </button>
      </div>

      {/* Search */}
      <div className="px-2 py-2">
        <div className={`flex items-center gap-2 rounded-md border border-(--border-primary) bg-(--bg-primary) px-2 transition-colors focus-within:border-(--accent-primary) ${roomy ? 'h-11 px-3' : 'h-7'}`}>
          <Search size={roomy ? 17 : 13} className="shrink-0 text-(--text-secondary)" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') setSearchQuery('');
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                treeRef.current?.querySelector<HTMLButtonElement>('[data-row]')?.focus();
              }
            }}
            placeholder={t('notes.searchPlaceholderShort')}
            className={`min-w-0 flex-1 border-none bg-transparent text-(--text-primary) outline-none placeholder-(--text-secondary) focus:outline-none focus:ring-0 ${roomy ? 'text-base' : 'text-sm'}`}
          />
          {searching && (
            <button onClick={() => setSearchQuery('')} className="shrink-0 text-(--text-secondary)" aria-label={t('common.cancel')}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div ref={treeRef} onKeyDown={handleTreeKeyDown} className="flex-1 overflow-y-auto px-2 pb-20 pt-1">
        {folders.length === 0 ? (
          <div className="py-8 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 text-(--text-secondary) opacity-50" />
            <p className={`text-(--text-secondary) ${roomy ? 'text-base' : 'text-sm'}`}>
              {searching ? t('notes.noMatch') : t('notes.noNotesYet')}
            </p>
          </div>
        ) : (
          <ul className="space-y-0.5" role="tree">
            {folders.map(([folder, folderNotes]) => {
              const open = searching || !collapsed.has(folder);
              const hasActive = folderNotes.some(n => !!n.id && n.id === selectedNoteId);
              return (
                <li key={folder} role="treeitem" aria-expanded={open}>
                  <div className="flex items-center gap-1">
                    <button
                      data-row
                      data-folder={folder}
                      onClick={() => toggleFolder(folder)}
                      className={`flex min-w-0 flex-1 items-center gap-1.5 rounded px-1 text-left ${rowPad}`}
                    >
                      {open
                        ? <ChevronDown size={roomy ? 16 : 13} className="shrink-0 text-(--text-secondary)" />
                        : <ChevronRight size={roomy ? 16 : 13} className="shrink-0 text-(--text-secondary)" />}
                      {open
                        ? <FolderOpen size={roomy ? 18 : 14} className="shrink-0 text-(--text-secondary)" />
                        : <Folder size={roomy ? 18 : 14} className="shrink-0 text-(--text-secondary)" />}
                      <span className={`truncate ${rowText} ${hasActive ? 'font-semibold text-(--text-primary)' : 'text-(--text-primary)'}`}>{folder}</span>
                    </button>
                    <button
                      onClick={() => onCreateNote(folder === t('notes.unassigned') ? '' : folder)}
                      className={`flex shrink-0 items-center justify-center rounded-md text-(--text-secondary) ${roomy ? 'h-9 w-9' : 'h-6 w-6'}`}
                      title={t('notes.createNoteInAssignment', { assignment: folder })}
                      aria-label={t('notes.createNoteInAssignment', { assignment: folder })}
                    >
                      <Plus size={roomy ? 17 : 13} />
                    </button>
                  </div>

                  {open && (
                    <ul className="ml-2.5 border-l border-(--border-primary) pl-1.5" role="group">
                      {folderNotes.map(note => {
                        const key = noteKeyOf(note);
                        const active = !!note.id && selectedNoteId === note.id;
                        return (
                          <li key={key}>
                            <button
                              data-row
                              onClick={() => onNoteSelect(note.id || key)}
                              aria-current={active ? 'page' : undefined}
                              className={`flex w-full items-center gap-1.5 rounded px-2 text-left ${rowPad} ${rowText} ${
                                active
                                  ? 'bg-(--accent-primary)/15 font-medium text-(--text-primary)'
                                  : 'text-(--text-secondary)'
                              }`}
                            >
                              <span className="truncate">{note.title || t('notes.noteTitlePlaceholder')}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

    </div>
  );
};

export default NotesSidepanel;
