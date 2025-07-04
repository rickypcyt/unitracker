import { Clipboard, Info, Play, Trash2 } from "lucide-react";
import React, { useEffect, useRef } from "react";

export const TaskListMenu = ({
  contextMenu,
  onClose,
  onDoubleClick,
  onSetActiveTask,
  onDeleteTask,
  onEditTask,
}) => {
  const menuRef = useRef(null);

  // Cerrar con click fuera y Escape
  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [contextMenu, onClose]);

  if (!contextMenu) return null;

  return (
    <div
      ref={menuRef}
      className="fixed bg-[var(--bg-primary)] p-2 rounded-lg shadow-lg z-50 border border-[var(--border-primary)]"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
      }}
    >
      <div className="space-y-1">
        <button
          onClick={() => {
            const t = contextMenu.task;
            const text = `Title: ${t.title || ''}\nDescription: ${t.description || ''}\nAssignment: ${t.assignment || ''}\nDate: ${t.deadline || t.due_date || ''}`;
            navigator.clipboard.writeText(text);
            onClose();
          }}
          className="w-full px-2 py-2 text-left text-base text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md flex items-center gap-2 transition-colors"
        >
          <Clipboard size={16} />
          Copy Task
        </button>
        <button
          onClick={() => {
            onEditTask(contextMenu.task);
            onClose();
          }}
          className="w-full px-2 py-2 text-left text-base text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md flex items-center gap-2 transition-colors"
        >
          <Info size={16} />
          Edit Task
        </button>
        {contextMenu.task.activetask ? (
          <button
            onClick={() => {
              onSetActiveTask({
                ...contextMenu.task,
                activetask: false,
              });
              onClose();
            }}
            className="w-full px-2 py-2 text-left text-base text-yellow-500 hover:bg-[var(--bg-secondary)] rounded-md flex items-center gap-2 transition-colors"
          >
            <Play size={16} className="rotate-180" />
            Deactivate Task
          </button>
        ) : (
          <button
            onClick={() => {
              onSetActiveTask({
                ...contextMenu.task,
                activetask: true,
              });
              onClose();
            }}
            className="w-full px-2 py-2 text-left text-base text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md flex items-center gap-2 transition-colors"
          >
            <Play size={16} />
            Set as Active Task
          </button>
        )}
        <button
          onClick={() => {
            onDeleteTask(contextMenu.task.id);
            onClose();
          }}
          className="w-full px-2 py-2 text-left text-base text-red-500 hover:bg-[var(--bg-secondary)] rounded-md flex items-center gap-2 transition-colors"
        >
          <Trash2 size={16} />
          Delete Task
        </button>
      </div>
    </div>
  );
};
