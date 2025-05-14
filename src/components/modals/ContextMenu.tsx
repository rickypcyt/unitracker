import React, { useEffect, useRef } from "react";
import { Trash2, Settings } from "lucide-react";

interface ContextMenuProps {
  x: number;
  y: number;
  componentId: string;
  colIndex: number;
  itemIndex: number;
  isEditing: boolean;
  onClose: () => void;
  onRemove: (colIndex: number, itemIndex: number) => void;
  onToggleEdit: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  componentId,
  colIndex,
  itemIndex,
  isEditing,
  onClose,
  onRemove,
  onToggleEdit,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Cierra el menú si se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-neutral-900 p-2 rounded-lg shadow-lg z-50 border border-neutral-800"
      style={{ left: x, top: y }}
    >
      <div className="space-y-1">
        <button
          onClick={() => {
            onToggleEdit();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-base bg-neutral-800 hover:bg-neutral-700 rounded-md bg-opacity-60 flex items-center gap-2"
        >
          <Settings size={16} />
          {isEditing ? "Exit Edit Layout" : "Edit Layout"}
        </button>

        <button
          onClick={() => {
            onRemove(colIndex, itemIndex);
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-base text-red-500 hover:bg-neutral-800 rounded-md flex items-center gap-2"
        >
          <Trash2 size={16} />
          Delete Component
        </button>
      </div>
    </div>
  );
};

export default ContextMenu;
