import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import { Info, LogIn, LogOut, Settings, User, UserPlus } from 'lucide-react';
import { useState } from 'react';
import useTheme from '@/hooks/useTheme';

import AboutModal from '@/modals/AboutModal';
import AddFriendModal from '@/modals/AddFriendModal';
import FriendsModal from '@/modals/FriendsModal';
import { Settings as SettingsIcon } from 'lucide-react';
import SettingsModal from '@/modals/Settings';
import UserModal from '@/modals/UserModal';

const SettingsButton = ({
  isLoggedIn,
  loginWithGoogle,
  logout,
  hasFriendRequests,
  onOpenAbout,
  receivedRequests = [],
  sentRequests = [],
  onSendRequest,
  onAccept,
  onReject,
  friends = []
}) => {
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { currentTheme, handleThemeChange } = useTheme();

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-15 active:scale-95 relative antialiased"
            title="Settings"
          >
            <Settings className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            {hasFriendRequests && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] border-2 border-[var(--bg-primary)] z-10"></span>
            )}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[180px] sm:min-w-[220px] max-w-[90vw] rounded-lg p-1 w-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] z-[10000] animate-in fade-in0 zoom-in-95 antialiased text-[12px] sm:text-sm md:text-sm lg:text-base"
            sideOffset={5}
            align="end"
            collisionPadding={10}
          >
            <DropdownMenu.Item
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-2 px-3 py-2.5 text-[12px] sm:text-sm md:text-sm lg:text-base text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors font-semibold border-b border-[var(--border-primary)] mb-1"
            >
              <SettingsIcon className="w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5" />
              Settings
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onClick={onOpenAbout || (() => setShowAbout(true))}
              className="flex items-center gap-2 px-3 py-2.5 text-[12px] sm:text-sm md:text-sm lg:text-base text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
            >
              <Info className="w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5" />
              About
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onClick={() => {
                if (!isLoggedIn) {
                  loginWithGoogle();
                } else {
                  setShowUserModal(true);
                }
              }}
              className="flex items-center gap-2 px-3 py-2.5 text-[12px] sm:text-[13px] md:text-sm lg:text-base text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
            >
              <User className="w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5" />
              User
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onClick={() => {
                if (!isLoggedIn) {
                  loginWithGoogle();
                } else {
                  setShowAddFriendModal(true);
                }
              }}
              className="flex items-center gap-2 px-3 py-2.5 text-[12px] sm:text-sm md:text-sm lg:text-base text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors relative"
            >
              <span className="relative">
                <UserPlus className="w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                {hasFriendRequests && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] border-2 border-[var(--bg-primary)]"></span>
                )}
              </span>
              <span className="break-words">Add Friend</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onClick={() => setShowFriendsModal(true)}
              className="flex items-center gap-2 px-3 py-2.5 text-[12px] sm:text-[13px] md:text-sm lg:text-base text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
            >
              <User className="w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5" />
              <span className="break-words">Friends</span>
            </DropdownMenu.Item>
            {isLoggedIn ? (
              <DropdownMenu.Item
                onClick={async () => {
                  await logout();
                }}
                className="flex items-center gap-2 px-3 py-2.5 text-[12px] sm:text-sm md:text-sm lg:text-base text-red-500 hover:text-red-600 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <LogOut className="w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                Log Out
              </DropdownMenu.Item>
            ) : (
              <DropdownMenu.Item
                onClick={loginWithGoogle}
                className="flex items-center gap-2 px-3 py-2.5 text-[12px] sm:text-sm md:text-sm lg:text-base text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <LogIn className="w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                <span className="break-words">Log In with Google</span>
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {/* Modals */}
      <UserModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} />
      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onSendRequest={onSendRequest}
        receivedRequests={receivedRequests}
        sentRequests={sentRequests}
        onAccept={onAccept}
        onReject={onReject}
        hasRequests={hasFriendRequests}
      />
      <FriendsModal
        isOpen={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
        friends={friends}
        onRemoveFriend={undefined}
      />
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        currentTheme={currentTheme}
        handleThemeChange={handleThemeChange}
      />
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </>
  );
};

export default SettingsButton; 