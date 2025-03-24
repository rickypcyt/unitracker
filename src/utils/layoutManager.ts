// utils/layoutManager.ts
export const LayoutManager = {
    getInitialLayout: () => [
      { id: 'col-1', items: ['TaskForm', 'TaskList'] },
      { id: 'col-2', items: ['StudyTimer', 'NoiseGenerator', 'Pomodoro'] },
      { id: 'col-3', items: ['Statistics', 'ProgressTracker'] }
    ],
  
    updateLayoutAfterDrag: (layout: any, result: { source: any; destination: any; }) => {
      const newLayout = JSON.parse(JSON.stringify(layout));
      const { source, destination } = result;
  
      const sourceCol = newLayout.find((col: { id: any; }) => col.id === source.droppableId);
      const destCol = newLayout.find((col: { id: any; }) => col.id === destination.droppableId);
  
      const [removed] = sourceCol.items.splice(source.index, 1);
      destCol.items.splice(destination.index, 0, removed);
  
      return newLayout;
    },
  
    removeComponent: (layout: any, colIndex: string | number, itemIndex: any) => {
      const newLayout = [...layout];
      newLayout[colIndex].items.splice(itemIndex, 1);
      return newLayout;
    },
  
    addComponent: (layout: any[], colIndex: string | number) => {
      const usedComponents = layout.flatMap((col: { items: any; }) => col.items);
      const availableComponents = Object.keys(ComponentRegistry)
        .filter(comp => !usedComponents.includes(comp));
  
      if (availableComponents.length === 0) return layout;
  
      const newLayout = [...layout];
      newLayout[colIndex].items.push(availableComponents[0]);
      return newLayout;
    }
  };