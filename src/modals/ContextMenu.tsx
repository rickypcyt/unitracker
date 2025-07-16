import { Settings, Trash2 } from "lucide-react";

import BaseMenu from '@/modals/BaseMenu';
import React from "react";

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
  return (
    <BaseMenu
      x={Math.min(x, window.innerWidth - 220)}
      y={Math.min(y, window.innerHeight - 150)}
      onClose={onClose}
      aria-label="Context menu"
    >
      <div className="space-y-1">
        <button
          onClick={() => {
            onToggleEdit();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-base bg-white hover:bg-neutral-100 rounded-md flex items-center gap-2 transition-colors duration-200 text-neutral-700"
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
            className="w-full px-4 py-2 text-left text-base text-red-500 hover:bg-neutral-100 rounded-md flex items-center gap-2 transition-colors duration-200"
          >
            <Trash2 size={16} />
            Delete Component
          </button>
        )}
      </div>
    </BaseMenu>
  );
};

export default ContextMenu;
