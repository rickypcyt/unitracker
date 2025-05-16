import React, { useState, useEffect, useCallback, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useAuth } from "./hooks/useAuth";
import ContextMenu from "./components/modals/ContextMenu";
import WelcomeModal from "./components/modals/WelcomeModal";
import Settings from "./components/modals/Settings";
import StartSessionMenu from "./components/modals/StartSessionMenu";
import ComponentRenderer from "./components/home/ComponentRenderer";
import { LayoutManager } from "./utils/layoutManager";
import AddComponentButton from "./components/home/AddComponentButton";
import { Settings as SettingsIcon } from "lucide-react";
import { useResponsiveColumns } from "./hooks/useResponsiveColumns";
import { distributeItems } from "./utils/distributeItems";

const Home = () => {
  // --- Cambios aquí ---
  const columns = useResponsiveColumns(); // 1 a 4 según el ancho

  const [layout, setLayout] = useState(() => LayoutManager.getInitialLayout(columns));
  const responsiveLayout = useMemo(
    () => distributeItems(layout, columns),
    [layout, columns]
  );
  // --- Fin cambios aquí ---

  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showStartSession, setShowStartSession] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const { isLoggedIn, loginWithGoogle } = useAuth();
  const [currentTheme, setCurrentTheme] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("theme") || "default"
      : "default"
  );
  const [accentPalette, setAccentPalette] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("accentPalette") || "blue"
      : "blue"
  );
  const [contextMenu, setContextMenu] = useState(null);

  // --- Cambios aquí ---
  // Recarga el layout cuando cambian las columnas
  useEffect(() => {
    setLayout(LayoutManager.getInitialLayout(columns));
  }, [columns]);
  // --- Fin cambios aquí ---

  // Drag & Drop
  const handleDragEnd = useCallback(
    (result) => {
      if (!result.destination) return;
      setLayout(LayoutManager.updateLayoutAfterDrag(layout, result, columns));
    },
    [layout, columns] // <-- columns agregado aquí
  );

  // Teclas rápidas (Escape, etc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInputFocused =
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA";
      if (e.key === "Escape") {
        if (showWelcomeModal) setShowWelcomeModal(false);
        else if (isEditing) setIsEditing(false);
        else if (showSettings) setShowSettings(false);
        else if (showStartSession) setShowStartSession(false);
        else if (showTaskDetails) setShowTaskDetails(false);
      } else if (e.key === "m" && !isInputFocused) {
        setShowSettings(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showWelcomeModal,
    isEditing,
    showSettings,
    showStartSession,
    showTaskDetails,
  ]);

  // Añadir componente
  const addComponent = useCallback(
    (colIndex, componentKey) => {
      const newLayout = LayoutManager.addComponent(layout, colIndex, componentKey, columns);
      setLayout(newLayout);
    },
    [layout, columns] // <-- columns agregado aquí
  );

  // Eliminar componente
  const removeComponent = useCallback(
    (colIndex, itemIndex) => {
      if (!layout[colIndex] || !layout[colIndex].items) return;
      const foundColIndex = layout.findIndex((col) =>
        col.items.includes(layout[colIndex].items[itemIndex])
      );
      if (foundColIndex === -1) return;
      const newLayout = LayoutManager.removeComponent(layout, foundColIndex, itemIndex, columns);
      setLayout(newLayout);
    },
    [layout, columns] // <-- columns agregado aquí
  );

  // Menú contextual de componente/layout
  const handleContextMenu = useCallback(
    (e, componentKey, colIndex, itemIndex) => {
      e.preventDefault();
      setContextMenu({
        type: "component",
        x: e.clientX,
        y: e.clientY,
        componentId: componentKey,
        colIndex,
        itemIndex,
      });
    },
    []
  );

  const handleCloseContextMenu = () => setContextMenu(null);

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="w-full min-h-full">
          <div
            className="grid gap-4 p-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {responsiveLayout.map((column, colIndex) => (
              <Droppable key={column.id} droppableId={column.id}>
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
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
                            onContextMenu={(e) =>
                              handleContextMenu(e, componentKey, colIndex, index)
                            }
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
                        onClick={(componentKey) =>
                          addComponent(colIndex, componentKey)
                        }
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

      {/* Menú contextual de componente/layout */}
      {contextMenu && contextMenu.type === "component" && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          componentId={contextMenu.componentId}
          isEditing={isEditing}
          onClose={handleCloseContextMenu}
          colIndex={contextMenu.colIndex}
          itemIndex={contextMenu.itemIndex}
          onRemove={removeComponent}
          onToggleEdit={() => setIsEditing((prev) => !prev)}
        />
      )}

      {/* Otros modales */}
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

      <button
        onClick={() => setShowSettings(true)}
        className="fixed bottom-4 right-4 p-1 rounded hover:bg-neutral-800 transition z-[100]"
        aria-label="Open Settings"
      >
        <SettingsIcon size={20} />
      </button>
    </div>
  );
};

export default Home;
