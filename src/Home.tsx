import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import type { DroppableProvided, DraggableProvided } from 'react-beautiful-dnd';
import { Trash2, Plus, Move, Maximize2, Minimize2, Settings, Save, Palette, ArrowsInSimple } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './hooks/useAuth';
import { ComponentRegistry } from './utils/componentRegistry';
import { LayoutManager } from './utils/layoutManager';
import StartSessionMenu from './components/StartSessionMenu';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './redux/store';
import { setLayout } from './redux/layoutSlice';
import { setTheme } from './redux/themeSlice';
import { setCalendarVisibility } from './redux/uiSlice';
import { Layout } from './types/layout';
import { Theme } from './types/theme';
import { ComponentKey } from './types/component';

interface LayoutColumn {
  id: string;
  items: string[];
}

interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  componentKey: string;
  colIndex: number;
  itemIndex: number;
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
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'default';
    }
    return 'default';
  });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; componentId: string } | null>(null);

  // Handle theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(
      'theme-dracula', 
      'theme-catppuccin', 
      'theme-monokai', 
      'theme-default',
      'theme-solarized',
      'theme-gruvbox'
    );
    root.classList.add(`theme-${currentTheme}`);
  }, [currentTheme]);

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);
  };

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

  const removeComponent = useCallback((componentId: string) => {
    // Find the column and index of the component
    const colIndex = layout.findIndex(col => col.items.includes(componentId));
    if (colIndex === -1) return;

    const itemIndex = layout[colIndex].items.indexOf(componentId);
    const newLayout = LayoutManager.removeComponent(layout, colIndex, itemIndex);
    setLayout(newLayout);

    // Remove from wide components if necessary
    setWideComponents(prev => {
      const updated = new Set(prev);
      updated.delete(componentId);
      return updated;
    });
  }, [layout]);

  const addComponent = useCallback((colIndex: number, componentKey: string) => {
    const newLayout = LayoutManager.addComponent(layout, colIndex, componentKey);
    setLayout(newLayout);
  }, [layout]);

  const handleContextMenu = (e: React.MouseEvent, componentId: string) => {
    e.preventDefault();
    if (!isEditing) return;
    setContextMenu({ x: e.clientX, y: e.clientY, componentId });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  // Add click outside listener for context menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu) {
        handleCloseContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);

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
                    onContextMenu={(e) => handleContextMenu(e, componentKey)}
                  >
                    <div className="rounded-lg shadow-lg">
                      {renderComponent(componentKey)}
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {isEditing && (
              <AddComponentButton
                onClick={(componentKey) => addComponent(colIndex, componentKey)}
                layout={layout}
              />
            )}
          </div>
        )}
      </Droppable>
    )),
    [layout, isEditing, wideComponents, toggleComponentSize, removeComponent, addComponent, handleContextMenu]
  );

  const renderComponent = (componentId: string) => {
    const config = ComponentRegistry[componentId];
    if (!config) return null;

    const Component = config.component;
    return (
      <div
        onContextMenu={(e) => handleContextMenu(e, componentId)}
        className="relative"
      >
        <Component isEditing={isEditing} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-text-primary p-4">
      <ToastContainer />
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="w-[95%] max-w-[1800px] mx-auto py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderLayoutColumns}
          </div>
        </div>
      </DragDropContext>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-neutral-900 p-2 rounded-lg shadow-lg z-50 border border-neutral-800"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <div className="space-y-1">
            <button
              onClick={() => {
                removeComponent(contextMenu.componentId);
                handleCloseContextMenu();
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-neutral-800 rounded-md flex items-center gap-2"
            >
              <Trash2 size={16} />
              Remove Component
            </button>
          </div>
        </div>
      )}

      <LayoutControls
        isEditing={isEditing}
        onToggleEditing={() => setIsEditing(!isEditing)}
        isLoggedIn={isLoggedIn}
        onLogin={loginWithGoogle}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />

      <StartSessionMenu 
        isOpen={false} 
        onClose={() => {
          setIsPlaying(false);
        }}
        setIsPlaying={setIsPlaying}
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

const AddComponentButton: React.FC<{ 
  onClick: (componentKey: string) => void;
  layout: LayoutColumn[];
}> = ({ onClick, layout }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get all currently used components
  const usedComponents = useMemo(() => {
    const used = new Set<string>();
    layout.forEach((column: LayoutColumn) => {
      column.items.forEach((item: string) => used.add(item));
    });
    return used;
  }, [layout]);

  // Get available components (not currently used)
  const availableComponents = useMemo(() => {
    return Object.entries(ComponentRegistry)
      .filter(([key]) => !usedComponents.has(key))
      .map(([key, value]) => ({ key, name: value.name }));
  }, [usedComponents]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-full p-4 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-600 transition-colors duration-200"
      >
        <Plus size={24} className="mx-auto" />
      </button>
      {showMenu && availableComponents.length > 0 && (
        <div className="absolute left-0 mt-2 w-48 bg-neutral-900 rounded-lg shadow-lg z-10 border border-neutral-800">
          <div className="py-1">
            {availableComponents.map(({ key, name }) => (
              <button
                key={key}
                onClick={() => {
                  onClick(key);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 transition-colors duration-200"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const LayoutControls: React.FC<{
  isEditing: boolean;
  onToggleEditing: () => void;
  isLoggedIn: boolean;
  onLogin: () => void;
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}> = ({ isEditing, onToggleEditing, isLoggedIn, onLogin, isPlaying, setIsPlaying, currentTheme, onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSessionMenu, setShowSessionMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Solo cerrar los menús si no estamos en modo de edición
        if (!isEditing) {
          setIsOpen(false);
          setShowThemeMenu(false);
        }
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowThemeMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
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
        <div className="flex flex-col gap-2 p-3 rounded-lg shadow-lg border" style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)'
        }}>
          <button
            onClick={() => {
              setShowSessionMenu(true);
              setIsOpen(false);
              setShowThemeMenu(false);
            }}
            className="px-4 py-2 rounded hover:opacity-100 transition-colors duration-200"
            style={{ 
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--text-primary)'
            }}
          >
            {isPlaying ? "Pause Sesh" : "Start Sesh"}
          </button>
          <button
            onClick={handleToggleEditing}
            className="px-4 py-2 rounded hover:opacity-80 transition-colors duration-200"
            style={{ 
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--text-primary)'
            }}
          >
            {isEditing ? "Save Layout" : "Edit Layout"}
          </button>
          <button
            onClick={() => {
              setShowThemeMenu(!showThemeMenu);
              setIsOpen(false);
            }}
            className="px-4 py-2 rounded hover:opacity-80 transition-colors duration-200"
            style={{ 
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--text-primary)'
            }}
          >
            Themes
          </button>
          <LoginButton isLoggedIn={isLoggedIn} onClick={onLogin} />
        </div>
      )}

      {showThemeMenu && (
        <div className="flex flex-col gap-2 p-3 rounded-lg shadow-lg border" style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)'
        }}>
          <button
            onClick={() => {
              onThemeChange('default');
              setShowThemeMenu(false);
            }}
            className={`px-4 py-2 rounded hover:opacity-80 transition-colors duration-200`}
            style={{ 
              backgroundColor: currentTheme === 'default' ? 'var(--accent-primary)' : 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          >
            Default
          </button>
          <button
            onClick={() => {
              onThemeChange('dracula');
              setShowThemeMenu(false);
            }}
            className={`px-4 py-2 rounded hover:opacity-80 transition-colors duration-200`}
            style={{ 
              backgroundColor: currentTheme === 'dracula' ? 'var(--accent-primary)' : 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          >
            Dracula
          </button>
          <button
            onClick={() => {
              onThemeChange('catppuccin');
              setShowThemeMenu(false);
            }}
            className={`px-4 py-2 rounded hover:opacity-80 transition-colors duration-200`}
            style={{ 
              backgroundColor: currentTheme === 'catppuccin' ? 'var(--accent-primary)' : 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          >
            Catppuccin
          </button>
          <button
            onClick={() => {
              onThemeChange('monokai');
              setShowThemeMenu(false);
            }}
            className={`px-4 py-2 rounded hover:opacity-80 transition-colors duration-200`}
            style={{ 
              backgroundColor: currentTheme === 'monokai' ? 'var(--accent-primary)' : 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          >
            Monokai
          </button>
          <button
            onClick={() => {
              onThemeChange('solarized');
              setShowThemeMenu(false);
            }}
            className={`px-4 py-2 rounded hover:opacity-80 transition-colors duration-200`}
            style={{ 
              backgroundColor: currentTheme === 'solarized' ? 'var(--accent-primary)' : 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          >
            Solarized
          </button>
          <button
            onClick={() => {
              onThemeChange('gruvbox');
              setShowThemeMenu(false);
            }}
            className={`px-4 py-2 rounded hover:opacity-80 transition-colors duration-200`}
            style={{ 
              backgroundColor: currentTheme === 'gruvbox' ? 'var(--accent-primary)' : 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          >
            Gruvbox
          </button>
        </div>
      )}

      <StartSessionMenu 
        isOpen={showSessionMenu} 
        onClose={() => {
          setShowSessionMenu(false);
          setIsPlaying(false);
        }}
        setIsPlaying={setIsPlaying}
      />
    </div>
  );
};

const LoginButton: React.FC<{ isLoggedIn: boolean; onClick: () => void }> = ({ isLoggedIn, onClick }) => {
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