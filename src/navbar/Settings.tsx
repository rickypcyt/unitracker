import type { AppDispatch, RootState } from '@/store/store';
import { LogIn, LogOut, Settings as SettingsIcon, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ACCENT_COLORS } from '@/utils/theme';
import DeleteCompletedModal from '@/modals/DeleteTasksPop';
import ManageAssignmentsModal from '@/modals/ManageAssignmentsModal';
import { deleteTask } from '@/store/actions/TaskActions';
import { toast } from 'react-toastify';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@supabase/supabase-js';
import useTheme from '@/hooks/useTheme';
import BaseModal from '@/modals/BaseModal';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { accentPalette, setAccentPalette } = useTheme();
  // Note: currentTheme and handleThemeChange are not used in this component
  const [showManageAssignments, setShowManageAssignments] = useState(false);
  const [showDeleteCompletedModal, setShowDeleteCompletedModal] = useState(false);
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const { isLoggedIn, loginWithGoogle, logout } = useAuth() as {
    isLoggedIn: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    user: User | null;
  };

  const handleDeleteCompletedTasks = () => {
    const completedTasks = tasks.filter(task => task.completed);
    completedTasks.forEach(task => {
      dispatch(deleteTask(task.id));
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
    </>
  );
};

export default Settings; 