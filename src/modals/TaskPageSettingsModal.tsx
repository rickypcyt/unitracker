import { Columns2, Columns3, FolderKanban, Grid2x2, KanbanSquare, LayoutGrid } from 'lucide-react';

import BaseModal from '@/modals/BaseModal';

export type FabPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type ColumnCount = 1 | 2 | 3 | 4;
export type ViewMode = 'assignment' | 'status';

interface TaskPageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnCount: ColumnCount;
  fabPosition: FabPosition;
  viewMode: ViewMode;
  onColumnCountChange: (count: ColumnCount) => void;
  onFabPositionChange: (pos: FabPosition) => void;
  onViewModeChange: (mode: ViewMode) => void;
}

const COLUMN_OPTIONS: { value: ColumnCount; label: string; icon: typeof Columns2 }[] = [
  { value: 1, label: '1 Column', icon: Columns2 },
  { value: 2, label: '2 Columns', icon: Grid2x2 },
  { value: 3, label: '3 Columns', icon: Columns3 },
  { value: 4, label: '4 Columns', icon: LayoutGrid },
];

const POSITION_OPTIONS: { value: FabPosition; label: string; className: string }[] = [
  { value: 'top-left', label: 'Top Left', className: 'top-1.5 left-1.5' },
  { value: 'top-right', label: 'Top Right', className: 'top-1.5 right-1.5' },
  { value: 'bottom-left', label: 'Bottom Left', className: 'bottom-1.5 left-1.5' },
  { value: 'bottom-right', label: 'Bottom Right', className: 'bottom-1.5 right-1.5' },
];

const VIEW_MODE_OPTIONS: { value: ViewMode; label: string; icon: typeof FolderKanban }[] = [
  { value: 'assignment', label: 'By Assignment', icon: FolderKanban },
  { value: 'status', label: 'By Status', icon: KanbanSquare },
];

const TaskPageSettingsModal: React.FC<TaskPageSettingsModalProps> = ({
  isOpen,
  onClose,
  columnCount,
  fabPosition,
  viewMode,
  onColumnCountChange,
  onFabPositionChange,
  onViewModeChange,
}) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} showHeader={false} maxWidth="max-w-md" padding="none">
      <div className="space-y-6 p-6">
        {/* View mode selector */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Group By</h3>
          <div className="grid grid-cols-2 gap-2">
            {VIEW_MODE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = viewMode === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onViewModeChange(opt.value)}
                  className={`flex items-center gap-2 py-3 px-4 rounded-lg border transition-all ${
                    isActive
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                      : 'border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column count selector - only for assignment mode */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Number of Columns</h3>
          <div className="grid grid-cols-4 gap-2">
            {COLUMN_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = columnCount === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onColumnCountChange(opt.value)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border transition-all ${
                    isActive
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                      : 'border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAB position selector */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Add Button Position</h3>
          <div className="flex items-center gap-4">
            {/* Visual corner selector */}
            <div className="relative w-32 h-32 rounded-lg border-2 border-[var(--border-primary)] bg-[var(--bg-secondary)] flex-shrink-0">
              {POSITION_OPTIONS.map((opt) => {
                const isActive = fabPosition === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onFabPositionChange(opt.value)}
                    className={`absolute w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${opt.className} ${
                      isActive
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white scale-110'
                        : 'border-[var(--text-secondary)]/40 bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]'
                    }`}
                    aria-label={opt.label}
                    title={opt.label}
                  >
                    {isActive && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
                  </button>
                );
              })}
            </div>

            {/* Label for selected position */}
            <div className="flex flex-col gap-1">
              {POSITION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onFabPositionChange(opt.value)}
                  className={`text-sm text-left px-3 py-1.5 rounded-lg transition-colors ${
                    fabPosition === opt.value
                      ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-medium'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default TaskPageSettingsModal;
