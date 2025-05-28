import React, { useEffect, useRef } from "react";
import { Trash2, Settings } from "lucide-react";

const ContextMenu = ({
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
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-neutral-900 p-2 rounded-lg shadow-lg z-50 border border-neutral-800 min-w-[200px]"
      style={{ 
        left: Math.min(x, window.innerWidth - 220),
        top: Math.min(y, window.innerHeight - 150)
      }}
    >
      <div className="space-y-1">
        <button
          onClick={() => {
            onToggleEdit();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm bg-neutral-800 hover:bg-neutral-700 rounded-md bg-opacity-60 flex items-center gap-2 transition-colors duration-200"
        >
          <Settings size={16} />
          {isEditing ? "Exit Edit Layout" : "Edit Layout"}
        </button>
        {isEditing && (
          <button
            onClick={() => {
              onRemove(colIndex, itemIndex);
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-neutral-800 rounded-md flex items-center gap-2 transition-colors duration-200"
          >
            <Trash2 size={16} />
            Delete Component
          </button>
        )}
      </div>
    </div>
  );
};

export default ContextMenu;
