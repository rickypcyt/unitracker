import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import type { DraggableProvided } from "react-beautiful-dnd";
import {
  Trash2,
  Plus,
  Move,
  Maximize2,
  Minimize2,
  Settings,
  X,
  LogOut,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "./hooks/useAuth";
import { ComponentRegistry } from "./utils/componentRegistry";
import { LayoutManager } from "./utils/layoutManager";
import StartSessionMenu from "./components/StartSessionMenu";
import { motion, AnimatePresence } from "framer-motion";

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
  const [layout, setLayout] = useState<LayoutColumn[]>(
    LayoutManager.getInitialLayout(),
  );
  const [wideComponents, setWideComponents] = useState<Set<string>>(new Set());
  const { isLoggedIn, loginWithGoogle } = useAuth();
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "default";
    }
    return "default";
  });
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    componentId: string;
  } | null>(null);
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

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (showWelcomeModal) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "auto";
      document.body.style.overflow = "auto";
    }
    return () => {
      document.documentElement.style.overflow = "auto";
      document.body.style.overflow = "auto";
    };
  }, [showWelcomeModal]);

  // Handle theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(
      "theme-dracula",
      "theme-catppuccin",
      "theme-monokai",
      "theme-default",
      "theme-solarized",
      "theme-gruvbox",
    );
    root.classList.add(`theme-${currentTheme}`);
  }, [currentTheme]);

  useEffect(() => {
    // Set CSS variable for accent color and hover
    const paletteColors: Record<string, { primary: string; hover: string }> = {
      blue: { primary: "#2563eb", hover: "#1d4ed8" },
      green: { primary: "#22c55e", hover: "#16a34a" },
      orange: { primary: "#f59e42", hover: "#ea580c" },
      pink: { primary: "#ec4899", hover: "#db2777" },
      purple: { primary: "#a21caf", hover: "#7c1fa0" },
      white: { primary: "#fff", hover: "#e5e5e5" },
      gray: { primary: "#27272a", hover: "#3f3f46" },
    };
    document.documentElement.style.setProperty(
      "--accent-primary",
      paletteColors[accentPalette]?.primary || paletteColors.blue.primary,
    );
    document.documentElement.style.setProperty(
      "--accent-hover",
      paletteColors[accentPalette]?.hover || paletteColors.blue.hover,
    );
    localStorage.setItem("accentPalette", accentPalette);
  }, [accentPalette]);

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem("theme", theme);
  };

  const handleDragEnd = useCallback(
    (result: DragResult) => {
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
      // Find the column and index of the component
      const colIndex = layout.findIndex((col) =>
        col.items.includes(componentId),
      );
      if (colIndex === -1) return;

      const itemIndex = layout[colIndex].items.indexOf(componentId);
      const newLayout = LayoutManager.removeComponent(
        layout,
        colIndex,
        itemIndex,
      );
      setLayout(newLayout);

      // Remove from wide components if necessary
      setWideComponents((prev) => {
        const updated = new Set(prev);
        updated.delete(componentId);
        return updated;
      });
    },
    [layout],
  );

  const addComponent = useCallback(
    (colIndex: number, componentKey: string) => {
      const newLayout = LayoutManager.addComponent(
        layout,
        colIndex,
        componentKey,
      );
      setLayout(newLayout);
    },
    [layout],
  );

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

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenu]);

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
    localStorage.setItem("hasSeenWelcomeModal", "true");
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCloseWelcome();
    }
  };

  const renderLayoutColumns = useMemo(
    () =>
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
                      className={`${wideComponents.has(componentKey) ? "md:col-span-2 lg:col-span-2" : ""}`}
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
                  onClick={(componentKey) =>
                    addComponent(colIndex, componentKey)
                  }
                  layout={layout}
                />
              )}
            </div>
          )}
        </Droppable>
      )),
    [
      layout,
      isEditing,
      wideComponents,
      toggleComponentSize,
      removeComponent,
      addComponent,
      handleContextMenu,
    ],
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
    <div className="min-h-screen bg-neutral-950 text-text-primary">
      <ToastContainer />
      <AnimatePresence>
        {showWelcomeModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[99999] backdrop-blur-sm"
            onClick={handleOverlayClick}
          >
            <div className="maincard max-w-4xl w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-center flex-1 text-accent-primary">
                  Welcome to UniTracker
                </h3>
                <button
                  className="text-gray-400 hover:text-white transition duration-200"
                  onClick={handleCloseWelcome}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4 text-text-primary">
                <p className="text-lg text-center">
                  This is a time management tool for those who like to study and
                  work and have a record of how many hours they spend doing it.
                </p>

                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-accent-primary">
                    Key Features:
                  </h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Task Management: Create, track, and organize your study
                      tasks
                    </li>
                    <li>
                      Study Timer: Track your study sessions with a built-in
                      timer
                    </li>
                    <li>
                      Pomodoro Technique: Built-in Pomodoro timer for focused
                      study sessions
                    </li>
                    <li>
                      Progress Tracking: Visualize your study progress and
                      statistics
                    </li>
                    <li>
                      Calendar Integration: Plan and view your study schedule
                    </li>
                    <li>
                      Noise Generator: Background sounds to help you focus
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-accent-primary">
                    Data Storage:
                  </h4>
                  <p>
                    All your data is securely stored in a database, ensuring
                    your progress and tasks are always saved and accessible
                    across devices.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-accent-primary">
                    Built with:
                  </h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>React for the frontend</li>
                    <li>Tailwind CSS for styling</li>
                    <li>Chakra UI for components</li>
                    <li>Supabase for database and authentication</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="w-full min-h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
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
                setIsEditing(!isEditing);
                handleCloseContextMenu();
              }}
              className="w-full px-4 py-2 text-left text-sm bg-neutral-800 hover:bg-neutral-700 rounded-md bg-opacity-60 flex items-center gap-2"
            >
              <Settings size={16} />
              {isEditing ? "Exit Edit Mode" : "Edit Mode"}
            </button>
            {isEditing && (
              <button
                onClick={() => {
                  removeComponent(contextMenu.componentId);
                  handleCloseContextMenu();
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-neutral-800 rounded-md flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete Component
              </button>
            )}
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
        accentPalette={accentPalette}
        setAccentPalette={setAccentPalette}
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
  onRemove,
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
          className={`relative ${isWide ? "lg:col-span-2" : ""}`}
        >
          {isEditing && (
            <ComponentEditControls
              onToggleSize={() => onToggleSize(componentKey)}
              onRemove={() => onRemove(colIndex, index)}
              dragHandleProps={provided.dragHandleProps}
              isWide={isWide}
            />
          )}
          <div
            className={`rounded-lg shadow-lg ${isEditing ? "border-2 border-dashed border-gray-700" : ""}`}
          >
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
  accentPalette: string;
  setAccentPalette: (palette: string) => void;
}> = ({
  isEditing,
  onToggleEditing,
  isLoggedIn,
  onLogin,
  isPlaying,
  setIsPlaying,
  currentTheme,
  onThemeChange,
  accentPalette,
  setAccentPalette,
}) => {
  const [showControlsModal, setShowControlsModal] = useState(false);
  const [showSessionMenu, setShowSessionMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  useEffect(() => {
    if (showControlsModal) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "auto";
      document.body.style.overflow = "auto";
    }
    return () => {
      document.documentElement.style.overflow = "auto";
      document.body.style.overflow = "auto";
    };
  }, [showControlsModal]);

  // Handle ESC key to toggle modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showControlsModal) {
          setShowControlsModal(false);
        } else if (!isEditing) {
          setShowControlsModal(true);
        }
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [showControlsModal, isEditing]);

  const handleToggleEditing = () => {
    onToggleEditing();
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
    <>
      {!isEditing && (
        <button
          onClick={() => setShowControlsModal(true)}
          className="fixed bottom-4 right-4 p-2 bg-neutral-800 text-white rounded-full hover:bg-neutral-700"
        >
          <Settings size={24} />
        </button>
      )}

      <AnimatePresence>
        {showControlsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[99999] backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowControlsModal(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="maincard max-w-md w-full mx-4 rounded-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-center">Settings</h2>
                <button
                  className="text-gray-400 hover:text-white transition duration-200"
                  onClick={() => setShowControlsModal(false)}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Session Controls */}
                {!isPlaying ? (
                  <button
                    onClick={() => {
                      setShowSessionMenu(true);
                      setShowControlsModal(false);
                    }}
                    className="w-full px-4 py-2 rounded transition-colors duration-200"
                    style={{
                      backgroundColor: "var(--accent-primary)",
                      color: accentPalette === "white" ? "#222" : "#fff",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--accent-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--accent-primary)")
                    }
                  >
                    Start Sesh
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setIsPlaying(false)}
                      className="w-full px-4 py-2 rounded transition-colors duration-200"
                      style={{
                        backgroundColor: "var(--accent-primary)",
                        color: accentPalette === "white" ? "#222" : "#fff",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--accent-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--accent-primary)")
                      }
                    >
                      Pause
                    </button>
                    <button
                      onClick={() => {
                        setIsPlaying(false);
                        // lógica extra si quieres
                      }}
                      className="w-full px-4 py-2 rounded transition-colors duration-200"
                      style={{
                        backgroundColor: "var(--accent-primary)",
                        color: accentPalette === "white" ? "#222" : "#fff",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--accent-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--accent-primary)")
                      }
                    >
                      Stop
                    </button>
                  </div>
                )}

                <button
                  onClick={handleToggleEditing}
                  className="w-full px-4 py-2 rounded transition-colors duration-200"
                  style={{
                    backgroundColor: "var(--accent-primary)",
                    color: accentPalette === "white" ? "#222" : "#fff",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "var(--accent-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "var(--accent-primary)")
                  }
                >
                  {isEditing ? "Save Layout" : "Edit Layout"}
                </button>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Color Palette</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        key: "blue",
                        label: "Blue",
                        color: "#2563eb",
                        text: "#fff",
                      },
                      {
                        key: "green",
                        label: "Green",
                        color: "#22c55e",
                        text: "#fff",
                      },
                      {
                        key: "orange",
                        label: "Orange",
                        color: "#f59e42",
                        text: "#fff",
                      },
                      {
                        key: "pink",
                        label: "Pink",
                        color: "#ec4899",
                        text: "#fff",
                      },
                      {
                        key: "purple",
                        label: "Purple",
                        color: "#a21caf",
                        text: "#fff",
                      },
                      {
                        key: "white",
                        label: "White",
                        color: "#fff",
                        text: "#222",
                      },
                      {
                        key: "gray",
                        label: "Gray",
                        color: "#27272a",
                        text: "#f4f4f5",
                      },
                    ].map(({ key, label, color, text }) => (
                      <button
                        key={key}
                        onClick={() => setAccentPalette(key)}
                        className={`px-4 py-2 rounded hover:opacity-80 transition-colors duration-200 border-2 ${accentPalette === key ? "border-black" : "border-transparent"}`}
                        style={{
                          backgroundColor: color,
                          color: text,
                          fontWeight: accentPalette === key ? "bold" : "normal",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <LoginButton
                  isLoggedIn={isLoggedIn}
                  onClick={onLogin}
                  accentPalette={accentPalette}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <StartSessionMenu
        isOpen={showSessionMenu}
        onClose={() => {
          setShowSessionMenu(false);
          setIsPlaying(false);
        }}
        setIsPlaying={setIsPlaying}
      />
    </>
  );
};

const LoginButton: React.FC<{
  isLoggedIn: boolean;
  onClick: () => void;
  accentPalette: string;
}> = ({ isLoggedIn, onClick, accentPalette }) => {
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
      className="w-full px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors duration-200"
      style={{
        backgroundColor: "var(--accent-primary)",
        color: accentPalette === "white" ? "#222" : "#fff",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = "var(--accent-hover)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = "var(--accent-primary)")
      }
    >
      {isLoggedIn ? (
        <>
          <LogOut className="w-5 h-5" />
          Logout
        </>
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Login with Google
        </>
      )}
    </button>
  );
};

export default Home;
