import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import { Info, LogIn, LogOut, Settings, User, UserPlus } from 'lucide-react';
import React, { useState } from 'react';

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
  user,
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
      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[10001] flex items-center justify-center p-4">
          <div className="bg-[var(--bg-secondary)] rounded-lg p-8 max-w-lg w-full relative shadow-xl">
            <button
              onClick={() => setShowAbout(false)}
              className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl font-bold focus:outline-none"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-center text-[var(--text-primary)] mb-8">About Uni Tracker</h2>
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">The Story</h3>
              <p className="text-base text-[var(--text-secondary)]">
                Uni Tracker was born in December 2024 from a simple idea: to create a better way to manage university assignments and tasks. As a student myself, I noticed the need for a tool that could help organize academic work more effectively while being intuitive and user-friendly.
              </p>
            </div>
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">About Me</h3>
              <p className="text-base text-[var(--text-secondary)]">
                Hi! I'm Ricky, the creator of Uni Tracker. I'm passionate about building tools that make life easier for students. This project represents my commitment to improving the academic experience through technology.
              </p>
            </div>
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Get in Touch</h3>
              <p className="text-base text-[var(--text-secondary)] mb-2">
                I'm always open to feedback, suggestions, or just a friendly chat about the app. Whether you've found a bug, have a feature request, or want to share your experience, I'd love to hear from you!
              </p>
              <a href="mailto:rickypcyt@gmail.com" className="flex items-center gap-2 text-[var(--accent-primary)] text-base font-medium hover:underline">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-.876 1.797l-7.5 5.625a2.25 2.25 0 01-2.748 0l-7.5-5.625A2.25 2.25 0 012.25 6.993V6.75" />
                </svg>
                rickypcyt@gmail.com
              </a>
            </div>
            <div className="border-t border-[var(--border-primary)] pt-4 mt-4 text-center text-[var(--text-secondary)]">
              Thank you for using Uni Tracker! Your support and feedback help make this app better every day.
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsButton; 