import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import { Edit2, ListOrdered, MoreVertical, Move, Trash2 } from 'lucide-react';

import { useState } from 'react';

interface ColumnDropdownMenuProps {
  assignment: string;
  tasks: any[];
  onMoveToWorkspace: (assignment: string) => void;
  columnMenu: any;
  onDeleteAssignment?: (assignment: string) => void;
  onEditAssignment?: () => void;
  onSortClick?: (assignmentId: string, position: { x: number; y: number }) => void;
}

const ColumnDropdownMenu = ({
  assignment,
  tasks, // eslint-disable-line @typescript-eslint/no-unused-vars
  onMoveToWorkspace,
  columnMenu,
  onDeleteAssignment,
  onEditAssignment,
  onSortClick,
}: ColumnDropdownMenuProps) => {
  const [isMenuButtonHovered, setIsMenuButtonHovered] = useState(false);
  const [open, setOpen] = useState(false);

  const handleEditClick = () => {
    onEditAssignment?.();
    setOpen(false);
  };

  const handleSortClick = (event: React.MouseEvent) => {
    // Trigger sort with the button position before closing
    if (onSortClick) {
      const rect = event.currentTarget.getBoundingClientRect();
      onSortClick(assignment, { x: rect.left, y: rect.bottom });
    }
    setOpen(false);
  };

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          onMouseEnter={() => setIsMenuButtonHovered(true)}
          onMouseLeave={() => setIsMenuButtonHovered(false)}
          className={`p-2 rounded-lg transition-all duration-200 relative group hover:scale-105 active:scale-95 ${
            columnMenu 
              ? 'bg-[var(--accent-primary)] text-white shadow-lg scale-105' 
              : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          title="More options"
        >
          <MoreVertical 
            size={22} 
            className={`transition-all duration-200 ${
              isMenuButtonHovered || columnMenu 
                ? 'transform rotate-90' 
                : ''
            }`}
          />
          {/* Ripple effect */}
          <span className="absolute inset-0 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></span>
          
          {/* Active indicator */}
          {columnMenu && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--accent-primary)] rounded-full animate-pulse"></span>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[220px] bg-[var(--bg-secondary)] rounded-lg p-1 shadow-lg border border-[var(--border-primary)] z-[9999] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          sideOffset={5}
          align="end"
          collisionPadding={10}
        >
          <DropdownMenu.Item
            onClick={handleEditClick}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors focus:bg-[var(--bg-primary)] focus:text-[var(--text-primary)]"
          >
            <Edit2 size={16} className="text-[var(--text-secondary)]" />
            Edit assignment name
          </DropdownMenu.Item>
          
          <DropdownMenu.Item
            onClick={handleSortClick}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors focus:bg-[var(--bg-primary)] focus:text-[var(--text-primary)]"
          >
            <ListOrdered size={16} className="text-[var(--text-secondary)]" />
            Sort by
          </DropdownMenu.Item>
          
          <DropdownMenu.Separator className="h-px bg-[var(--border-primary)] my-1" />
          
          <DropdownMenu.Item
            onClick={() => {
              onMoveToWorkspace(assignment);
              setOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors focus:bg-[var(--bg-primary)] focus:text-[var(--text-primary)]"
          >
            <Move size={16} className="text-[var(--text-secondary)]" />
            Move to another workspace
          </DropdownMenu.Item>
          
          <DropdownMenu.Separator className="h-px bg-[var(--border-primary)] my-1" />
          <DropdownMenu.Item
            onClick={() => {
              onDeleteAssignment?.(assignment);
              setOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-md cursor-pointer outline-none transition-colors focus:bg-red-500/10 focus:text-red-500"
          >
            <Trash2 size={16} className="text-red-500" />
            Delete assignment (and all tasks)
          </DropdownMenu.Item>
          
          
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default ColumnDropdownMenu; 