import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';

import BaseModal from '@/modals/BaseModal';

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
  onAccept: (task: AITask) => void;
  onCancel: () => void;
};

const AIPreviewModal = ({ isOpen, tasks = [], onAccept, onCancel }: Props) => {
  // Keep a local copy so we can delete items without mutating parent
  const [items, setItems] = useState<AITask[]>(tasks ?? []);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    setItems(tasks ?? []);
    setSelectedIdx(0);
  }, [tasks]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={'AI Task Preview'}
      maxWidth="max-w-lg"
      className="overflow-hidden flex flex-col"
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Scrollable content. Add top padding on mobile so it doesn't sit under navbar/timer */}
        <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pb-12 pt-12 sm:pt-0">
          {items.length === 0 && (
            <div className="text-center text-[var(--text-secondary)]">No tasks to preview.</div>
          )}
          {items.map((task, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 border rounded-lg p-3 sm:p-4 transition-colors ${selectedIdx === idx ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-[var(--border-primary)] bg-[var(--bg-secondary)]'}`}
              onClick={() => setSelectedIdx(idx)}
              role="button"
            >
              {/* Content */}
              <div className="flex-1">
                {/* Header: inline index badge + title */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="shrink-0 select-none w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)] font-bold text-xs sm:text-sm">#{idx + 1}</div>
                  <div className="font-bold text-base sm:text-lg text-[var(--text-primary)] truncate">
                    {task.task || 'Untitled task'}
                  </div>
                </div>
                {/* Body content (indented to align after # badge) */}
                <div className="pl-9 sm:pl-10">
                  {task.description && (
                    <div className="text-sm sm:text-base text-[var(--text-secondary)] mb-1">
                      <span className="font-semibold">Description:</span> {task.description}
                    </div>
                  )}
                  <div className="text-sm sm:text-base text-[var(--text-secondary)] mb-1">
                    <span className="font-semibold">Assignment:</span> {task.subject || <span className="italic">None</span>}
                  </div>
                  <div className="text-sm sm:text-base text-[var(--text-secondary)] mb-1">
                    <span className="font-semibold">Date:</span> {task.date || <span className="italic">None</span>}
                  </div>
                  {task.difficulty && (
                    <div className="text-sm sm:text-base text-[var(--text-secondary)]">
                      <span className="font-semibold">Difficulty:</span> {task.difficulty}
                    </div>
                  )}
                </div>

                {/* Per-item actions removed: only overall Cancel/Accept are available in footer */}
                <div className="mt-2 md:mt-3" />
              </div>
            </div>
          ))}
        </div>
        {/* Footer pinned to bottom of modal */}
        <div className="mt-1 sm:mt-2 pt-2 sm:pt-3 bg-[var(--bg-primary)] border-t border-[var(--border-primary)]">
          <div className="mb-2 md:mb-2 lg:mb-2 flex items-center justify-between gap-2">
            {/* Left small square Cancel */}
            <button
              onClick={onCancel}
              aria-label="Cancel"
              title="Cancel"
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-md border border-[var(--border-primary)] hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-secondary)]"
            >
              <X size={16} />
            </button>
            {/* Right: Accept */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => items[selectedIdx] && onAccept(items[selectedIdx])}
                title="Accept selected"
                className="p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 flex items-center text-green-500"
                disabled={items.length === 0}
              >
                <Check size={18} />
                <span className="hidden md:inline ml-2">Accept</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default AIPreviewModal;