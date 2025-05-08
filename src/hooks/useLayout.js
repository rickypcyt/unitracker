import { useState, useCallback } from "react";
import { LayoutManager } from "../utils/layoutManager";
import type { LayoutColumn, DragResult, ContextMenuState } from "../types";

const useLayout = () => {
  const [layout, setLayout] = useState(LayoutManager.getInitialLayout());
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleDragEnd = useCallback((result: DragResult) => {
    if (!result.destination) return;
    setLayout(LayoutManager.updateLayoutAfterDrag(layout, result));
  }, [layout]);

  const removeComponent = useCallback((componentId: string) => {
    const colIndex = layout.findIndex(col => col.items.includes(componentId));
    if (colIndex === -1) return;

    const itemIndex = layout[colIndex].items.indexOf(componentId);
    setLayout(LayoutManager.removeComponent(layout, colIndex, itemIndex));
  }, [layout]);

  const addComponent = useCallback((colIndex: number, componentKey: string) => {
    setLayout(LayoutManager.addComponent(layout, colIndex, componentKey));
  }, [layout]);

  const handleCloseContextMenu = () => setContextMenu(null);

  return {
    layout,
    handleDragEnd,
    removeComponent,
    addComponent,
    contextMenu,
    setContextMenu,
    handleCloseContextMenu
  };
};

export default useLayout;