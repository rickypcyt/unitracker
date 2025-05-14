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
  onToggleSize: (componentKey: string) => void;
  onRemove: (colIndex: number, itemIndex: number) => void;
  onAdd: (colIndex: number, componentKey: string) => void;
  onContextMenu: (e: React.MouseEvent, componentId: string) => void;
}

const LayoutColumns: React.FC<LayoutColumnsProps> = ({
  layout,
  isEditing,
  onToggleSize,
  onRemove,
  onAdd,
  onContextMenu,
}) => {
  React.useEffect(() => {
    console.log("Cantidad de columnas:", layout.length);
  }, [layout]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
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
