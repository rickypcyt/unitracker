import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import { ChevronDown, ChevronUp, Edit2, ListOrdered, MoreVertical, Move, Pin, PinOff, Trash2 } from 'lucide-react';

import { useState } from 'react';

interface ColumnDropdownMenuProps {
  assignment: string;
  tasks: any[];
  onMoveToWorkspace: (assignment: string) => void;
  columnMenu: any;
  onDeleteAssignment?: (assignment: string) => void;
  onEditAssignment?: () => void;
  onSortClick?: (assignmentId: string, position: { x: number; y: number }) => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

const ColumnDropdownMenu = ({
  assignment,
  tasks: _tasks,
  onMoveToWorkspace,
  columnMenu,
  onDeleteAssignment,
  onEditAssignment,
  onSortClick,
  isMinimized = false,
  onToggleMinimize,
  isPinned = false,
  onTogglePin,
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
              ? 'text-(--accent-primary) bg-transparent shadow-lg scale-105' 
              : 'bg-(--bg-secondary) hover:bg-(--bg-primary) text-(--text-secondary) hover:text-(--text-primary)'
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
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-(--accent-primary) rounded-full animate-pulse"></span>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[220px] bg-(--bg-secondary) rounded-lg p-1 shadow-lg border-2 border-(--border-primary) z-9999 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          sideOffset={5}
          align="end"
          collisionPadding={10}
        >
          <DropdownMenu.Item
            onClick={handleEditClick}
            className="flex items-center gap-2 px-3 py-2 text-sm text-(--text-primary) hover:bg-(--bg-primary) rounded-md cursor-pointer outline-none transition-colors focus:bg-(--bg-primary) focus:text-(--text-primary)"
          >
            <Edit2 size={16} className="text-(--text-secondary)" />
            Edit assignment name
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onClick={handleSortClick}
            className="flex items-center gap-2 px-3 py-2 text-sm text-(--text-primary) hover:bg-(--bg-primary) rounded-md cursor-pointer outline-none transition-colors focus:bg-(--bg-primary) focus:text-(--text-primary)"
          >
            <ListOrdered size={16} className="text-(--text-secondary)" />
            Sort by
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-(--border-primary) my-1" />

          {onTogglePin && (
            <DropdownMenu.Item
              onClick={() => { onTogglePin(); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-(--text-primary) hover:bg-(--bg-primary) rounded-md cursor-pointer outline-none transition-colors focus:bg-(--bg-primary) focus:text-(--text-primary)"
            >
              {isPinned ? <PinOff size={16} className="text-(--text-secondary)" /> : <Pin size={16} className="text-(--text-secondary)" />}
              {isPinned ? 'Unpin column' : 'Pin column'}
            </DropdownMenu.Item>
          )}

          {onToggleMinimize && (
            <DropdownMenu.Item
              onClick={() => { onToggleMinimize(); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-(--text-primary) hover:bg-(--bg-primary) rounded-md cursor-pointer outline-none transition-colors focus:bg-(--bg-primary) focus:text-(--text-primary)"
            >
              {isMinimized ? <ChevronUp size={16} className="text-(--text-secondary)" /> : <ChevronDown size={16} className="text-(--text-secondary)" />}
              {isMinimized ? 'Expand tasks' : 'Collapse tasks'}
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Item
            onClick={() => {
              onMoveToWorkspace(assignment);
              setOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-(--text-primary) hover:bg-(--bg-primary) rounded-md cursor-pointer outline-none transition-colors focus:bg-(--bg-primary) focus:text-(--text-primary)"
          >
            <Move size={16} className="text-(--text-secondary)" />
            Move to another workspace
          </DropdownMenu.Item>
          
          <DropdownMenu.Separator className="h-px bg-(--border-primary) my-1" />
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