import { ListTodo, Moon, Palette, Sun } from "lucide-react";
import React, { useState } from "react";

import { ACCENT_COLORS } from "@/utils/theme";
import BaseModal from './BaseModal';
import ManageAssignmentsModal from "@/modals/ManageAssignmentsModal";
import ManageCompletedTasksModal from '@/modals/ManageCompletedTasksModal';
import Switch from "react-switch";
import useTheme from "@/hooks/useTheme";

// Define the AccentColor type locally since it's not exported from theme.ts
interface AccentColor {
  name: string;
  value: string;
  class: string;
}

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  handleThemeChange: (theme: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, currentTheme, handleThemeChange }) => {
  const { accentPalette, setAccentPalette } = useTheme();
  const [showAssignments, setShowAssignments] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  const handleAccentColorChange = (color: string) => {
    setAccentPalette(color);
    localStorage.setItem("accentPalette", color);
    document.documentElement.style.setProperty("--accent-primary", color);
  };

  if (!isOpen) return null;

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Settings"
        maxWidth="max-w-md"
        className="!p-0"
      >
        <div className=" p-2">
          {/* Theme Section */}
          <div className="bg-[var(--bg-secondary)] p-4 rounded-xl">
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)] flex items-center gap-2">
              {currentTheme === 'dark' ? <Moon size={22} /> : <Sun size={22} />}
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
                  onColor={accentPalette}
                  activeBoxShadow={`0 0 2px 3px ${accentPalette}`}
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
              <Palette size={22} />
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
              <ListTodo size={22} />
              Assignments
            </h3>
            <button
              onClick={() => setShowAssignments(true)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              Manage Assignments
            </button>
            <button
              onClick={() => setShowCompletedTasks(true)}
              className="w-full mt-2 px-4 py-2 rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              Manage Completed Tasks
            </button>
          </div>
        </div>
      </BaseModal>

      <ManageAssignmentsModal
        isOpen={showAssignments}
        onClose={() => setShowAssignments(false)}
      />
      <ManageCompletedTasksModal
        isOpen={showCompletedTasks}
        onClose={() => setShowCompletedTasks(false)}
      />
    </>
  );
};

export default Settings;
