import React from "react";
import { Move, Maximize2, Minimize2, Trash2 } from "lucide-react";

interface ComponentEditControlsProps {
  onToggleSize: () => void;
  onRemove: () => void;
  dragHandleProps: any;
  isWide: boolean;
}

const ComponentEditControls: React.FC<ComponentEditControlsProps> = ({
  onToggleSize,
  onRemove,
  dragHandleProps,
  isWide,
}) => {
  return (
    <div className="absolute top-1 right-1 flex gap-1 z-10 bg-neutral-900 bg-opacity-70 rounded-md p-1">
      <button
        {...dragHandleProps}
        aria-label="Drag handle"
        className="cursor-move hover:text-accent-primary"
        title="Move component"
      >
        <Move size={16} />
      </button>
      <button
        onClick={onToggleSize}
        aria-label={isWide ? "Minimize component" : "Maximize component"}
        className="hover:text-accent-primary"
        title={isWide ? "Minimize component" : "Maximize component"}
      >
        {isWide ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
      <button
        onClick={onRemove}
        aria-label="Remove component"
        className="hover:text-red-500"
        title="Remove component"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

export default ComponentEditControls;
