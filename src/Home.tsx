import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import type { DroppableProvided, DraggableProvided } from 'react-beautiful-dnd';
import { Trash2, Plus, Move, Maximize2, Minimize2, Settings, Save } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './hooks/useAuth';
import { ComponentRegistry } from './utils/componentRegistry';
import { GoogleLoginButton } from './components/GoogleLoginButton';
import { LayoutManager } from './utils/layoutManager';
import StartSessionMenu from './components/StartSessionMenu';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutColumn {
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

type ComponentKey = keyof typeof ComponentRegistry;

const Home: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [layout, setLayout] = useState<LayoutColumn[]>(LayoutManager.getInitialLayout());
  const [wideComponents, setWideComponents] = useState<Set<string>>(new Set());
  const { isLoggedIn, loginWithGoogle } = useAuth();
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);

  const handleDragEnd = useCallback((result: DragResult) => {
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
              <Draggable
                key={componentKey}
                draggableId={componentKey}
                index={index}
                isDragDisabled={!isEditing}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`${wideComponents.has(componentKey) ? 'md:col-span-2 lg:col-span-2' : ''}`}
                  >
                    <div className="rounded-lg shadow-lg">
                      {React.createElement(ComponentRegistry[componentKey as ComponentKey].component)}
                    </div>
                  </div>
                )}
              </Draggable>
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
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <ToastContainer />
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="w-[95%] max-w-[1800px] mx-auto py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {layout.map((column, colIndex) => (
              <Droppable key={column.id} droppableId={column.id}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {column.items.map((componentKey, index) => (
                      <Draggable
                        key={componentKey}
                        draggableId={componentKey}
                        index={index}
                        isDragDisabled={!isEditing}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`${wideComponents.has(componentKey) ? 'md:col-span-2 lg:col-span-2' : ''}`}
                          >
                            <div className="rounded-lg shadow-lg">
                              {React.createElement(ComponentRegistry[componentKey as ComponentKey].component)}
                            </div>
                          </div>
                        )}
                      </Draggable>
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
            ))}
          </div>
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

      <StartSessionMenu 
        isOpen={false} 
        onClose={() => {
          setIsPlaying(false);
        }}
      />
    </div>
  );
};

// Componentes extraídos para mejor modularidad
const ComponentRenderer: React.FC<{
  componentKey: ComponentKey;
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
        {(provided: DraggableProvided) => (
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
  <div className="absolute top-2 right-2 flex gap-2 z-10">
    <button
      {...dragHandleProps}
      className="p-1 bg-gray-800 text-white rounded hover:bg-gray-700"
    >
      <Move size={16} />
    </button>
    <button
      onClick={onToggleSize}
      className="p-1 bg-gray-800 text-white rounded hover:bg-gray-700"
    >
      {isWide ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
    </button>
    <button
      onClick={onRemove}
      className="p-1 bg-gray-800 text-white rounded hover:bg-gray-700"
    >
      <Trash2 size={16} />
    </button>
  </div>
);

const AddComponentButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="w-full p-4 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-600 transition-colors duration-200"
  >
    <Plus size={24} className="mx-auto" />
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
  const [showSessionMenu, setShowSessionMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Solo cerrar el menú si no estamos en modo de edición
        if (!isEditing) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing]);

  const handleToggleEditing = () => {
    onToggleEditing();
    // Limpiar todos los toasts existentes
    toast.dismiss();
    
    if (!isEditing) {
      toast.info("Edit mode activated", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
      });
    } else {
      toast.success("Layout saved", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 flex flex-col items-end gap-2" ref={menuRef}>
      {!isOpen && !isEditing && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700"
        >
          <Settings size={24} />
        </button>
      )}
      {(isOpen || isEditing) && (
        <div className="flex flex-col gap-2 bg-black p-3 rounded-lg shadow-lg border border-gray-700">
          <button
            onClick={() => {
              setShowSessionMenu(true);
              setIsOpen(false);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {isPlaying ? "Pause Sesh" : "Start Sesh"}
          </button>
          <button
            onClick={handleToggleEditing}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {isEditing ? "Save Layout" : "Edit Layout"}
          </button>
          <GoogleLoginButton isLoggedIn={isLoggedIn} onClick={onLogin} />
        </div>
      )}

      <StartSessionMenu 
        isOpen={showSessionMenu} 
        onClose={() => {
          setShowSessionMenu(false);
          setIsPlaying(false);
        }}
      />
    </div>
  );
};

const GoogleLoginButton: React.FC<{ isLoggedIn: boolean; onClick: () => void }> = ({ isLoggedIn, onClick }) => {
  const handleLogin = () => {
    onClick();
    // Limpiar toasts después de 2 segundos
    setTimeout(() => {
      toast.dismiss();
    }, 2000);
  };

  return (
    <button
      onClick={handleLogin}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      {isLoggedIn ? "Logout" : "Login with Google"}
    </button>
  );
};

export default Home;