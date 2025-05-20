import React, { useState } from "react";
import { Settings as SettingsIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../utils/ThemeContext";
import { colorClasses } from "../../utils/colors";
import StartSessionMenu from "./StartSessionMenu";
import { useAuth } from "../hooks/useAuth";

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
  userColumnCount: number;
  setUserColumnCount: (count: number) => void;
  userPadding: number;
  setUserPadding: (val: number) => void;
  userGap: number;
  setUserGap: (val: number) => void;
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
  userColumnCount,
  setUserColumnCount,
  userPadding,
  setUserPadding,
  userGap,
  setUserGap,
}) => {
  const { accentPalette: themeAccentPalette } = useTheme();
  const [showControlsModal, setShowControlsModal] = useState(false);
  const [showSessionMenu, setShowSessionMenu] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowControlsModal(true)}
        className="fixed bottom-4 right-4 p-1 rounded hover:bg-neutral-800 transition z-[100]"
        aria-label="Open Settings"
      >
        <SettingsIcon size={20} />
      </button>

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
              <div className="grid grid-cols-3 items-center mb-6">
                <div />
                <h2 className="text-2xl font-bold text-center">Menu</h2>
                <button
                  className="justify-self-end text-gray-400 hover:text-white transition duration-200"
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
                    className={`w-full px-4 py-2 rounded transition-colors duration-200 ${colorClasses["blue"]} hover:${colorClasses["blue"]}`}
                  >
                    Start Sesh
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setIsPlaying(false)}
                      className={`w-full px-4 py-2 rounded transition-colors duration-200 ${colorClasses["blue"]} hover:${colorClasses["blue"]}`}
                    >
                      Pause
                    </button>
                    <button
                      onClick={() => {
                        setIsPlaying(false);
                      }}
                      className={`w-full px-4 py-2 rounded transition-colors duration-200 ${colorClasses["blue"]} hover:${colorClasses["blue"]}`}
                    >
                      Stop
                    </button>
                  </div>
                )}
                <button
                  onClick={loginWithGoogle}
                  className={`w-full px-4 py-2 rounded transition-colors duration-200 ${colorClasses["blue"]} hover:${colorClasses["blue"]}`}
                >
                  {isLoggedIn ? (
                    <button
                      onClick={() => {
                        setShowSettings(false);
                        onLogin(); // Aquí podrías usar logout() si lo prefieres
                      }}
                      className={`w-full rounded transition-colors duration-200 ${colorClasses["blue"]} hover:${colorClasses["blue"]}`}
                    >
                      Logged In
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        loginWithGoogle();
                        setShowSettings(false);
                      }}
                      className={`w-full rounded transition-colors duration-200 ${colorClasses["blue"]} hover:${colorClasses["blue"]}`}
                    >
                      Log In
                    </button>
                  )}
                </button>

                <div className="space-y-4 mb-6">
                  <label className="block text-sm font-semibold text-text-secondary mb-2 text-center">
                    Choose Number of Columns
                  </label>
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4].map((count) => (
                      <button
                        key={count}
                        onClick={() => setUserColumnCount(count)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors duration-200 font-semibold
                          ${
                            userColumnCount === count
                              ? "border-accent-primary bg-accent-primary text-white"
                              : "border-border-primary bg-bg-secondary text-text-primary hover:border-accent-primary"
                          }
                        `}
                        aria-pressed={userColumnCount === count}
                        aria-label={`Set columns to ${count}`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Padding en rem */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-text-secondary mb-2 text-center">
                    Padding (rem)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={userPadding}
                    onChange={(e) => setUserPadding(Number(e.target.value))}
                    className="textinput"
                  />
                </div>

                {/* Gap en rem */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-text-secondary mb-2 text-center">
                    Gap (rem)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={userGap}
                    onChange={(e) => setUserGap(Number(e.target.value))}
                    className="textinput"
                  />
                </div>
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

export default Settings;
