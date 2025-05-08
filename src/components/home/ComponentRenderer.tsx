import React from "react";
import { ComponentRegistry } from "../../utils/layoutManager";

interface ComponentRendererProps {
  componentKey: string;
  isEditing: boolean;
  onToggleSize: (key: string) => void;
  onRemove: (colIndex: number, itemIndex: number) => void;
  onContextMenu: (e: React.MouseEvent, componentId: string) => void;
  colIndex: number;
  index: number;
}

const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  componentKey,
  isEditing,
  onContextMenu,
}) => {
  const Component = ComponentRegistry[componentKey]?.component;
  if (!Component) return null;

  return (
    <div
      className={`rounded-2xl shadow-lg ${
        isEditing ? "border-2 border-dashed border-gray-500" : ""
      } `}
      onContextMenu={(e) => onContextMenu(e, componentKey)}
    >
      <Component />
    </div>
  );
};

export default ComponentRenderer;
