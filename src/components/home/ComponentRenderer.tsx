import React from "react";
import { ComponentRegistry } from "../../utils/layoutManager";

interface ComponentRendererProps {
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
}

const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  componentKey,
  isEditing,
  colIndex,
  index,
  onToggleSize,
  onRemove,
  onContextMenu,
}) => {
  const Component = ComponentRegistry[componentKey]?.component;
  if (!Component) return null;

  return (
    <div
      className={`rounded-2xl shadow-lg ${
        isEditing ? "border-2 border-dashed border-gray-500" : ""
      }`}
      onContextMenu={(e) =>
        onContextMenu(e, componentKey, colIndex, index)
      }
    >
      <Component />
      {/* Si quieres poner un botón de eliminar dentro del componente, descomenta esto:
      {isEditing && onRemove && (
        <button onClick={() => onRemove(colIndex, index)}>
          Eliminar
        </button>
      )}
      */}
    </div>
  );
};

export default ComponentRenderer;
