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
import { Settings as SettingsIcon } from "lucide-react";

const Home: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showStartSession, setShowStartSession] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);

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
    [layout]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Verifica si el foco está en un input o textarea
      const isInputFocused =
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA";

      if (e.key === "Escape") {
        if (showWelcomeModal) {
          setShowWelcomeModal(false);
        } else if (isEditing) {
          setIsEditing(false);
        } else if (showSettings) {
          setShowSettings(false);
        } else if (showStartSession) {
          setShowStartSession(false);
        } else if (showTaskDetails) {
          setShowTaskDetails(false);
        }
      } else if (e.key === "m" && !isInputFocused) {
        // Solo abrir el menú si no hay un input enfocado
        setShowSettings(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    showWelcomeModal,
    isEditing,
    showSettings,
    showStartSession,
    showTaskDetails,
  ]);

  const addComponent = useCallback(
    (colIndex: number, componentKey: string) => {
      // Agregar el componente usando LayoutManager
      const newLayout = LayoutManager.addComponent(
        layout,
        colIndex,
        componentKey
      );

      // Actualizar el estado
      setLayout(newLayout);
    },
    [layout]
  );

  const removeComponent = useCallback(
    (colIndex: number, itemIndex: number) => {
      if (!layout[colIndex] || !layout[colIndex].items) return; // <-- Añade esta línea

      const foundColIndex = layout.findIndex((col) =>
        col.items.includes(layout[colIndex].items[itemIndex])
      );
      if (foundColIndex === -1) return;

      const newLayout = LayoutManager.removeComponent(
        layout,
        foundColIndex,
        itemIndex
      );
      setLayout(newLayout);
    },
    [layout]
  );

  const handleContextMenu = useCallback(
    (e, componentKey, colIndex, itemIndex) => {
      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        componentId: componentKey, // Usa siempre el mismo nombre de prop
        colIndex,
        itemIndex,
      });
    },
    []
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
                    className=""
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
                            onContextMenu={(e) =>
                              handleContextMenu(
                                e,
                                componentKey,
                                colIndex,
                                index
                              )
                            }
                          >
                            <ComponentRenderer
                              componentKey={componentKey}
                              colIndex={colIndex}
                              index={index}
                              isEditing={isEditing}
                              onRemove={removeComponent}
                              onContextMenu={handleContextMenu} // Este se usa si quieres menú contextual dentro del componente
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

      {contextMenu && (
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
        onToggleEditing={(value) => setIsEditing(value)}
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
        onClick={() => {
          console.log("Settings button clicked");
          setShowSettings(true);
        }}
        className="fixed bottom-4 right-4 p-1 rounded hover:bg-neutral-800 transition z-[100]"
        aria-label="Open Settings"
      >
        <SettingsIcon size={20} />
      </button>
    </div>
  );
};

export default Home;
