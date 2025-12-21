import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import React, { useState } from 'react';

import BaseModal from './BaseModal';
import { ChevronDown } from 'lucide-react';
import { Workspace } from '@/types/workspace';

interface ShareWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces?: Workspace[];
  friends?: any[];
  onShare?: (workspaceId: string, recipient: string, options: {
    onSuccess: () => void;
    onError: (msg?: string) => void;
  }) => void;
  onAddFriend?: () => void;
  currentUserId: string;
}

const ShareWorkspaceModal: React.FC<ShareWorkspaceModalProps> = ({ isOpen, onClose, workspaces = [], friends = [], onShare, onAddFriend, currentUserId }) => {
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleShare = () => {
    if (!selectedWorkspace) {
      setError('Please select a workspace to share.');
      return;
    }
    
    if (!selectedFriend) {
      setError('Please select a friend to share with.');
      return;
    }
    
    if (!currentUserId) {
      setError('You must be logged in to share workspaces.');
      return;
    }

    setError('');
    if (onShare) {
      const recipient = selectedFriend.username || selectedFriend.email || selectedFriend.id;
      onShare(selectedWorkspace.id.toString(), recipient, {
        onSuccess: () => {
          setSuccess('Workspace shared successfully!');
          setSelectedWorkspace(null);
          setSelectedFriend(null);
        },
        onError: (msg?: string) => setError(msg || 'Error sharing workspace'),
      });
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Share Workspace" maxWidth="max-w-md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--text-primary)]">
            Workspace to Share
          </label>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="w-full px-3 py-2 rounded-lg border-2 border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center justify-between hover:border-[var(--accent-primary)] transition-colors focus:outline-none focus:border-[var(--accent-primary)]"
              >
                <span className={selectedWorkspace ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}>
                  {selectedWorkspace ? selectedWorkspace.name : 'Select a workspace'}
                </span>
                <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[200px] max-h-[300px] rounded-lg p-1 border border-[var(--border-primary)] bg-[var(--bg-primary)] z-[10001] animate-in fade-in zoom-in-95 antialiased overflow-y-auto"
                sideOffset={5}
                align="start"
                collisionPadding={10}
              >
                {workspaces.map(ws => (
                  <DropdownMenu.Item
                    key={ws.id}
                    onClick={() => setSelectedWorkspace(ws)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer outline-none transition-colors ${
                      selectedWorkspace?.id === ws.id
                        ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] hover:border-2 hover:border-[var(--accent-primary)] border border-transparent'
                    }`}
                  >
                    <span>{ws.name}</span>
                    {selectedWorkspace?.id === ws.id && (
                      <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] ml-auto" />
                    )}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--text-primary)]">
            Share With
          </label>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="w-full px-3 py-2 rounded-lg border-2 border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center justify-between hover:border-[var(--accent-primary)] transition-colors focus:outline-none focus:border-[var(--accent-primary)]"
              >
                <span className={selectedFriend ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}>
                  {selectedFriend 
                    ? selectedFriend.username || selectedFriend.email || selectedFriend.id
                    : friends.length > 0 
                      ? 'Select a friend' 
                      : 'No friends available'
                  }
                </span>
                <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[200px] max-h-[300px] rounded-lg p-1 border border-[var(--border-primary)] bg-[var(--bg-primary)] z-[10001] animate-in fade-in zoom-in-95 antialiased overflow-y-auto"
                sideOffset={5}
                align="start"
                collisionPadding={10}
              >
                {friends.length > 0 ? (
                  friends.map(friend => (
                    <DropdownMenu.Item
                      key={friend.id}
                      onClick={() => setSelectedFriend(friend)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer outline-none transition-colors ${
                        selectedFriend?.id === friend.id
                          ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] hover:border-2 hover:border-[var(--accent-primary)] border border-transparent'
                      }`}
                    >
                      <img
                        src={friend.avatar_url || '/public/assets/apple-touch-icon.png'}
                        alt={friend.username || friend.email || friend.id}
                        className="w-6 h-6 rounded-full object-cover border border-[var(--accent-primary)] bg-[var(--bg-primary)]"
                      />
                      <span>{friend.username || friend.email || friend.id}</span>
                      {selectedFriend?.id === friend.id && (
                        <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] ml-auto" />
                      )}
                    </DropdownMenu.Item>
                  ))
                ) : (
                  <DropdownMenu.Item
                    onClick={onAddFriend || (() => {})}
                    className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer outline-none transition-colors text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] hover:border-2 hover:border-[var(--accent-primary)] border border-transparent"
                  >
                    <span>Add a friend to share workspace</span>
                  </DropdownMenu.Item>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
        
        <div className="flex justify-end">
          <button
            className="px-4 py-2 rounded-lg text-[var(--accent-primary)] border-2 border-[var(--accent-primary)] bg-transparent font-semibold hover:bg-[var(--accent-primary)]/10 transition-colors"
            onClick={handleShare}
          >
            Share Workspace
          </button>
        </div>
        
        {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
        {success && <div className="text-green-500 text-sm mt-1">{success}</div>}
      </div>
    </BaseModal>
  );
};

export default ShareWorkspaceModal; 