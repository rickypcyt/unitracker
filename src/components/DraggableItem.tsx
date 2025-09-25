import { useDrag, useDrop, DragSourceMonitor, DropTargetMonitor } from 'react-dnd';
import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical } from 'lucide-react';

interface DragItem {
  id: string;
  index: number;
  type: string;
}

interface DraggableItemProps {
  id: string;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  isFullWidth?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const DraggableItem: React.FC<DraggableItemProps> = ({
  id,
  index,
  moveItem,
  isFullWidth = false,
  children,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dragDirection, setDragDirection] = useState<'up' | 'down' | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Using _ prefix to indicate this variable is intentionally unused
  const [{ isDragging: _isDraggingDnd }, drag] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: 'ITEM',
    item: () => {
      setIsDragging(true);
      return { id, index, type: 'ITEM' };
    },
    end: () => {
      setIsDragging(false);
    },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: 'ITEM',
    hover: (item: DragItem, monitor: DropTargetMonitor) => {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const mousePosition = monitor.getClientOffset();
      if (!mousePosition) return;
      
      const hoverClientY = mousePosition.y - hoverBoundingRect.top;
      
      // More responsive movement with smaller threshold
      const movementThreshold = hoverMiddleY * 0.6; // Increased sensitivity
      
      // Determine direction for visual feedback
      const direction = dragIndex < hoverIndex ? 'down' : 'up';
      if (dragDirection !== direction) {
        setDragDirection(direction);
      }
      
      // Check if we should swap positions
      const shouldMove = direction === 'down' 
        ? hoverClientY < movementThreshold 
        : hoverClientY > (hoverBoundingRect.height - movementThreshold);
      
      if (!shouldMove) return;

      // Use requestAnimationFrame for smoother animation
      requestAnimationFrame(() => {
        moveItem(dragIndex, hoverIndex);
        item.index = hoverIndex;
      });
    },
    // Remove the return value to match the expected type
    drop: () => {
      setIsDraggingOver(false);
      setDragDirection(null);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  });

  useEffect(() => {
    if (isOver) {
      setIsDraggingOver(true);
      return undefined; // Explicit return for the true case
    } else {
      const timer = setTimeout(() => {
        setIsDraggingOver(false);
        setDragDirection(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOver]);

  // Combine refs for drag and drop
  drag(drop(ref));

  return (
    <motion.div
      ref={ref}
      className={`relative group ${isFullWidth ? 'md:col-span-2' : ''} ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: isDragging ? 0.8 : 1,
        scale: isDragging ? 1.01 : 1,
        y: 0,
        transition: { 
          duration: 0.15,
          scale: { duration: 0.1 },
          opacity: { duration: 0.1 }
        }
      }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={!isDragging ? { 
        scale: 1.01,
        transition: { duration: 0.1 }
      } : {}}
      onHoverStart={() => !isDragging && setIsHovered(true)}
      onHoverEnd={() => !isDragging && setIsHovered(false)}
      style={{
        zIndex: isDragging ? 1000 : 'auto',
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <AnimatePresence>
        {(isHovered || isDragging) && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute -left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/10 backdrop-blur-sm shadow-sm cursor-move hover:bg-white/20 transition-colors"
          >
            <GripVertical className="text-gray-400" size={16} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Visual feedback for drag direction */}
      <AnimatePresence>
        {isDraggingOver && dragDirection && (
          <motion.div 
            className={`absolute left-0 right-0 h-0.5 bg-blue-400 z-10 ${
              dragDirection === 'up' ? 'top-0' : 'bottom-0'
            }`}
            initial={{ opacity: 0, scaleX: 0.8 }}
            animate={{ 
              opacity: 1, 
              scaleX: 1,
              backgroundColor: ['#60a5fa', '#3b82f6', '#60a5fa']
            }}
            exit={{ opacity: 0, scaleX: 0.8 }}
            transition={{ 
              duration: 0.2,
              backgroundColor: {
                duration: 1.5,
                repeat: Infinity,
                repeatType: 'reverse'
              }
            }}
          />
        )}
      </AnimatePresence>
      
      <motion.div 
        className={`${isDragging ? 'opacity-80' : 'opacity-100'} transition-opacity duration-150`}
        animate={{
          scale: isDraggingOver ? 1.01 : 1,
          transition: { duration: 0.1 }
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
