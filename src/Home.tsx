import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
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
const pomodoroRef = useRef<any>(null);

  const responsiveColumns = useResponsiveColumns();

  const [layout, setLayout] = useState(() =>
    LayoutManager.getInitialLayout(responsiveColumns)
  );
  const responsiveLayout = useMemo(
    () => distributeItems(layout, responsiveColumns),
    [layout, responsiveColumns]
  );

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

  const toggleEditing = useCallback(() => {
    setIsEditing(prev => !prev);
  }, []);

  // --- Cambios aquí ---
  // Recarga el layout cuando cambian las columnas
  useEffect(() => {
    setLayout(LayoutManager.getInitialLayout(responsiveColumns));
  }, [responsiveColumns]);
  // --- Fin cambios aquí ---

  // Drag & Drop
  const handleDragEnd = useCallback(
    (result) => {
      if (!result.destination) return;
      setLayout(LayoutManager.updateLayoutAfterDrag(layout, result, responsiveColumns));
    },
    [layout, responsiveColumns]
  );

  // Teclas rápidas (Escape, etc)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSeen = localStorage.getItem("hasSeenWelcomeModal");
      if (!hasSeen) {
        setShowWelcomeModal(true);
      }
    }
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
      const newLayout = LayoutManager.addComponent(
        layout,
        colIndex,
        componentKey,
        responsiveColumns
      );
      setLayout(newLayout);
    },
    [layout, responsiveColumns] // <-- columns agregado aquí
  );

  // Eliminar componente
  const removeComponent = useCallback(
    (colIndex, itemIndex) => {
      if (!layout[colIndex] || !layout[colIndex].items) return;
      const foundColIndex = layout.findIndex((col) =>
        col.items.includes(layout[colIndex].items[itemIndex])
      );
      if (foundColIndex === -1) return;
      const newLayout = LayoutManager.removeComponent(
        layout,
        foundColIndex,
        itemIndex,
        responsiveColumns
      );
      setLayout(newLayout);
    },
    [layout, responsiveColumns] // <-- columns agregado aquí
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

  const [userPadding, setUserPadding] = useState(() => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("userPadding")
        : null;
    return stored ? Number(stored) : 2; // Por defecto 40px
  });
  const [userGap, setUserGap] = useState(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("userGap") : null;
    return stored ? Number(stored) : 1; // Por defecto 12px
  });

  const handleCloseContextMenu = () => setContextMenu(null);

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="w-full min-h-full">
          <div
            className={`grid`}
            style={{
              gridTemplateColumns: `repeat(${responsiveColumns}, 1fr)`,
              gap: `${userGap}rem`,
              padding: `${userPadding}rem`,
            }}
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
                              onContextMenu={handleContextMenu}
                              pomodoroRef={componentKey === "Pomodoro" || componentKey === "StudyTimer" ? pomodoroRef : undefined}
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
          onToggleEdit={toggleEditing}
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
        onToggleEditing={toggleEditing}
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
        userPadding={userPadding}
        setUserPadding={(val) => {
          setUserPadding(val);
          localStorage.setItem("userPadding", val.toString());
        }}
        userGap={userGap}
        setUserGap={(val) => {
          setUserGap(val);
          localStorage.setItem("userGap", val.toString());
        }}
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
