import { BookOpen, LogIn, LogOut, Monitor, Moon, Settings as SettingsIcon, Sun, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import { ACCENT_COLORS } from '@/utils/theme';
import BaseModal from '@/modals/BaseModal';
import DeleteCompletedModal from '@/modals/DeleteTasksPop';
import ManageAssignmentsModal from '@/modals/ManageAssignmentsModal';
import StudySessions from '@/pages/stats/StudySessions';
import type { User } from '@supabase/supabase-js';
import { toast } from 'react-toastify';
import { useAppStore } from '@/store/appStore';
import { useAuth } from '@/hooks/useAuth';
import useTheme from '@/hooks/useTheme';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const { 
    accentPalette, 
    setAccentPalette,
    themePreference,
    handleThemeChange,
  } = useTheme();
  const [showManageAssignments, setShowManageAssignments] = useState(false);
  const [showDeleteCompletedModal, setShowDeleteCompletedModal] = useState(false);
  const [showStudySessions, setShowStudySessions] = useState(false);
  const tasks = useAppStore((state) => state.tasks.tasks);
  const { isLoggedIn, loginWithGoogle, logout } = useAuth() as {
    isLoggedIn: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    user: User | null;
  };
  const deleteTask = useAppStore((state) => state.deleteTask);

  const handleDeleteCompletedTasks = () => {
    const completedTasks = tasks.filter(task => task.completed);
    completedTasks.forEach(task => {
      deleteTask(task.id);
    });
    setShowDeleteCompletedModal(false);
  };

  const handleLogout = async () => {
    try {
      if (typeof logout === 'function') {
        await logout();
        toast.success('You have been logged out.', {
          containerId: 'main-toast-container',
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to log out. Please try again.');
    }
  };

  return (
    <>
      <BaseModal isOpen={isOpen} onClose={onClose} title="Settings" maxWidth="max-w-md" className="!p-0">
        <div className="space-y-6 p-6">
            {/* Theme Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Theme</h3>
              
              {/* Three-position theme selector */}
              <div className="bg-[var(--bg-secondary)] p-4 rounded-lg">
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
                  <div className="w-full h-8 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-full relative overflow-hidden">
                    {/* Slider track background */}
                    <div
                      className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-in-out"
                      style={{
                        backgroundColor: accentPalette,
                        width: "calc(33.333% - 4px)",
                        left:
                          themePreference === "light"
                            ? "2px"
                            : themePreference === "auto"
                            ? "calc(33.333% + 1px)"
                            : "calc(66.666% + 0px)",
                      }}
                    />

                    {/* Three clickable workspaces */}
                    <button
                      onClick={() => handleThemeChange("light")}
                      className="absolute left-0 top-0 w-1/3 h-full flex items-center justify-center transition-colors"
                      aria-label="Light theme"
                    >
                      <Sun
                        size={16}
                        className={`${
                          themePreference === "light"
                            ? "text-white"
                            : "text-[var(--text-secondary)]"
                        }`}
                      />
                    </button>

                    <button
                      onClick={() => handleThemeChange("auto")}
                      className="absolute left-1/3 top-0 w-1/3 h-full flex items-center justify-center transition-colors"
                      aria-label="System theme"
                    >
                      <Monitor
                        size={16}
                        className={`${
                          themePreference === "auto"
                            ? "text-white"
                            : "text-[var(--text-secondary)]"
                        }`}
                      />
                    </button>

                    <button
                      onClick={() => handleThemeChange("dark")}
                      className="absolute right-0 top-0 w-1/3 h-full flex items-center justify-center transition-colors"
                      aria-label="Dark theme"
                    >
                      <Moon
                        size={16}
                        className={`${
                          themePreference === "dark"
                            ? "text-white"
                            : "text-[var(--text-secondary)]"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Accent Color Section */}
              <div className="bg-[var(--bg-secondary)] p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-3 text-[var(--text-primary)]">Accent Color</h4>
                <div className="grid grid-cols-6 gap-2">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setAccentPalette(color.value)}
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
            </div>

            {/* Auth Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Account</h3>
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-red-500 bg-[var(--bg-secondary)] hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2 justify-center"
                >
                  <LogOut size={20} /> Log Out
                </button>
              ) : (
                <button
                  onClick={loginWithGoogle}
                  className="w-full px-4 py-2 text-[var(--accent-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition-colors flex items-center gap-2 justify-center"
                >
                  <LogIn size={20} /> Log In with Google
                </button>
              )}
            </div>

            {/* Task Management Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Task Management</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowManageAssignments(true)}
                  className="w-full px-4 py-2 text-[var(--text-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors flex items-center justify-between"
                >
                  <span>Manage Assignments</span>
                  <SettingsIcon size={20} />
                </button>
                <button
                  onClick={() => setShowDeleteCompletedModal(true)}
                  className="w-full px-4 py-2 text-red-500 bg-[var(--bg-secondary)] hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-between"
                >
                  <span>Delete Completed Tasks</span>
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            {/* Study Sessions Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Study Sessions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowStudySessions(true)}
                  className="w-full px-4 py-2 text-[var(--text-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors flex items-center justify-between"
                >
                  <span>Manage Sessions</span>
                  <BookOpen size={20} />
                </button>
              </div>
            </div>
        </div>
      </BaseModal>

      {showManageAssignments && (
        <ManageAssignmentsModal
          isOpen={showManageAssignments}
          onClose={() => setShowManageAssignments(false)}
        />
      )}

      {showDeleteCompletedModal && (
        <DeleteCompletedModal
          onClose={() => setShowDeleteCompletedModal(false)}
          onConfirm={handleDeleteCompletedTasks}
          message="Are you sure you want to delete all completed tasks? This action cannot be undone."
          confirmButtonText="Delete Completed Tasks"
        />
      )}

      {showStudySessions && (
        <BaseModal 
          isOpen={showStudySessions} 
          onClose={() => setShowStudySessions(false)}
          title="Study Sessions"
          maxWidth="max-w-4xl"
          className="!p-0"
        >
          <div className="p-6">
            <StudySessions />
          </div>
        </BaseModal>
      )}
    </>
  );
};

export default Settings; 