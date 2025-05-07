import React from "react";
import { Draggable, DraggableProvided } from "react-beautiful-dnd";
import { ComponentRegistry } from "../../utils/componentRegistry";
import ComponentEditControls from "./EditMode";

interface ComponentRendererProps {
  componentKey: string;
  colIndex: number;
  index: number;
  isEditing: boolean;
  isWide: boolean;
  onToggleSize: (key: string) => void;
  onRemove: (colIndex: number, itemIndex: number) => void;
  onContextMenu: (e: React.MouseEvent, componentId: string) => void;
}

const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  componentKey,
  colIndex,
  index,
  isEditing,
  isWide,
  onToggleSize,
  onRemove,
  onContextMenu,
}) => {
  const Component = ComponentRegistry[componentKey]?.component;
  if (!Component) return null;

  return (
    <Draggable
      draggableId={`${componentKey}-${colIndex}-${index}`}
      index={index}
      isDragDisabled={!isEditing}
    >
      {(provided: DraggableProvided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`relative ${isWide ? "lg:col-span-2" : ""}`}
          onContextMenu={(e) => onContextMenu(e, componentKey)}
        >
          {isEditing && (
            <ComponentEditControls
              onToggleSize={() => onToggleSize(componentKey)}
              onRemove={() => onRemove(colIndex, index)}
              dragHandleProps={provided.dragHandleProps}
              isWide={isWide}
            />
          )}
          <div
            className={`rounded-lg shadow-lg ${
              isEditing ? "border-2 border-dashed border-gray-700" : ""
            }`}
          >
            <Component />
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default ComponentRenderer;
