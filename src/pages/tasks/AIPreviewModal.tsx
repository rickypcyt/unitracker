import 'react-datepicker/dist/react-datepicker.css';

import { Calendar, Check, Pencil, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import BaseModal from '@/modals/BaseModal';
import DatePicker from 'react-datepicker';

type AITask = {
  task?: string;
  description?: string;
  date?: string | null;
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
};

type Props = {
  isOpen: boolean;
  tasks?: AITask[];
  onAcceptAll?: (tasks: AITask[]) => void;
  onCancel: () => void;
};

const AIPreviewModal = ({ isOpen, tasks = [], onAcceptAll, onCancel }: Props) => {
  // Keep a local copy so we can delete items without mutating parent
  const [items, setItems] = useState<AITask[]>(tasks ?? []);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [editDifficulty, setEditDifficulty] = useState<string>('medium');

  // Only update items if tasks prop changes and is different from current items
  useEffect(() => {
    if (JSON.stringify(tasks) !== JSON.stringify(items)) {
      setItems(tasks ?? []);
    }
    // Reset selection and edit states when modal is opened/closed
    if (!isOpen) {
      setSelectedIdx(0);
      setEditIdx(null);
    }
  }, [tasks, isOpen]);

  const beginEdit = (idx: number) => {
    const task = items[idx];
    setEditIdx(idx);
    setEditTitle(task?.task ?? '');
    setEditDesc(task?.description ?? '');
    setEditSubject(task?.subject ?? '');
    setEditDifficulty(task?.difficulty ?? 'medium');
    
    // Parse date string to Date object
    if (task?.date && task.date !== 'null') {
      try {
        const date = new Date(task.date);
        setEditDate(isNaN(date.getTime()) ? null : date);
      } catch {
        setEditDate(null);
      }
    } else {
      setEditDate(null);
    }
  };

  const cancelEdit = () => {
    setEditIdx(null);
  };

  const saveEdit = () => {
    if (editIdx === null) return;
    
    // Format date back to string
    const dateString = editDate ? editDate.toISOString().split('T')[0] : null;
    
    setItems(prev => prev.map((it, i) => i === editIdx ? {
      ...it,
      task: editTitle,
      description: editDesc,
      subject: editSubject,
      date: dateString || null,
      difficulty: editDifficulty
    } : it));
    setEditIdx(null);
  };

  const deleteItem = useCallback((idx: number) => {
    setItems(prev => {
      const newItems = prev.filter((_, i) => i !== idx);
      
      // Update selected index if needed
      if (selectedIdx >= idx && selectedIdx > 0) {
        setSelectedIdx(prevIdx => prevIdx - 1);
      }
      
      // Update edit index if needed
      if (editIdx !== null) {
        if (idx === editIdx) {
          setEditIdx(null);
        } else if (idx < editIdx) {
          setEditIdx(prevIdx => prevIdx !== null ? prevIdx - 1 : null);
        }
      }
      
      return newItems;
    });
  }, [selectedIdx, editIdx]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={'AI Task Preview'}
      maxWidth="max-w-lg"
      className="overflow-hidden flex flex-col"
      overlayClassName="!bg-white/60 dark:!bg-black/70"
    >
      <div className="flex flex-col h-full max-h-[90vh]">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-4 py-4 sm:py-0">
          {items.length === 0 && (
            <div className="text-center text-[var(--text-secondary)]">No tasks to preview.</div>
          )}
          {items.map((task, idx) => (
            <div
              key={idx}
              className={`flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 border rounded-lg p-3 sm:p-4 transition-colors ${selectedIdx === idx ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-[var(--border-primary)] bg-[var(--bg-secondary)]'}`}
              onClick={() => setSelectedIdx(idx)}
              role="button"
            >
              {/* Content */}
              <div className="flex-1">
                {/* Header: index badge + title + actions */}
                <div className="flex items-center gap-2 mb-2 sm:mb-1">
                  <div className="shrink-0 select-none w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)] font-bold text-sm sm:text-sm">#{idx + 1}</div>
                  {editIdx === idx ? (
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 min-w-0 px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] text-sm sm:text-base"
                      placeholder="Task title"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="flex-1 font-bold text-sm sm:text-lg text-[var(--text-primary)] truncate">
                      {task.task || 'Untitled task'}
                    </div>
                  )}
                  {/* Item actions: edit and delete */}
                  <div className="flex items-center gap-1 sm:ml-auto">
                    <button
                      type="button"
                      title="Edit"
                      onClick={(e) => { e.stopPropagation(); editIdx === idx ? cancelEdit() : beginEdit(idx); }}
                      className="p-1.5 sm:p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-transform"
                    >
                      <Pencil size={14} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      onClick={(e) => { e.stopPropagation(); deleteItem(idx); }}
                      className="p-1.5 sm:p-1 rounded-md text-red-500 hover:text-red-400 active:scale-95 transition-transform"
                    >
                      <Trash2 size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
                {/* Body content */}
                <div className="pl-8 sm:pl-10 space-y-1">
                  {editIdx === idx ? (
                    <div onClick={(e) => e.stopPropagation()} className="space-y-1">
                      <div className="flex items-center gap-2 text-sm sm:text-base">
                        <span className="font-semibold text-[var(--text-secondary)] text-sm sm:text-sm w-20 sm:w-28">Description:</span>
                        <input
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="flex-1 min-w-0 px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] text-sm"
                          placeholder="Description"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-sm sm:text-base">
                        <span className="font-semibold text-[var(--text-secondary)] text-sm sm:text-sm w-20 sm:w-28">Assignment:</span>
                        <input
                          value={editSubject}
                          onChange={(e) => setEditSubject(e.target.value)}
                          className="flex-1 min-w-0 px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] text-sm"
                          placeholder="Assignment/Subject"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-sm sm:text-base">
                        <span className="font-semibold text-[var(--text-secondary)] text-sm sm:text-sm w-20 sm:w-28">Date:</span>
                        <div className="relative flex-1 min-w-0">
                          <DatePicker
                            selected={editDate}
                            onChange={(date) => setEditDate(date)}
                            className="w-full px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] pr-8 text-sm"
                            placeholderText="YYYY-MM-DD"
                            dateFormat="yyyy-MM-dd"
                            minDate={new Date()}
                          />
                          <Calendar size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm sm:text-base">
                        <span className="font-semibold text-[var(--text-secondary)] text-sm sm:text-sm w-20 sm:w-28">Difficulty:</span>
                        <select
                          value={editDifficulty}
                          onChange={(e) => setEditDifficulty(e.target.value)}
                          className="px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] text-sm"
                        >
                          <option value="easy">easy</option>
                          <option value="medium">medium</option>
                          <option value="hard">hard</option>
                        </select>
                      </div>
                      <div className="mt-2 flex items-center gap-2 justify-end">
                        <button type="button" onClick={(e) => { e.stopPropagation(); cancelEdit(); }} className="px-2 py-1 text-sm sm:text-sm rounded-md border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] active:scale-95 transition-transform">
                          Cancel
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); saveEdit(); }} className="px-2 py-1 text-sm sm:text-sm rounded-md bg-[var(--accent-primary)] text-white font-medium active:scale-95 transition-transform">
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {task.description && (
                        <div className="text-sm text-[var(--text-secondary)]">
                          <span className="font-semibold">Description:</span> {task.description}
                        </div>
                      )}
                    </>
                  )}
                  {editIdx !== idx && (
                    <>
                      <div className="text-sm text-[var(--text-secondary)]">
                        <span className="font-semibold">Assignment:</span> {task.subject || <span className="italic">None</span>}
                      </div>
                      <div className="text-sm text-[var(--text-secondary)]">
                        <span className="font-semibold">Date:</span> {task.date || <span className="italic">None</span>}
                      </div>
                      {task.difficulty && (
                        <div className="text-sm text-[var(--text-secondary)]">
                          <span className="font-semibold">Difficulty:</span> {task.difficulty}
                        </div>
                      )}
                    </>
                  )}
                </div>

                </div>

                <div className="mt-1 sm:mt-2" />
            </div>
          ))}
        </div>
        
        {/* Sticky footer - outside scrollable content */}
        <div className="flex-shrink-0 pt-2 sm:pt-3 bg-[var(--bg-primary)] border-t border-[var(--border-primary)]">
          <div className="flex items-center justify-between gap-2">
            {/* Cancel button */}
            <button
              onClick={onCancel}
              aria-label="Cancel"
              title="Cancel"
              className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg border border-[var(--border-primary)] hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-secondary)] active:scale-95 transition-transform"
            >
              <X size={18} className="sm:w-4 sm:h-4" />
            </button>
            {/* Accept button */}
            <button
              onClick={() => items.length > 0 && onAcceptAll?.(items)}
              title="Accept all"
              className="px-4 py-2 sm:p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 flex items-center text-green-500 border border-green-500/20 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={items.length === 0}
            >
              <Check size={18} className="sm:w-4 sm:h-4" />
              <span className="ml-2 text-sm font-medium">Accept</span>
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default AIPreviewModal;