import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  lazy,
  Suspense
} from "react";
import { useAuth } from "./hooks/useAuth";
import ContextMenu from "./components/modals/ContextMenu";
import WelcomeModal from "./components/modals/WelcomeModal";
import Settings from "./components/modals/Settings";
import StartSessionMenu from "./components/modals/StartSessionMenu";
import { LayoutManager } from "./utils/layoutManager";
import AddComponentButton from "./components/home/AddComponentButton";
import { Settings as SettingsIcon } from "lucide-react";
import { useResponsiveColumns } from "./hooks/useResponsiveColumns";
import { distributeItems } from "./utils/distributeItems";
import Navbar from "./components/Navbar";

// Lazy load the ComponentRenderer
const ComponentRenderer = lazy(() => import("./components/home/ComponentRenderer"));

const Home = () => {
  const pomodoroRef = useRef<any>(null);
  const responsiveColumns = useResponsiveColumns();

  // Memoize initial layout
  const initialLayout = useMemo(() => 
    LayoutManager.getInitialLayout(responsiveColumns),
    [responsiveColumns]
  );

  const [layout, setLayout] = useState(initialLayout);
  
  // Memoize responsive layout
  const responsiveLayout = useMemo(
    () => distributeItems(layout, responsiveColumns),
    [layout, responsiveColumns]
  );

  // Combine related state into a single object
  const [uiState, setUiState] = useState({
    isEditing: false,
    showSettings: false,
    showWelcomeModal: false,
    showStartSession: false,
    showTaskDetails: false,
    contextMenu: null
  });

  const { isLoggedIn, loginWithGoogle } = useAuth();

  // Memoize theme and accent palette
  const [themeState, setThemeState] = useState(() => ({
    currentTheme: typeof window !== "undefined" ? localStorage.getItem("theme") || "default" : "default",
    accentPalette: typeof window !== "undefined" ? localStorage.getItem("accentPalette") || "blue" : "blue"
  }));

  // Memoize layout settings
  const [layoutSettings, setLayoutSettings] = useState(() => ({
    userPadding: typeof window !== "undefined" ? Number(localStorage.getItem("userPadding")) || 1 : 1,
    userGap: typeof window !== "undefined" ? Number(localStorage.getItem("userGap")) || 1 : 1
  }));

  const toggleEditing = useCallback(() => {
    setUiState(prev => ({ ...prev, isEditing: !prev.isEditing }));
  }, []);

  // Optimize layout updates
  useEffect(() => {
    setLayout(LayoutManager.getInitialLayout(responsiveColumns));
  }, [responsiveColumns]);

  // Optimize keyboard event handling
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSeen = localStorage.getItem("hasSeenWelcomeModal");
      if (!hasSeen) {
        setUiState(prev => ({ ...prev, showWelcomeModal: true }));
      }
    }

    const handleKeyDown = (e) => {
      const isInputFocused =
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA";

      if (e.key === "Escape") {
        setUiState(prev => ({
          ...prev,
          showWelcomeModal: false,
          isEditing: false,
          showSettings: false,
          showStartSession: false,
          showTaskDetails: false
        }));
      } else if (e.key === "m" && !isInputFocused) {
        setUiState(prev => ({ ...prev, showSettings: true }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Memoize component handlers
  const addComponent = useCallback(
    (colIndex, componentKey) => {
      setLayout(prev => LayoutManager.addComponent(prev, colIndex, componentKey, responsiveColumns));
    },
    [responsiveColumns]
  );

  const removeComponent = useCallback(
    (colIndex, itemIndex) => {
      setLayout(prev => {
        if (!prev[colIndex] || !prev[colIndex].items) return prev;
        const foundColIndex = prev.findIndex((col) =>
          col.items.includes(prev[colIndex].items[itemIndex])
        );
        if (foundColIndex === -1) return prev;
        return LayoutManager.removeComponent(prev, foundColIndex, itemIndex, responsiveColumns);
      });
    },
    [responsiveColumns]
  );

  const handleContextMenu = useCallback(
    (e, componentKey, colIndex, itemIndex) => {
      e.preventDefault();
      setUiState(prev => ({
        ...prev,
        contextMenu: {
          type: "component",
          x: e.clientX,
          y: e.clientY,
          componentId: componentKey,
          colIndex,
          itemIndex,
        }
      }));
    },
    []
  );

  const handleCloseContextMenu = useCallback(() => {
    setUiState(prev => ({ ...prev, contextMenu: null }));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950">
      <div style={{ paddingLeft: `${layoutSettings.userPadding}rem`, paddingRight: `${layoutSettings.userPadding}rem` }}>
        <Navbar />
      </div>
      <div className="pt-12">
        <div className="w-full min-h-full">
          <div
            className="grid w-full"
            style={{
              gridTemplateColumns: `repeat(${responsiveColumns}, 1fr)`,
              gap: `${layoutSettings.userGap}rem`,
              padding: `${layoutSettings.userPadding}rem`,
            }}
          >
            {responsiveLayout.map((column, colIndex) => (
              <div
                key={column.id}
                className="min-h-[200px] bg-neutral-900 rounded-lg p-4"
              >
                {column.items.map((componentKey, index) => (
                  <div
                    key={`${componentKey}-${colIndex}-${index}`}
                    onContextMenu={(e) =>
                      handleContextMenu(e, componentKey, colIndex, index)
                    }
                    className="mb-4"
                  >
                    <Suspense fallback={<div>Loading...</div>}>
                      <ComponentRenderer
                        componentKey={componentKey}
                        colIndex={colIndex}
                        index={index}
                        isEditing={uiState.isEditing}
                        onRemove={removeComponent}
                        onContextMenu={handleContextMenu}
                        pomodoroRef={componentKey === "Pomodoro" || componentKey === "StudyTimer" ? pomodoroRef : undefined}
                      />
                    </Suspense>
                  </div>
                ))}
                {uiState.isEditing && (
                  <AddComponentButton
                    onClick={(componentKey) => addComponent(colIndex, componentKey)}
                    layout={layout}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {uiState.contextMenu && uiState.contextMenu.type === "component" && (
          <ContextMenu
            x={uiState.contextMenu.x}
            y={uiState.contextMenu.y}
            componentId={uiState.contextMenu.componentId}
            isEditing={uiState.isEditing}
            onClose={handleCloseContextMenu}
            colIndex={uiState.contextMenu.colIndex}
            itemIndex={uiState.contextMenu.itemIndex}
            onRemove={removeComponent}
            onToggleEdit={toggleEditing}
          />
        )}

        {uiState.showWelcomeModal && (
          <WelcomeModal onClose={() => setUiState(prev => ({ ...prev, showWelcomeModal: false }))} />
        )}

        {uiState.showSettings && (
          <Settings
            isEditing={uiState.isEditing}
            onToggleEditing={toggleEditing}
            isLoggedIn={isLoggedIn}
            onLogin={loginWithGoogle}
            currentTheme={themeState.currentTheme}
            onThemeChange={(theme) => setThemeState(prev => ({ ...prev, currentTheme: theme }))}
            accentPalette={themeState.accentPalette}
            setAccentPalette={(palette) => setThemeState(prev => ({ ...prev, accentPalette: palette }))}
            isPlaying={false}
            setIsPlaying={() => {}}
            showSettings={uiState.showSettings}
            setShowSettings={(show) => setUiState(prev => ({ ...prev, showSettings: show }))}
            loginWithGoogle={loginWithGoogle}
            userPadding={layoutSettings.userPadding}
            setUserPadding={(val) => setLayoutSettings(prev => ({ ...prev, userPadding: val }))}
            userGap={layoutSettings.userGap}
            setUserGap={(val) => setLayoutSettings(prev => ({ ...prev, userGap: val }))}
          />
        )}

        {uiState.showStartSession && (
          <StartSessionMenu
            onClose={() => setUiState(prev => ({ ...prev, showStartSession: false }))}
            pomodoroRef={pomodoroRef}
          />
        )}

        <button
          onClick={() => setUiState(prev => ({ ...prev, showSettings: true }))}
          className="fixed bottom-4 right-4 p-1 rounded hover:bg-neutral-800 transition z-[100]"
          aria-label="Open Settings"
        >
          <SettingsIcon size={20} />
        </button>
      </div>
    </div>
  );
};

export default React.memo(Home);
