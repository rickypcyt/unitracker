import React from "react";
import { Droppable } from "react-beautiful-dnd";
import ComponentRenderer from "./ComponentRenderer";
import AddComponentButton from "./AddComponentButton";

interface LayoutColumn {
  id: string;
  items: string[];
}

interface LayoutColumnsProps {
  layout: LayoutColumn[]; // Debe tener 3 elementos
  isEditing: boolean;
  wideComponents: Set<string>;
  onToggleSize: (componentKey: string) => void;
  onRemove: (colIndex: number, itemIndex: number) => void;
  onAdd: (colIndex: number, componentKey: string) => void;
  onContextMenu: (e: React.MouseEvent, componentId: string) => void;
}

const LayoutColumns: React.FC<LayoutColumnsProps> = ({
  layout,
  isEditing,
  wideComponents,
  onToggleSize,
  onRemove,
  onAdd,
  onContextMenu,
}) => {
  // Aseguramos que el layout tenga 3 columnas
  if (layout.length !== 3) {
    console.warn("LayoutColumns expects exactly 3 columns.");
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
      {layout.map((column, colIndex) => (
        <Droppable key={column.id} droppableId={column.id}>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className=" flex flex-col gap-4 min-h-[300px]"
            >
              {column.items.map((componentKey, index) => (
                <ComponentRenderer
                  key={componentKey}
                  componentKey={componentKey}
                  colIndex={colIndex}
                  index={index}
                  isEditing={isEditing}
                  isWide={wideComponents.has(componentKey)}
                  onToggleSize={onToggleSize}
                  onRemove={onRemove}
                  onContextMenu={onContextMenu}
                />
              ))}
              {provided.placeholder}
              {isEditing && (
                <div className="pt-2">
                  <AddComponentButton
                    onClick={(componentKey) => onAdd(colIndex, componentKey)}
                    layout={layout}
                  />
                </div>
              )}
            </div>
          )}
        </Droppable>
      ))}
    </div>
  );
};

export default LayoutColumns;
