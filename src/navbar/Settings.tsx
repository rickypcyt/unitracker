import { AppDispatch, RootState } from '@/store/store';
import { LogIn, LogOut, Settings as SettingsIcon, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ACCENT_COLORS } from '@/utils/theme';
import DeleteCompletedModal from '@/modals/DeleteTasksPop';
import ManageAssignmentsModal from '@/modals/ManageAssignmentsModal';
import { deleteTask } from '@/store/actions/TaskActions';
import { toast } from 'react-toastify';
import { useAuth } from '@/hooks/useAuth';
import useTheme from '@/hooks/useTheme';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentTheme, handleThemeChange, accentPalette, setAccentPalette } = useTheme();
  const [showManageAssignments, setShowManageAssignments] = useState(false);
  const [showDeleteCompletedModal, setShowDeleteCompletedModal] = useState(false);
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const { isLoggedIn, loginWithGoogle, logout } = useAuth();

  const handleDeleteCompletedTasks = () => {
    const completedTasks = tasks.filter(task => task.completed);
    completedTasks.forEach(task => {
      dispatch(deleteTask(task.id));
    });
    setShowDeleteCompletedModal(false);
  };

  const handleLogout = async () => {
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
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]"
        onClick={onClose}
      >
        <div 
          className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] w-full max-w-md mx-4 p-6"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Settings</h2>
            <button
              onClick={onClose}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
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
        </div>
      </div>

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