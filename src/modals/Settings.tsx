import { ListTodo, Monitor, Moon, Palette, Sun } from "lucide-react";
import React, { useState } from "react";

import { ACCENT_COLORS } from "@/utils/theme";
import BaseModal from './BaseModal';
import ManageAssignmentsModal from "@/modals/ManageAssignmentsModal";
import ManageCompletedTasksModal from '@/modals/ManageCompletedTasksModal';
import useTheme from "@/hooks/useTheme";

// Define the AccentColor type locally since it's not exported from theme.ts
interface AccentColor {
  name: string;
  value: string;
  class: string;
}

// Types are now handled by the useTheme hook

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const { accentPalette, setAccentPalette, themePreference, handleThemeChange, currentTheme } = useTheme();
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
          <div className="bg-[var(--bg-secondary)] p-4 rounded-xl pt-0">
            <h3 className="text-base font-semibold mb-4 text-[var(--text-primary)] flex items-center gap-2">
              {themePreference === 'auto' ? <Monitor size={22} /> : currentTheme === 'dark' ? <Moon size={22} /> : <Sun size={22} />}
              Theme
            </h3>
            <div className="space-y-3">
              <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
                {/* Three-position theme selector */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sun size={16} className="text-[var(--text-primary)]" />
                    <span className="text-sm text-[var(--text-primary)]">Light</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Monitor size={16} className="text-[var(--text-primary)]" />
                    <span className="text-sm text-[var(--text-primary)]">System</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Moon size={16} className="text-[var(--text-primary)]" />
                    <span className="text-sm text-[var(--text-primary)]">Dark</span>
                  </div>
                </div>
                
                {/* Custom three-position slider */}
                <div className="relative">
                  <div className="w-full h-8 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-full relative overflow-hidden">
                    {/* Slider track background */}
                    <div 
                      className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-in-out"
                      style={{
                        backgroundColor: accentPalette,
                        width: 'calc(33.333% - 4px)',
                        left: themePreference === 'light' ? '2px' : 
                              themePreference === 'auto' ? 'calc(33.333% + 1px)' : 
                              'calc(66.666% + 0px)',
                      }}
                    />
                    
                    {/* Three clickable areas */}
                    <button
                      onClick={() => handleThemeChange('light')}
                      className="absolute left-0 top-0 w-1/3 h-full flex items-center justify-center transition-colors"
                      aria-label="Light theme"
                    >
                      <Sun size={16} className={`${themePreference === 'light' ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
                    </button>
                    
                    <button
                      onClick={() => handleThemeChange('auto')}
                      className="absolute left-1/3 top-0 w-1/3 h-full flex items-center justify-center transition-colors"
                      aria-label="System theme"
                    >
                      <Monitor size={16} className={`${themePreference === 'auto' ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
                    </button>
                    
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className="absolute right-0 top-0 w-1/3 h-full flex items-center justify-center transition-colors"
                      aria-label="Dark theme"
                    >
                      <Moon size={16} className={`${themePreference === 'dark' ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
                    </button>
                  </div>
                </div>
                
                {/* Current theme indicator */}
                <div className="mt-3 text-center">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {themePreference === 'auto' 
                      ? `Following system (${currentTheme})` 
                      : `${themePreference.charAt(0).toUpperCase() + themePreference.slice(1)} theme`
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Accent Color Section */}
          <div className="bg-[var(--bg-secondary)] p-4 rounded-xl pt-0">
            <h3 className="text-base font-semibold mb-4 text-[var(--text-primary)] flex items-center gap-2">
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
          <div className="bg-[var(--bg-secondary)] p-4 rounded-xl pt-0">
            <h3 className="text-base font-semibold mb-4 text-[var(--text-primary)] flex items-center gap-2">
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
