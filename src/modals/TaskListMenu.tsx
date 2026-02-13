import { Calendar, Clipboard, Info, Trash2 } from "lucide-react";
import React, { KeyboardEvent, MouseEvent, useEffect, useRef, useState } from "react";

import { Task } from "@/types/taskStorage";

interface ContextMenuState {
  type?: string;
  x: number;
  y: number;
  task: Task & { status?: string };
}

interface TaskListMenuProps {
  contextMenu: ContextMenuState | null;
  onClose: () => void;
  onSetTaskStatus: (task: Task & { status?: string }) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onSetDate?: (task: Task, position: { x: number; y: number }) => void; // New prop for setting date with position
}

const TASK_STATUSES = [
  { id: 'not_started', label: 'Not Started', textColor: 'text-[var(--text-primary)]', bgColor: 'bg-[var(--text-primary)]' },
  { id: 'in_progress', label: 'In Progress', textColor: 'text-green-500', bgColor: 'bg-green-500' },
  { id: 'on_hold', label: 'On Hold', textColor: 'text-blue-500', bgColor: 'bg-blue-500' },
  { id: 'active', label: 'Active', textColor: 'text-yellow-500', bgColor: 'bg-yellow-500' },
];

export const TaskListMenu: React.FC<TaskListMenuProps> = ({
  contextMenu,
  onClose,
  onSetTaskStatus,
  onDeleteTask,
  onEditTask,
  onSetDate,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [statusPosition, setStatusPosition] = useState({ x: 0, y: 0 });
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // Cerrar con click fuera y Escape
  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const clickedInsideMenu = menuRef.current && menuRef.current.contains(event.target as Node);
      const clickedInsideStatusMenu = statusMenuRef.current && statusMenuRef.current.contains(event.target as Node);
      
      if (!clickedInsideMenu && !clickedInsideStatusMenu) {
        if (showStatusMenu) {
          setShowStatusMenu(false);
        } else {
          onClose();
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showStatusMenu) {
          setShowStatusMenu(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside as unknown as EventListener);
    document.addEventListener("keydown", handleEscape as unknown as EventListener);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside as unknown as EventListener);
      document.removeEventListener("keydown", handleEscape as unknown as EventListener);
    };
  }, [contextMenu, onClose, showStatusMenu]);

  // Initialize and adjust main menu position to avoid viewport overflow
  useEffect(() => {
    if (!contextMenu) return;
    // Initialize with position moved up from click
    setMenuPosition({ x: contextMenu.x, y: contextMenu.y - 150 });

    const adjust = () => {
      const el = menuRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      let x = contextMenu.x;
      let y = contextMenu.y - 150; // Start 150px above click
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // If overflowing right, shift left
      if (x + rect.width > vw - 8) {
        x = Math.max(8, vw - rect.width - 8);
      }
      // If overflowing bottom, open upwards
      if (y + rect.height > vh - 8) {
        y = Math.max(8, vh - rect.height - 8);
      }
      // If overflowing top, show below click
      if (y < 8) {
        y = contextMenu.y + 20; // Show below if no space above
      }
      setMenuPosition({ x, y });
    };
    // Wait a frame to ensure dimensions ready
    const raf = requestAnimationFrame(adjust);
    return () => cancelAnimationFrame(raf);
  }, [contextMenu]);

  const handleStatusButtonClick = (e: React.MouseEvent) => {
    console.log('TaskListMenu - Status button clicked!');
    e.stopPropagation();
    const buttonElement = (e.target as HTMLElement).closest('button');
    const rect = buttonElement?.getBoundingClientRect();
    if (rect) {
      // Default open to the right of the button
      let x = rect.right + 20;
      let y = rect.top - 10;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Rough initial clamp to viewport; final adjustment occurs after render
      if (x > vw - 8) x = Math.max(8, vw - 220); // assume ~220px min width
      if (y > vh - 8) y = Math.max(8, vh - 200); // assume ~200px height
      setStatusPosition({ x, y });
      setShowStatusMenu(true);
      console.log('TaskListMenu - Status menu should be visible now');
    }
  };

  const handleStatusSelect = (statusId: string) => {
    console.log('TaskListMenu - handleStatusSelect called with:', { statusId, task: contextMenu!.task });
    
    const updatedTask = {
      ...contextMenu!.task,
      status: statusId,
      activetask: statusId === 'in_progress' ? true : false
    };
    
    console.log('TaskListMenu - Updated task data:', updatedTask);
    
    onSetTaskStatus(updatedTask);
    setShowStatusMenu(false);
    onClose();
  };

  if (!contextMenu) return null;

  const currentStatus = contextMenu.task.status || 'not_started';
  const currentStatusInfo = TASK_STATUSES.find(s => s.id === currentStatus);
  const currentStatusLabel = currentStatusInfo?.label || 'Set Status';
  const currentStatusTextColor = currentStatusInfo?.textColor || 'text-[var(--text-primary)]';
  const currentStatusBgColor = currentStatusInfo?.bgColor || 'bg-[var(--text-primary)]';

  return (
    <>
      <div
        ref={menuRef}
        className="fixed z-50 min-w-[220px] rounded-lg bg-[var(--bg-primary)] p-2 shadow-xl"
        style={{
          position: 'fixed',
          left: (menuPosition?.x ?? contextMenu.x),
          top: (menuPosition?.y ?? contextMenu.y),
          border: '2px solid var(--border-primary)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}
      >
        <div className="space-y-1">
          <div className="relative">
            <button
              onClick={handleStatusButtonClick}
              className="w-full px-2 py-2 text-left text-base text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md flex items-center justify-between gap-2 transition-all duration-200 hover:ring-2 hover:ring-[var(--accent-primary)] hover:ring-opacity-50"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${currentStatusBgColor}`}></span>
                <span className={currentStatusTextColor}>{currentStatusLabel}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <button
            onClick={() => {
              onEditTask(contextMenu.task);
              onClose();
            }}
            className="w-full px-2 py-2 text-left text-base text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md flex items-center gap-2 transition-all duration-200 hover:ring-2 hover:ring-[var(--accent-primary)] hover:ring-opacity-50"
          >
            <Info size={16} />
            Edit Task
          </button>
          
          {onSetDate && (
            <button
              onClick={() => {
                const position = menuPosition || { x: contextMenu.x, y: contextMenu.y };
                onSetDate(contextMenu.task, position);
                onClose();
              }}
              className="w-full px-2 py-2 text-left text-base text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md flex items-center gap-2 transition-all duration-200 hover:ring-2 hover:ring-[var(--accent-primary)] hover:ring-opacity-50"
            >
              <Calendar size={16} />
              Date
            </button>
          )}
          
          <button
            onClick={() => {
              const t = contextMenu.task;
              const text = `Title: ${t.title || ''}\nDescription: ${t.description || ''}\nAssignment: ${t.assignment || ''}\nDate: ${t.deadline || t.due_date || ''}`;
              navigator.clipboard.writeText(text);
              onClose();
            }}
            className="w-full px-2 py-2 text-left text-base text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md flex items-center gap-2 transition-all duration-200 hover:ring-2 hover:ring-[var(--accent-primary)] hover:ring-opacity-50"
          >
            <Clipboard size={16} />
            Copy Task
          </button>
          
          <button
            onClick={() => {
              onDeleteTask(contextMenu.task.id);
              onClose();
            }}
            className="w-full px-2 py-2 text-left text-base text-red-500 hover:bg-[var(--bg-secondary)] rounded-md flex items-center gap-2 transition-all duration-200 hover:ring-2 hover:ring-red-500 hover:ring-opacity-30"
          >
            <Trash2 size={16} />
            Delete Task
          </button>
        </div>
      </div>

      {showStatusMenu && (
        <div
          ref={statusMenuRef}
          className="fixed z-50 min-w-[180px] rounded-lg bg-[var(--bg-primary)] p-2 shadow-xl"
          style={{
            position: 'fixed',
            left: statusPosition.x,
            top: statusPosition.y,
            border: '2px solid var(--border-primary)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-1">
            {TASK_STATUSES.map((status) => (
              <button
                key={status.id}
                onClick={() => {
                console.log('TaskListMenu - Status option clicked:', status.id);
                handleStatusSelect(status.id);
              }}
                className={`w-full px-2 py-2 text-left text-base rounded-md flex items-center gap-2 transition-all duration-200 hover:bg-[var(--bg-secondary)] ${status.textColor} ${
                  currentStatus === status.id ? 'font-semibold' : ''
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current"></span>
                {status.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
