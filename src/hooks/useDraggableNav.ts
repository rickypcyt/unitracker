import { useState, useEffect, useCallback } from 'react';

type Page = 'tasks' | 'calendar' | 'session' | 'notes' | 'stats' | 'habits' | 'focusWidget';

interface NavItem {
  page: Page;
  icon: any;
  label: string;
}

const DEFAULT_NAV_ORDER: NavItem[] = [
  { page: 'calendar', icon: null, label: 'Calendar' },
  { page: 'tasks', icon: null, label: 'Tasks' },
  { page: 'session', icon: null, label: 'Session' },
  { page: 'habits', icon: null, label: 'Habits' },
  { page: 'notes', icon: null, label: 'Notes' },
  { page: 'stats', icon: null, label: 'Stats' },
];

export const useDraggableNav = () => {
  const [navOrder, setNavOrder] = useState<NavItem[]>(DEFAULT_NAV_ORDER);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<NavItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Load nav order from localStorage on mount
  useEffect(() => {
    const savedOrder = localStorage.getItem('navbarOrder');
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        // Validate that the saved order has the correct structure
        if (Array.isArray(parsedOrder) && parsedOrder.every(item => 
          item.page && item.label && DEFAULT_NAV_ORDER.some(defaultItem => defaultItem.page === item.page)
        )) {
          setNavOrder(parsedOrder);
        }
      } catch (error) {
        console.error('Error parsing navbar order from localStorage:', error);
      }
    }
  }, []);

  // Save nav order to localStorage whenever it changes
  const saveNavOrder = useCallback((newOrder: NavItem[]) => {
    setNavOrder(newOrder);
    localStorage.setItem('navbarOrder', JSON.stringify(newOrder));
  }, []);

  const handleDragStart = useCallback((item: NavItem) => {
    setIsDragging(true);
    setDraggedItem(item);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!isDragging || !draggedItem) return;
    
    setDragOverIndex(index);
  }, [isDragging, draggedItem]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const draggedIndex = navOrder.findIndex(item => item.page === draggedItem.page);
    if (draggedIndex === dropIndex) {
      setIsDragging(false);
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...navOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    
    saveNavOrder(newOrder);
    setIsDragging(false);
    setDraggedItem(null);
    setDragOverIndex(null);
  }, [draggedItem, navOrder, saveNavOrder]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedItem(null);
    setDragOverIndex(null);
  }, []);

  const resetToDefault = useCallback(() => {
    saveNavOrder(DEFAULT_NAV_ORDER);
  }, [saveNavOrder]);

  return {
    navOrder,
    isDragging,
    draggedItem,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    resetToDefault,
  };
};
