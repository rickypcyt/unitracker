declare module 'react-beautiful-dnd' {
  import * as React from 'react';

  export interface DraggableProvided {
    draggableProps: any;
    innerRef: (element: HTMLElement | null) => void;
    dragHandleProps?: any;
  }

  export interface DroppableProvided {
    droppableProps: any;
    innerRef: (element: HTMLElement | null) => void;
    placeholder?: React.ReactNode;
  }

  export interface DraggableProps {
    draggableId: string;
    index: number;
    isDragDisabled?: boolean;
    children: (provided: DraggableProvided) => React.ReactNode;
  }

  export interface DroppableProps {
    droppableId: string;
    children: (provided: DroppableProvided) => React.ReactNode;
  }

  export interface DragDropContextProps {
    onDragEnd: (result: any) => void;
    children: React.ReactNode;
  }

  export const DragDropContext: React.FC<DragDropContextProps>;
  export const Droppable: React.FC<DroppableProps>;
  export const Draggable: React.FC<DraggableProps>;
} 