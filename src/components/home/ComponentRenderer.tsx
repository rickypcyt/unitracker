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
      className={` ${isEditing ? "editing" : ""}`}
      onContextMenu={(e) => onContextMenu(e, componentKey, colIndex, index)}
    >
      <Component />
    </div>
  );
};

export default ComponentRenderer;
