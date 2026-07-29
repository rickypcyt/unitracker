import {
  CheckCircle,
  Clock,
  Database,
  Info,
  List,
  Monitor,
  Moon,
  Palette,
  Sparkles,
  Sun,
  User,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import { ACCENT_COLORS } from "@/utils/theme";
import AddFriendModal from "@/modals/AddFriendModal";
import BaseModal from "./BaseModal";
import DataExportImportPanel from "@/components/DataExportImportPanel";
import FriendsModal from "@/modals/FriendsModal";
import ManageAssignmentsModal from "@/modals/ManageAssignmentsModal";
import ManageCompletedTasksModal from "@/modals/ManageCompletedTasksModal";
import ManageSessionsModal from "@/modals/ManageSessionsModal";
import TimezoneSelector from "@/components/TimezoneSelector";
import UserModal from "@/modals/UserModal";
import { changelogData } from "@/data/changelog";
import { useAuth } from "@/hooks/useAuth";
import { useChangelog } from "@/hooks/useChangelog";
import useTheme from "@/hooks/useTheme";

interface AccentColor {
  name: string;
  value: string;
  class: string;
}

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  friends?: any[];
  workspaces?: any[];
  onRemoveFriend?: (friend: { id: string; username?: string | null; email?: string | null }) => Promise<void>;
  currentUserId?: string;
}

type Tab = "appearance" | "account" | "data" | "whatsNew" | "about";

const TAB_CONFIG: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "account", label: "Account", icon: User },
  { id: "data", label: "Data", icon: Database },
  { id: "whatsNew", label: "What's New", icon: Sparkles },
  { id: "about", label: "About", icon: Info },
];

const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  friends = [],
  workspaces = [],
  onRemoveFriend,
  currentUserId,
}) => {
  const {
    accentPalette,
    setAccentPalette,
    themePreference,
    handleThemeChange,
    currentTheme,
  } = useTheme();
  const { user, isLoggedIn, loginWithGoogle, logout } = useAuth() as {
    user: any;
    isLoggedIn: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
  };
  const effectiveUserId = currentUserId ?? user?.id ?? "";
  const [activeTab, setActiveTab] = useState<Tab>("appearance");
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showManageAssignmentsModal, setShowManageAssignmentsModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showCompletedTasksModal, setShowCompletedTasksModal] = useState(false);
  const { hasNewChanges, markAsSeen } = useChangelog();

  useEffect(() => {
    if (isOpen && activeTab === "whatsNew" && markAsSeen) {
      markAsSeen();
    }
  }, [isOpen, activeTab, markAsSeen]);

  const handleAccentColorChange = (color: string) => {
    setAccentPalette(color);
    localStorage.setItem("accentPalette", color);
    document.documentElement.style.setProperty("--accent-primary", color);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!isOpen) return null;

  const selectedAccentName = ACCENT_COLORS.find((c) => c.value === accentPalette)?.name || "Custom";

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title=""
        maxWidth="max-w-2xl"
        padding="none"
        showHeader={false}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="relative flex items-center justify-center px-6 pt-5 pb-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Settings
            </h2>
            <button
              onClick={onClose}
              className="absolute right-4 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 px-6 pb-4 border-b border-[var(--border-primary)]/50">
            {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                  activeTab === id
                    ? "bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50"
                }`}
              >
                <Icon size={16} />
                {label}
                {id === "whatsNew" && hasNewChanges && (
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "appearance" && (
              <div className="space-y-5">
                {/* Theme selector */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    {themePreference === "auto" ? <Monitor size={18} className="text-[var(--text-secondary)]" /> : currentTheme === "dark" ? <Moon size={18} className="text-[var(--text-secondary)]" /> : <Sun size={18} className="text-[var(--text-secondary)]" />}
                    <span className="text-sm font-medium text-[var(--text-primary)]">Theme</span>
                  </div>
                  <div className="relative">
                    <div className="w-full h-9 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg relative overflow-hidden">
                      <div
                        className="absolute top-1 bottom-1 rounded-md transition-all duration-300 ease-in-out"
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
                      <button
                        onClick={() => handleThemeChange("light")}
                        className="absolute left-0 top-0 w-1/3 h-full flex items-center justify-center gap-1.5 transition-colors"
                        aria-label="Light theme"
                      >
                        <Sun size={15} className={themePreference === "light" ? "text-white" : "text-[var(--text-secondary)]"} />
                        <span className={`text-xs ${themePreference === "light" ? "text-white" : "text-[var(--text-secondary)]"}`}>Light</span>
                      </button>
                      <button
                        onClick={() => handleThemeChange("auto")}
                        className="absolute left-1/3 top-0 w-1/3 h-full flex items-center justify-center gap-1.5 transition-colors"
                        aria-label="System theme"
                      >
                        <Monitor size={15} className={themePreference === "auto" ? "text-white" : "text-[var(--text-secondary)]"} />
                        <span className={`text-xs ${themePreference === "auto" ? "text-white" : "text-[var(--text-secondary)]"}`}>System</span>
                      </button>
                      <button
                        onClick={() => handleThemeChange("dark")}
                        className="absolute right-0 top-0 w-1/3 h-full flex items-center justify-center gap-1.5 transition-colors"
                        aria-label="Dark theme"
                      >
                        <Moon size={15} className={themePreference === "dark" ? "text-white" : "text-[var(--text-secondary)]"} />
                        <span className={`text-xs ${themePreference === "dark" ? "text-white" : "text-[var(--text-secondary)]"}`}>Dark</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Accent color */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Palette size={18} className="text-[var(--text-secondary)]" />
                      <span className="text-sm font-medium text-[var(--text-primary)]">Accent Color</span>
                    </div>
                    <span className="text-xs text-[var(--text-secondary)]">{selectedAccentName}</span>
                  </div>
                  <div className="grid grid-cols-9 gap-2">
                    {ACCENT_COLORS.map((color: AccentColor) => (
                      <button
                        key={color.value}
                        onClick={() => handleAccentColorChange(color.value)}
                        className={`relative aspect-square rounded-lg transition-all ${
                          accentPalette === color.value
                            ? "ring-2 ring-[var(--text-primary)] ring-offset-2 ring-offset-[var(--bg-primary)] scale-110"
                            : "hover:scale-105 hover:opacity-90"
                        } ${color.class}`}
                        aria-label={`Select ${color.name} accent color`}
                        title={color.name}
                      >
                        <span className="sr-only">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timezone */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={18} className="text-[var(--text-secondary)]" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">Timezone</span>
                  </div>
                  <TimezoneSelector showCurrentTime={true} className="w-full" />
                </div>
              </div>
            )}

            {activeTab === "account" && (
              <div className="space-y-4">
                {/* User info card */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-secondary)]">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white font-semibold text-sm">
                    {isLoggedIn && user?.email ? user.email[0].toUpperCase() : "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {isLoggedIn ? user?.email || "Logged in" : "Not signed in"}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {isLoggedIn ? "Google account" : "Sign in to sync your data"}
                    </p>
                  </div>
                  {isLoggedIn ? (
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      Log Out
                    </button>
                  ) : (
                    <button
                      onClick={loginWithGoogle}
                      className="px-3 py-1.5 text-xs font-medium text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 rounded-lg hover:bg-[var(--accent-primary)]/10 transition-colors"
                    >
                      Log In
                    </button>
                  )}
                </div>

                {/* Action buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => setShowUserModal(true)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/80 transition-colors flex items-center gap-3 text-sm"
                  >
                    <User size={16} className="text-[var(--text-secondary)]" />
                    User Profile
                  </button>
                  <button
                    onClick={() => setShowAddFriendModal(true)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/80 transition-colors flex items-center gap-3 text-sm"
                  >
                    <Users size={16} className="text-[var(--text-secondary)]" />
                    Add Friends
                  </button>
                  <button
                    onClick={() => setShowFriendsModal(true)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/80 transition-colors flex items-center gap-3 text-sm"
                  >
                    <Users size={16} className="text-[var(--text-secondary)]" />
                    Manage Friends
                  </button>
                </div>
              </div>
            )}

            {activeTab === "data" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <button
                    onClick={() => setShowManageAssignmentsModal(true)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/80 transition-colors flex items-center gap-3 text-sm"
                  >
                    <List size={16} className="text-[var(--text-secondary)]" />
                    Manage Assignments
                  </button>
                  <button
                    onClick={() => setShowSessionsModal(true)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/80 transition-colors flex items-center gap-3 text-sm"
                  >
                    <Clock size={16} className="text-[var(--text-secondary)]" />
                    Manage Study Sessions
                  </button>
                  <button
                    onClick={() => setShowCompletedTasksModal(true)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/80 transition-colors flex items-center gap-3 text-sm"
                  >
                    <CheckCircle size={16} className="text-[var(--text-secondary)]" />
                    Manage Completed Tasks
                  </button>
                </div>

                <div className="border-t border-[var(--border-primary)]/50 pt-4">
                  <DataExportImportPanel />
                </div>
              </div>
            )}

            {activeTab === "whatsNew" && (
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {changelogData.map((entry, index) => (
                  <div key={index} className="border border-[var(--border-primary)] rounded-lg p-4 bg-[var(--bg-secondary)]/30">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-[var(--text-primary)]">{entry.date}</h4>
                      <span className="text-xs text-[var(--text-secondary)]">{entry.time}</span>
                    </div>
                    <div className="space-y-3">
                      {entry.changes.added && entry.changes.added.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-green-600 dark:text-green-400 mb-1.5 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full" />
                            Added
                          </h5>
                          <ul className="space-y-0.5 ml-0">
                            {entry.changes.added.map((change, i) => (
                              <li key={i} className="text-sm text-[var(--text-secondary)]">- {change}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {entry.changes.improved && entry.changes.improved.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1.5 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
                            Improved
                          </h5>
                          <ul className="space-y-0.5 ml-0">
                            {entry.changes.improved.map((change, i) => (
                              <li key={i} className="text-sm text-[var(--text-secondary)]">- {change}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {entry.changes.fixed && entry.changes.fixed.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1.5 flex items-center gap-2">
                            <span className="w-2 h-2 bg-orange-600 dark:bg-orange-400 rounded-full" />
                            Fixed
                          </h5>
                          <ul className="space-y-0.5 ml-0">
                            {entry.changes.fixed.map((change, i) => (
                              <li key={i} className="text-sm text-[var(--text-secondary)]">- {change}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {entry.changes.soon && entry.changes.soon.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1.5 flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full" />
                            Coming Soon
                          </h5>
                          <ul className="space-y-0.5 ml-0">
                            {entry.changes.soon.map((change, i) => (
                              <li key={i} className="text-sm text-[var(--text-secondary)]">- {change}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {entry.changes.removed && entry.changes.removed.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-red-600 dark:text-red-400 mb-1.5 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full" />
                            Removed
                          </h5>
                          <ul className="space-y-0.5 ml-0">
                            {entry.changes.removed.map((change, i) => (
                              <li key={i} className="text-sm text-[var(--text-secondary)] line-through">{change}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "about" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold mb-2 text-[var(--text-primary)]">The Story</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    UniTracker was born in December 2024 from a simple idea: to create a better way to manage university assignments and tasks. As a student myself, I noticed the need for a tool that could help organize academic work more effectively while being intuitive and user-friendly.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-bold mb-2 text-[var(--text-primary)]">About Me</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Hi! I'm Ricky, the creator of UniTracker. I'm passionate about building tools that make life easier for students. This project represents my commitment to improving the academic experience through technology.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-bold mb-2 text-[var(--text-primary)]">Get in Touch</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2">
                    I'm always open to feedback, suggestions, or just a friendly chat about the app. Whether you've found a bug, have a feature request, or want to share your experience, I'd love to hear from you!
                  </p>
                  <a
                    href="mailto:info@unitracker.me"
                    className="flex items-center gap-2 text-[var(--accent-primary)] text-sm font-medium hover:underline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-.876 1.797l-7.5 5.625a2.25 2.25 0 01-2.748 0l-7.5-5.625A2.25 2.25 0 012.25 6.993V6.75" />
                    </svg>
                    info@unitracker.me
                  </a>
                </div>
                <div className="border-t border-[var(--border-primary)] pt-4 text-center text-xs text-[var(--text-secondary)]">
                  Thank you for using UniTracker! Your support and feedback help make this app better!
                </div>
              </div>
            )}
          </div>
        </div>
      </BaseModal>

      {/* Sub-modals */}
      <ManageAssignmentsModal isOpen={showManageAssignmentsModal} onClose={() => setShowManageAssignmentsModal(false)} />
      <ManageSessionsModal isOpen={showSessionsModal} onClose={() => setShowSessionsModal(false)} />
      <UserModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} />
      <AddFriendModal isOpen={showAddFriendModal} onClose={() => setShowAddFriendModal(false)} />
      <FriendsModal
        isOpen={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
        friends={friends}
        availableWorkspaces={workspaces}
        {...(effectiveUserId && { currentUserId: effectiveUserId })}
        {...(onRemoveFriend && { onRemoveFriend })}
      />
      <ManageCompletedTasksModal isOpen={showCompletedTasksModal} onClose={() => setShowCompletedTasksModal(false)} />
    </>
  );
};

export default Settings;
