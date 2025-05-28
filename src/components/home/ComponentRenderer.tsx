import React from "react";
import { ComponentRegistry } from "../../utils/layoutManager";

export interface ComponentRendererProps {
  componentKey: string;
  isEditing: boolean;
  colIndex: number;
  index: number;
  onToggleSize?: (key: string) => void;
  onRemove?: (colIndex: number, itemIndex: number) => void;
  onContextMenu: (
    e: React.MouseEvent,
    componentKey: string,
    colIndex: number,
    itemIndex: number
  ) => void;
  pomodoroRef?: React.RefObject<any>;
}

const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  componentKey,
  pomodoroRef,
  isEditing,
  colIndex,
  index,
  onToggleSize,
  onRemove,
  onContextMenu,
  ...props
}) => {
  const Component = ComponentRegistry[componentKey]?.component;
  if (!Component) return null;

  return (
    <div
      className={`relative flex items-center justify-center ${isEditing ? "ring-2 ring-accent-primary ring-opacity-50 rounded-lg" : ""}`}
      onContextMenu={(e) => onContextMenu(e, componentKey, colIndex, index)}
    >
      <Component ref={pomodoroRef} {...props} />
      {isEditing && (
        <div className="absolute top-2 right-2 text-base text-accent-primary bg-neutral-900 px-2 py-1 rounded-full">
          {ComponentRegistry[componentKey]?.name}
        </div>
      )}
    </div>
  );
};

export default ComponentRenderer;
