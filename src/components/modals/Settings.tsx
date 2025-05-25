import React, { useState } from "react";
import { Settings as SettingsIcon, X, Play, Pause } from "lucide-react";
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

      {showSettings && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[99999] backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSettings(false);
            }
          }}
        >
          <div 
            className="maincard max-w-md w-full mx-4 rounded-2xl p-6 transform transition-transform duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Settings</h2>
              <button
                className="text-gray-400 hover:text-white transition duration-200"
                onClick={() => setShowSettings(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Session Section */}
              <div className="bg-bg-secondary p-4 rounded-xl">
                <h3 className="text-lg font-semibold mb-4 text-text-primary">Session Controls</h3>
                <div className="space-y-3">
                  {!isPlaying ? (
                    <button
                      onClick={() => {
                        setShowSessionMenu(true);
                        setShowSettings(false);
                      }}
                      className={`w-full px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${colorClasses["blue"]} hover:${colorClasses["blue"]}`}
                    >
                      <Play size={20} />
                      Start Session
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setIsPlaying(false)}
                        className={`w-full px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${colorClasses["blue"]} hover:${colorClasses["blue"]}`}
                      >
                        <Pause size={20} />
                        Pause Session
                      </button>
                      <button
                        onClick={() => {
                          setIsPlaying(false);
                        }}
                        className={`w-full px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700`}
                      >
                        <X size={20} />
                        Stop Session
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Section */}
              <div className="bg-bg-secondary p-4 rounded-xl">
                <h3 className="text-lg font-semibold mb-4 text-text-primary">Account</h3>
                <button
                  onClick={() => {
                    if (isLoggedIn) {
                      setShowSettings(false);
                      onLogin();
                    } else {
                      loginWithGoogle();
                      setShowSettings(false);
                    }
                  }}
                  className={`w-full px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${colorClasses["blue"]} hover:${colorClasses["blue"]}`}
                >
                  {isLoggedIn ? "Log Out" : "Log In with Google"}
                </button>
              </div>

              {/* Layout Section */}
              <div className="bg-bg-secondary p-4 rounded-xl">
                <h3 className="text-lg font-semibold mb-4 text-text-primary">Layout Settings</h3>
                <div className="space-y-4">
                  {/* Columns */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Number of Columns
                    </label>
                    <div className="flex justify-between gap-2">
                      {[1, 2, 3, 4].map((count) => (
                        <button
                          key={count}
                          onClick={() => setUserColumnCount(count)}
                          className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors duration-200 font-semibold
                            ${
                              userColumnCount === count
                                ? "border-accent-primary bg-accent-primary text-white"
                                : "border-border-primary bg-bg-tertiary text-text-primary hover:border-accent-primary"
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

                  {/* Spacing Controls */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Padding (rem)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.1}
                        value={userPadding}
                        onChange={(e) => setUserPadding(Number(e.target.value))}
                        className="textinput w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Gap (rem)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={5}
                        step={0.1}
                        value={userGap}
                        onChange={(e) => setUserGap(Number(e.target.value))}
                        className="textinput w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
