import React, { useState, useEffect, useCallback, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useAuth } from "./hooks/useAuth";
import LayoutColumns from "./components/home/LayoutColumns";
import ContextMenu from "./components/home/ContextMenu";
import WelcomeModal from "./components/home/WelcomeModal";
import LayoutControls from "./components/home/LayoutControls";
import StartSessionMenu from "./components/StartSessionMenu";
import ComponentRenderer from "./components/home/ComponentRenderer";
import { LayoutManager } from "./utils/layoutManager";
import AddComponentButton from "./components/home/AddComponentButton";

const Home: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState(LayoutManager.getInitialLayout());
  const [wideComponents, setWideComponents] = useState<Set<string>>(new Set());
  const { isLoggedIn, loginWithGoogle } = useAuth();
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "default";
    }
    return "default";
  });
  const [contextMenu, setContextMenu] = useState(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("hasSeenWelcomeModal");
    }
    return true;
  });
  const [accentPalette, setAccentPalette] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accentPalette") || "blue";
    }
    return "blue";
  });

  // Aquí van los useEffect para tema, scroll modal, etc.

  const handleDragEnd = useCallback(
    (result) => {
      if (!result.destination) return;
      setLayout(LayoutManager.updateLayoutAfterDrag(layout, result));
    },
    [layout],
  );

  const toggleComponentSize = useCallback((componentKey: string) => {
    setWideComponents((prev) => {
      const updated = new Set(prev);
      updated.has(componentKey)
        ? updated.delete(componentKey)
        : updated.add(componentKey);
      return updated;
    });
  }, []);

  const removeComponent = useCallback(
    (componentId: string) => {
      // lógica para eliminar componente del layout
    },
    [layout],
  );

  const addComponent = useCallback(
    (colIndex: number, componentKey: string) => {
      // lógica para agregar componente al layout
    },
    [layout],
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
                  isWide={wideComponents.has(componentKey)}
                  onToggleSize={toggleComponentSize}
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
          onToggleEdit={() => setIsEditing(!isEditing)}
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

      <LayoutControls
        isEditing={isEditing}
        onToggleEditing={() => setIsEditing(!isEditing)}
        isLoggedIn={isLoggedIn}
        onLogin={loginWithGoogle}
        currentTheme={currentTheme}
        onThemeChange={(theme) => {
          setCurrentTheme(theme);
          localStorage.setItem("theme", theme);
        }}
        accentPalette={accentPalette}
        setAccentPalette={setAccentPalette}
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
