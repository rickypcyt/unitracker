import { Task } from './taskStorage';

export interface DropResult {
  taskId: string;
  newAssignment: string;
}

export interface DraggedTask {
  task: Task;
  type: string;
}

export interface ColumnMenuState {
  x: number;
  y: number;
  assignmentId: string;
}

export interface AssignmentSortConfig {
  [key: string]: {
    type: 'deadline' | 'title' | 'difficulty' | 'created';
    direction: 'asc' | 'desc';
  };
}

export interface CollapsedColumns {
  [key: string]: boolean;
}

export interface KanbanBoardProps {
  // Add any props if needed
}

export interface AssignmentDropZoneProps {
  assignment: string;
  onDrop: (taskId: string, newAssignment: string) => void;
  children: React.ReactNode;
}
