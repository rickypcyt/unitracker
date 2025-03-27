import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Trash2, Plus, Move, Maximize2, Minimize2, Settings } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './hooks/useAuth';
import { ComponentRegistry } from './utils/componentRegistry';
import { GoogleLoginButton } from './components/GoogleLoginButton';
import { LayoutManager } from './utils/layoutManager';

const Home: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [layout, setLayout] = useState(LayoutManager.getInitialLayout());
  const [wideComponents, setWideComponents] = useState<Set<string>>(new Set());
  const { isLoggedIn, loginWithGoogle } = useAuth();

  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;
    setLayout(LayoutManager.updateLayoutAfterDrag(layout, result));
  }, [layout]);

  const toggleComponentSize = useCallback((componentKey: string) => {
    setWideComponents(prev => {
      const updated = new Set(prev);
      updated.has(componentKey)
        ? updated.delete(componentKey)
        : updated.add(componentKey);
      return updated;
    });
  }, []);

  const removeComponent = useCallback((colIndex: number, itemIndex: number) => {
    const newLayout = LayoutManager.removeComponent(layout, colIndex, itemIndex);
    setLayout(newLayout);

    // Remove from wide components if necessary
    const componentKey = newLayout[colIndex].items[itemIndex];
    setWideComponents(prev => {
      const updated = new Set(prev);
      updated.delete(componentKey);
      return updated;
    });
  }, [layout]);

  const addComponent = useCallback((colIndex: number) => {
    const newLayout = LayoutManager.addComponent(layout, colIndex);
    setLayout(newLayout);
  }, [layout]);

  const renderLayoutColumns = useMemo(() =>
    layout.map((column, colIndex) => (
      <Droppable key={column.id} droppableId={column.id}>
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-4"
          >
            {column.items.map((componentKey, index) => (
              <ComponentRenderer
                key={componentKey}
                componentKey={componentKey}
                colIndex={colIndex}
                index={index}
                isEditing={isEditing}
                isWide={wideComponents.has(componentKey)}
                onToggleSize={toggleComponentSize}
                onRemove={removeComponent}
              />
            ))}
            {provided.placeholder}
            {isEditing && (
              <AddComponentButton
                onClick={() => addComponent(colIndex)}
              />
            )}
          </div>
        )}
      </Droppable>
    )),
    [layout, isEditing, wideComponents, toggleComponentSize, removeComponent, addComponent]
  );

  return (
    <div className="mr-4 ml-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {renderLayoutColumns}
        </div>
      </DragDropContext>

      <LayoutControls
        isEditing={isEditing}
        onToggleEditing={() => setIsEditing(!isEditing)}
        isLoggedIn={isLoggedIn}
        onLogin={loginWithGoogle}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />

      <ToastContainer />
    </div>
  );
};

// Componentes extraídos para mejor modularidad
const ComponentRenderer: React.FC<{
  componentKey: string;
  colIndex: number;
  index: number;
  isEditing: boolean;
  isWide: boolean;
  onToggleSize: (key: string) => void;
  onRemove: (colIndex: number, itemIndex: number) => void;
}> = ({
  componentKey,
  colIndex,
  index,
  isEditing,
  isWide,
  onToggleSize,
  onRemove
}) => {
    const Component = ComponentRegistry[componentKey].component;

    return (
      <Draggable
        draggableId={`${componentKey}-${colIndex}`}
        index={index}
        isDragDisabled={!isEditing}
      >
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`relative ${isWide ? 'lg:col-span-2' : ''}`}
          >
            {isEditing && (
              <ComponentEditControls
                onToggleSize={() => onToggleSize(componentKey)}
                onRemove={() => onRemove(colIndex, index)}
                dragHandleProps={provided.dragHandleProps}
                isWide={isWide}
              />
            )}
            <div className={`rounded-lg shadow-lg ${isEditing ? 'border-2 border-dashed border-gray-700' : ''}`}>
              <Component />
            </div>
          </div>
        )}
      </Draggable>
    );
  };

const ComponentEditControls: React.FC<{
  onToggleSize: () => void;
  onRemove: () => void;
  dragHandleProps: any;
  isWide: boolean;
}> = ({ onToggleSize, onRemove, dragHandleProps, isWide }) => (
  <div className="absolute top-2 right-2 z-10 flex gap-2">
    <button onClick={onToggleSize} className="p-1 bg-gray-800 rounded hover:bg-gray-700 text-white">
      {isWide ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
    </button>
    <button {...dragHandleProps} className="p-1 bg-gray-800 rounded hover:bg-gray-700 text-white">
      <Move size={16} />
    </button>
    <button onClick={onRemove} className="p-1 bg-red-900 rounded hover:bg-red-800 text-white">
      <Trash2 size={16} />
    </button>
  </div>
);

const AddComponentButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="w-full border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-gray-600 hover:text-gray-300 flex items-center justify-center gap-2 bg-gray-900 p-2"
  >
    <Plus size={20} />
    Add Component
  </button>
);

const LayoutControls: React.FC<{
  isEditing: boolean;
  onToggleEditing: () => void;
  isLoggedIn: boolean;
  onLogin: () => void;
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
}> = ({ isEditing, onToggleEditing, isLoggedIn, onLogin, isPlaying, setIsPlaying }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null); 

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };

  }, []);

  return (
    <div className="fixed bottom-4 right-4 flex flex-col items-end gap-2" ref={menuRef}>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700"
        >
          <Settings size={24} />
        </button>
      )}
      {isOpen && (
        <div className="flex flex-col gap-2 bg-black p-3 rounded-lg shadow-lg border border-gray-700">
          {!isOpen && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700"
            >
              <Settings size={24} />
            </button>
          )}
          
          <button
            //onClick={timerControls.start}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {isPlaying ? "Pause Sesh" : "Start Sesh"}
          </button>         
          <button
            onClick={onToggleEditing}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {isEditing ? "Save Layout" : "Edit Layout"}
          </button>

          <GoogleLoginButton isLoggedIn={isLoggedIn} onClick={onLogin} />
        </div>
      )}
    </div>
  );
};

export default Home;