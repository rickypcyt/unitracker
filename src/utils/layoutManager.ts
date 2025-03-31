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
    getInitialLayout: (): Layout[] => {
      const savedLayout = localStorage.getItem('appLayout');
      if (savedLayout) {
        return JSON.parse(savedLayout);
      }
      return [
        { id: 'col-1', items: ['Pomodoro', 'StudyTimer', 'NoiseGenerator' ] },
        { id: 'col-2', items: ['TaskForm', 'ProgressTracker', 'Statistics'] },
        { id: 'col-3', items: ['TaskList', 'Calendar'] }
      ];
    },
  
    updateLayoutAfterDrag: (layout: Layout[], result: DragResult): Layout[] => {
      const newLayout = JSON.parse(JSON.stringify(layout));
      const { source, destination } = result;
  
      const sourceCol = newLayout.find((col: LayoutColumn) => col.id === source.droppableId);
      const destCol = newLayout.find((col: LayoutColumn) => col.id === destination.droppableId);
  
      if (!sourceCol || !destCol) return layout;
  
      const [removed] = sourceCol.items.splice(source.index, 1);
      destCol.items.splice(destination.index, 0, removed);
  
      // Save the new layout to localStorage
      localStorage.setItem('appLayout', JSON.stringify(newLayout));
      return newLayout;
    },
  
    removeComponent: (layout: Layout[], colIndex: number, itemIndex: number): Layout[] => {
      const newLayout = [...layout];
      newLayout[colIndex].items.splice(itemIndex, 1);
      // Save the new layout to localStorage
      localStorage.setItem('appLayout', JSON.stringify(newLayout));
      return newLayout;
    },
  
    addComponent: (layout: Layout[], colIndex: number): Layout[] => {
      const usedComponents = layout.flatMap((col: LayoutColumn) => col.items);
      const availableComponents = Object.keys(ComponentRegistry)
        .filter(comp => !usedComponents.includes(comp));
  
      if (availableComponents.length === 0) return layout;
  
      const newLayout = [...layout];
      newLayout[colIndex].items.push(availableComponents[0]);
      // Save the new layout to localStorage
      localStorage.setItem('appLayout', JSON.stringify(newLayout));
      return newLayout;
    }
  };