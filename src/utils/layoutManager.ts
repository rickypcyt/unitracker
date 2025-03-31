// utils/layoutManager.ts
import { ComponentRegistry } from './componentRegistry';

interface LayoutColumn {
  id: string;
  items: string[];
}

interface Layout {
  id: string;
  items: string[];
}

interface DragResult {
  source: {
    droppableId: string;
    index: number;
  };
  destination: {
    droppableId: string;
    index: number;
  };
}

export const LayoutManager = {
    getInitialLayout: (): LayoutColumn[] => {
      const savedLayout = localStorage.getItem('layout');
      if (savedLayout) {
        return JSON.parse(savedLayout);
      }
      return [
        { id: 'column-1', items: ['TaskForm', 'TaskList'] },
        { id: 'column-2', items: ['Calendar', 'StudyTimer'] },
        { id: 'column-3', items: ['Pomodoro', 'NoiseGenerator'] }
      ];
    },
  
    saveLayout: (layout: LayoutColumn[]) => {
      localStorage.setItem('layout', JSON.stringify(layout));
    },
  
    updateLayoutAfterDrag: (layout: LayoutColumn[], result: any): LayoutColumn[] => {
      const { source, destination } = result;
      if (!destination) return layout;
  
      const newLayout = [...layout];
      const sourceColumn = newLayout.find(col => col.id === source.droppableId);
      const destColumn = newLayout.find(col => col.id === destination.droppableId);
      const [movedItem] = sourceColumn.items.splice(source.index, 1);
      destColumn.items.splice(destination.index, 0, movedItem);
  
      LayoutManager.saveLayout(newLayout);
      return newLayout;
    },
  
    removeComponent: (layout: LayoutColumn[], colIndex: number, itemIndex: number): LayoutColumn[] => {
      const newLayout = [...layout];
      newLayout[colIndex].items.splice(itemIndex, 1);
      LayoutManager.saveLayout(newLayout);
      return newLayout;
    },
  
    addComponent: (layout: LayoutColumn[], colIndex: number, componentKey: string): LayoutColumn[] => {
      const newLayout = [...layout];
      newLayout[colIndex].items.push(componentKey);
      LayoutManager.saveLayout(newLayout);
      return newLayout;
    }
  };