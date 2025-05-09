import React, { useState } from "react";
import { Settings, Settings as SettingsIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../utils/ThemeContext";
import { colorClasses } from "../../utils/colors";
import StartSessionMenu from './StartSessionMenu';
import { useAuth } from '../hooks/useAuth';

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
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

const Settings: React.FC<LayoutControlsProps> = ({
  isEditing,
  onToggleEditing,
  isLoggedIn,
  onLogin,
  isPlaying,
  setIsPlaying,
  loginWithGoogle,
  showSettings,
  setShowSettings,
}) => {
  const { accentPalette: themeAccentPalette } = useTheme();
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
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[99999] backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowSettings(false);
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
                  onClick={() => setShowSettings(false)}
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
                      setShowSettings(false);
                    }}
                    className={`w-full px-4 py-2 rounded transition-colors duration-200 ${colorClasses['blue']} hover:${colorClasses['blue']}`}
                  >
                    Start Sesh
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setIsPlaying(false)}
                      className={`w-full px-4 py-2 rounded transition-colors duration-200 ${colorClasses['blue']} hover:${colorClasses['blue']}`}
                    >
                      Pause
                    </button>
                    <button
                      onClick={() => {
                        setIsPlaying(false);
                      }}
                      className={`w-full px-4 py-2 rounded transition-colors duration-200 ${colorClasses['blue']} hover:${colorClasses['blue']}`}
                    >
                      Stop
                    </button>
                  </div>
                )}

                <button
                  onClick={() => {
                    onToggleEditing();
                    setShowSettings(false);
                  }}
                  className={`w-full px-4 py-2 rounded transition-colors duration-200 ${colorClasses['blue']} hover:${colorClasses['blue']}`}
                >
                  {isEditing ? "Save Layout" : "Edit Layout"}
                </button>

                <button
                  onClick={loginWithGoogle}
                  className={`w-full px-4 py-2 rounded transition-colors duration-200 ${colorClasses['blue']} hover:${colorClasses['blue']}`}
                >
                  {isLoggedIn ? (
                    <button
                      onClick={() => {
                        setShowSettings(false);
                        onLogin(); // Aquí podrías usar logout() si lo prefieres
                      }}
                      className={`w-full rounded transition-colors duration-200 ${colorClasses['blue']} hover:${colorClasses['blue']}`}
                    >
                      Logged In
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        loginWithGoogle();
                        setShowSettings(false);
                      }}
                      className={`w-full rounded transition-colors duration-200 ${colorClasses['blue']} hover:${colorClasses['blue']}`}
                    >
                      Log In
                    </button>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* StartSessionMenu component */}
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

export default Settings;
