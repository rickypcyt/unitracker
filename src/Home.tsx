import React, { useState, useEffect, useCallback, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useAuth } from "./hooks/useAuth";
import ContextMenu from "./components/modals/ContextMenu";
import WelcomeModal from "./components/modals/WelcomeModal";
import Settings from "./components/modals/Settings";
import StartSessionMenu from "./components/modals/StartSessionMenu";
import ComponentRenderer from "./components/home/ComponentRenderer";
import { LayoutManager } from "./utils/layoutManager";
import AddComponentButton from "./components/home/AddComponentButton";

const Home: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const [layout, setLayout] = useState(LayoutManager.getInitialLayout());
  const { isLoggedIn, loginWithGoogle } = useAuth();
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "default";
    }
    return "default";
  });
  const [contextMenu, setContextMenu] = useState(null);
  const [accentPalette, setAccentPalette] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accentPalette") || "blue";
    }
    return "blue";
  });

  const handleDragEnd = useCallback(
    (result) => {
      if (!result.destination) return;
      setLayout(LayoutManager.updateLayoutAfterDrag(layout, result));
    },
    [layout],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showWelcomeModal) {
          setShowWelcomeModal(false);
        } else if (isEditing) {
          setIsEditing(false);
        } else {
          setShowSettings((prev) => !prev);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showWelcomeModal, isEditing]);

  const addComponent = useCallback(
    (colIndex: number, componentKey: string) => {
      // Agregar el componente usando LayoutManager
      const newLayout = LayoutManager.addComponent(layout, colIndex, componentKey);
  
      // Actualizar el estado
      setLayout(newLayout);
    },
    [layout]
  );
  
  const removeComponent = useCallback(
    (colIndex: number, itemIndex: number) => {
      // Buscar en qué columna está el componente
      const foundColIndex = layout.findIndex(col => col.items.includes(layout[colIndex].items[itemIndex]));
      if (foundColIndex === -1) return; // No existe, no hacer nada
  
      // Removerlo usando LayoutManager
      const newLayout = LayoutManager.removeComponent(layout, foundColIndex, itemIndex);
  
      // Actualizar el estado
      setLayout(newLayout);
    },
    [layout]
  );
  

  const handleContextMenu = useCallback(
    (e, componentId) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, componentId });
    },
    [],
  );
  

  const handleCloseContextMenu = () => setContextMenu(null);

  return (
    <div className="">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="w-full min-h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
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
            key={`${componentKey}-${colIndex}-${index}`}
            draggableId={`${componentKey}-${colIndex}-${index}`}
            index={index}
            isDragDisabled={!isEditing}
          >
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                onContextMenu={(e) => handleContextMenu(e, componentKey)}
              >
                <ComponentRenderer
                  componentKey={componentKey}
                  colIndex={colIndex}
                  index={index}
                  isEditing={isEditing}
                  onRemove={removeComponent}
                  onContextMenu={handleContextMenu}
                />
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
))}

          </div>
        </div>
      </DragDropContext>

      {contextMenu && (
        <ContextMenu
  x={contextMenu.x}
  y={contextMenu.y}
  componentId={contextMenu.componentId}
  isEditing={isEditing}
  onClose={handleCloseContextMenu}
  onRemove={removeComponent}
  onToggleEdit={() => setIsEditing((prev) => !prev)}
/>

      )}

      {showWelcomeModal && (
        <WelcomeModal
          onClose={() => {
            setShowWelcomeModal(false);
            localStorage.setItem("hasSeenWelcomeModal", "true");
          }}
        />
      )}

      <Settings
        isEditing={isEditing}
        onToggleEditing={setIsEditing}
        isLoggedIn={isLoggedIn}
        onLogin={loginWithGoogle}
        currentTheme={currentTheme}
        onThemeChange={(theme) => {
          setCurrentTheme(theme);
          localStorage.setItem("theme", theme);
        }}
        accentPalette={accentPalette}
        setAccentPalette={setAccentPalette}
        isPlaying={false}
        setIsPlaying={() => {}}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        loginWithGoogle={loginWithGoogle}
      />

      <StartSessionMenu
        isOpen={false}
        onClose={() => {}}
        setIsPlaying={() => {}}
      />

    </div>
  );
};

export default Home;
