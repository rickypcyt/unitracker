import { ChevronDown, ChevronUp, Edit2, ListOrdered, MoreVertical, Move, Pin, PinOff, Trash2 } from 'lucide-react';

import { Dropdown, Separator } from '@heroui/react';
import { useRef } from 'react';

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
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleSortClick = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) onSortClick?.(assignment, { x: rect.left, y: rect.bottom });
  };

  return (
    <Dropdown>
      <Dropdown.Trigger
          ref={triggerRef}
          className={`p-2 rounded-lg transition-all duration-200 relative group hover:scale-105 active:scale-95 ${
            columnMenu 
              ? 'text-(--accent-primary) bg-transparent shadow-lg scale-105' 
              : 'bg-(--bg-secondary) hover:bg-(--bg-primary) text-(--text-secondary) hover:text-(--text-primary)'
          }`}
          aria-label="More options"
        >
          <MoreVertical 
            size={22} 
            className={`transition-all duration-200 group-hover:rotate-90 ${columnMenu ? 'rotate-90' : ''}`}
          />
          {/* Ripple effect */}
          <span className="absolute inset-0 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></span>
          
          {/* Active indicator */}
          {columnMenu && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-(--accent-primary) rounded-full animate-pulse"></span>
          )}
        </Dropdown.Trigger>

      <Dropdown.Popover
        className="min-w-[220px] bg-(--bg-secondary) rounded-lg p-1 shadow-lg border-2 border-(--border-primary) z-9999"
        offset={5}
        placement="bottom end"
        containerPadding={10}
      >
        <Dropdown.Menu aria-label="Column options">
          <Dropdown.Item
            id="edit"
            textValue="Edit assignment name"
            onAction={() => onEditAssignment?.()}
            className="flex items-center gap-2 px-3 py-2 text-sm text-(--text-primary) hover:bg-(--bg-primary) rounded-md cursor-pointer outline-none transition-colors focus:bg-(--bg-primary) focus:text-(--text-primary)"
          >
            <Edit2 size={16} className="text-(--text-secondary)" />
            Edit assignment name
          </Dropdown.Item>

          <Dropdown.Item
            id="sort"
            textValue="Sort by"
            onAction={handleSortClick}
            className="flex items-center gap-2 px-3 py-2 text-sm text-(--text-primary) hover:bg-(--bg-primary) rounded-md cursor-pointer outline-none transition-colors focus:bg-(--bg-primary) focus:text-(--text-primary)"
          >
            <ListOrdered size={16} className="text-(--text-secondary)" />
            Sort by
          </Dropdown.Item>

          <Separator className="h-px bg-(--border-primary) my-1" />

          {onTogglePin && (
            <Dropdown.Item
              id="pin"
              textValue="Pin column"
              onAction={onTogglePin}
              className="flex items-center gap-2 px-3 py-2 text-sm text-(--text-primary) hover:bg-(--bg-primary) rounded-md cursor-pointer outline-none transition-colors focus:bg-(--bg-primary) focus:text-(--text-primary)"
            >
              {isPinned ? <PinOff size={16} className="text-(--text-secondary)" /> : <Pin size={16} className="text-(--text-secondary)" />}
              {isPinned ? 'Unpin column' : 'Pin column'}
            </Dropdown.Item>
          )}

          {onToggleMinimize && (
            <Dropdown.Item
              id="minimize"
              textValue="Collapse tasks"
              onAction={onToggleMinimize}
              className="flex items-center gap-2 px-3 py-2 text-sm text-(--text-primary) hover:bg-(--bg-primary) rounded-md cursor-pointer outline-none transition-colors focus:bg-(--bg-primary) focus:text-(--text-primary)"
            >
              {isMinimized ? <ChevronUp size={16} className="text-(--text-secondary)" /> : <ChevronDown size={16} className="text-(--text-secondary)" />}
              {isMinimized ? 'Expand tasks' : 'Collapse tasks'}
            </Dropdown.Item>
          )}

          <Dropdown.Item
            id="move"
            textValue="Move to another workspace"
            onAction={() => onMoveToWorkspace(assignment)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-(--text-primary) hover:bg-(--bg-primary) rounded-md cursor-pointer outline-none transition-colors focus:bg-(--bg-primary) focus:text-(--text-primary)"
          >
            <Move size={16} className="text-(--text-secondary)" />
            Move to another workspace
          </Dropdown.Item>
          
          <Separator className="h-px bg-(--border-primary) my-1" />
          <Dropdown.Item
            id="delete"
            textValue="Delete assignment"
            onAction={() => onDeleteAssignment?.(assignment)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-md cursor-pointer outline-none transition-colors focus:bg-red-500/10 focus:text-red-500"
          >
            <Trash2 size={16} className="text-red-500" />
            Delete assignment (and all tasks)
          </Dropdown.Item>
          
          
        </Dropdown.Menu>
        </Dropdown.Popover>
    </Dropdown>
  );
};

export default ColumnDropdownMenu; 