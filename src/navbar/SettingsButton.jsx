import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import { Info, LogIn, LogOut, Settings, User, UserPlus } from 'lucide-react';
import { useState } from 'react';

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

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-15 active:scale-95 relative"
            title="Settings"
          >
            <Settings size={24} />
            {hasFriendRequests && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] border-2 border-[var(--bg-primary)] z-10"></span>
            )}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[200px] rounded-lg p-1 w-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] z-[10000] animate-in fade-in0 zoom-in-95"
            sideOffset={5}
            align="end"
            collisionPadding={10}
          >
            <DropdownMenu.Item
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors font-semibold border-b border-[var(--border-primary)] mb-1"
            >
              <SettingsIcon size={16} />
              Settings
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onClick={onOpenAbout || (() => setShowAbout(true))}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
            >
              <Info size={16} />
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
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
            >
              <User size={16} />
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
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors relative"
            >
              <span className="relative">
                <UserPlus size={16} />
                {hasFriendRequests && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] border-2 border-[var(--bg-primary)]"></span>
                )}
              </span>
              Add Friend
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onClick={() => setShowFriendsModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
            >
              <User size={16} />
              Friends
            </DropdownMenu.Item>
            {isLoggedIn ? (
              <DropdownMenu.Item
                onClick={async () => {
                  await logout();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <LogOut size={16} />
                Log Out
              </DropdownMenu.Item>
            ) : (
              <DropdownMenu.Item
                onClick={loginWithGoogle}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <LogIn size={16} />
                Log In with Google
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
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </>
  );
};

export default SettingsButton; 