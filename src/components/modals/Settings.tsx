import React, { useState } from "react";
import { Settings as SettingsIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../utils/ThemeContext";
import { colorClasses } from "../../utils/colors";

interface LayoutControlsProps {
  isEditing: boolean;
  onToggleEditing: () => void;
  isLoggedIn: boolean;
  onLogin: () => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  accentPalette: string;
  setAccentPalette: (palette: string) => void;
  loginWithGoogle: () => void;
}

const LayoutControls: React.FC<LayoutControlsProps> = ({
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
  loginWithGoogle,
}) => {
  const { accentPalette: themeAccentPalette, setAccentPalette: setThemeAccentPalette, iconColor } = useTheme();
  const [showControlsModal, setShowControlsModal] = useState(false);
  const [showSessionMenu, setShowSessionMenu] = useState(false);

  return (
    <>
      {/* Icono pequeño en la esquina derecha */}
      <button
        onClick={() => setShowControlsModal(true)}
        className="fixed bottom-4 right-4 p-1 rounded hover:bg-neutral-800 transition z-[100]"
        aria-label="Open Settings"
      >
        <SettingsIcon size={20} />
      </button>

      {/* Modal */}
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
              className="maincard max-w-md w-full mx-4 rounded-2xl p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-center flex-1">
                  Menu
                </h2>
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
                    >
                      Pause
                    </button>
                    <button
                      onClick={() => {
                        setIsPlaying(false);
                      }}
                      className="w-full px-4 py-2 rounded transition-colors duration-200"
                      style={{
                        backgroundColor: "var(--accent-primary)",
                        color: accentPalette === "white" ? "#222" : "#fff",
                      }}
                    >
                      Stop
                    </button>
                  </div>
                )}

                <button
                  onClick={() => {
                    onToggleEditing();
                    setShowControlsModal(false);
                  }}
                  className="w-full px-4 py-2 rounded transition-colors duration-200"
                  style={{
                    backgroundColor: "var(--accent-primary)",
                    color: accentPalette === "white" ? "#222" : "#fff",
                  }}
                >
                  {isEditing ? "Save Layout" : "Edit Layout"}
                </button>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Color Palette</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.keys(colorClasses).map((key) => (
                      <button
                        key={key}
                        onClick={() => setAccentPalette(key)}
                        className={`px-4 py-2 rounded hover:opacity-80 transition-colors duration-200 border-2 ${
                          accentPalette === key ? "border-black" : "border-transparent"
                        } ${colorClasses[key]}`}
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={loginWithGoogle}
                  className="w-full px-4 py-2 rounded transition-colors duration-200"
                  style={{
                    backgroundColor: "var(--accent-primary)",
                    color: accentPalette === "white" ? "#222" : "#fff",
                  }}
                >
                  {isLoggedIn ? "Logged In" : "Login"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Si usas StartSessionMenu, aquí lo puedes incluir */}
      {/* <StartSessionMenu
          isOpen={showSessionMenu}
          onClose={() => {
            setShowSessionMenu(false);
            setIsPlaying(false);
          }}
          setIsPlaying={setIsPlaying}
        /> */}
    </>
  );
};

export default LayoutControls;
