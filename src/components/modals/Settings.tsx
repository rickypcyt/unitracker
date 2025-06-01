import { ACCENT_COLORS, AccentColor } from "../../utils/theme";
import { ListTodo, Moon, Palette, Sun, X } from "lucide-react";
import React, { useState } from "react";

import ManageAssignmentsModal from "./ManageAssignmentsModal";
import Switch from "react-switch";
import useTheme from "../../hooks/useTheme";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  handleThemeChange: (theme: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const { currentTheme, handleThemeChange, accentPalette, setAccentPalette } = useTheme();
  const [showAssignments, setShowAssignments] = useState(false);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAccentColorChange = (color: string) => {
    setAccentPalette(color);
    localStorage.setItem("accentPalette", color);
    document.documentElement.style.setProperty("--accent-primary", color);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]"
        onClick={handleOverlayClick}
      >
        <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] w-full max-w-md mx-4 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Settings</h2>
            <button
              onClick={onClose}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Theme Section */}
            <div className="bg-[var(--bg-secondary)] p-4 rounded-xl">
              <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)] flex items-center gap-2">
                {currentTheme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                Theme
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-[var(--bg-secondary)] p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sun size={16} className="text-[var(--text-primary)]" />
                    <span className="text-[var(--text-primary)]">Light</span>
                  </div>
                  <Switch
                    onChange={() => handleThemeChange(currentTheme === 'dark' ? 'light' : 'dark')}
                    checked={currentTheme === 'dark'}
                    checkedIcon={false}
                    uncheckedIcon={false}
                    height={24}
                    width={48}
                    handleDiameter={20}
                    offColor="#D1D5DB"
                    onColor="var(--accent-primary)"
                    activeBoxShadow="0 0 2px 3px var(--accent-primary)"
                    className="react-switch"
                  />
                  <div className="flex items-center gap-2">
                    <Moon size={16} className="text-[var(--text-primary)]" />
                    <span className="text-[var(--text-primary)]">Dark</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Accent Color Section */}
            <div className="bg-[var(--bg-secondary)] p-4 rounded-xl">
              <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)] flex items-center gap-2">
                <Palette size={18} />
                Accent Color
              </h3>
              <div className="grid grid-cols-6 gap-2">
                {ACCENT_COLORS.map((color: AccentColor) => (
                  <button
                    key={color.value}
                    onClick={() => handleAccentColorChange(color.value)}
                    className={`relative aspect-square rounded-lg transition-all ${
                      accentPalette === color.value
                        ? 'ring-2 ring-[var(--text-primary)] ring-offset-2 ring-offset-[var(--bg-primary)]'
                        : 'hover:opacity-80'
                    } ${color.class}`}
                    aria-label={`Select ${color.name} accent color`}
                    title={color.name}
                  >
                    <span className="sr-only">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Assignments Section */}
            <div className="bg-[var(--bg-secondary)] p-4 rounded-xl">
              <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)] flex items-center gap-2">
                <ListTodo size={18} />
                Assignments
              </h3>
              <button
                onClick={() => setShowAssignments(true)}
                className="w-full px-4 py-2 rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                Manage Assignments
              </button>
            </div>
          </div>
        </div>
      </div>

      <ManageAssignmentsModal
        isOpen={showAssignments}
        onClose={() => setShowAssignments(false)}
      />
    </>
  );
};

export default Settings;
