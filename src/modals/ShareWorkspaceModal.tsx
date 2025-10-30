import * as Select from '@radix-ui/react-select';

import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import React, { useState } from 'react';

import BaseModal from './BaseModal';

const SelectItem = React.forwardRef(({ children, className = '', ...props }, ref) => (
  <Select.Item
    ref={ref}
    className={
      'flex items-center gap-2 px-3 py-2 cursor-pointer select-none rounded-md text-[var(--text-primary)] data-[highlighted]:bg-[var(--accent-primary)] data-[highlighted]:text-white data-[state=checked]:font-semibold ' +
      className
    }
    {...props}
  >
    <Select.ItemIndicator>
      <CheckIcon className="mr-2 w-4 h-4 text-[var(--accent-primary)]" />
    </Select.ItemIndicator>
    {children}
  </Select.Item>
));

const ShareWorkspaceModal = ({ isOpen, onClose, workspaces = [], friends = [], onShare, currentUserId }) => {
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [selectedFriend, setSelectedFriend] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleShare = () => {
    if (!selectedWorkspace || !selectedFriend) {
      setError('Please select an workspace and a friend.');
      return;
    }
    setError('');
    if (onShare) {
      onShare(selectedWorkspace, selectedFriend, currentUserId, {
        onSuccess: () => {
          setSuccess('Area shared!');
          setSelectedWorkspace('');
          setSelectedFriend('');
        },
        onError: (msg) => setError(msg || 'Error sharing workspace'),
      });
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Share Area" maxWidth="max-w-md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--text-primary)]">Area</label>
          <Select.Root value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
            <Select.Trigger className="w-full px-3 py-2 rounded-lg border-2 border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center justify-between">
              <Select.Value placeholder="Select workspace" />
              <Select.Icon>
                <ChevronDownIcon className="w-5 h-5 text-[var(--text-secondary)]" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="z-[10001] bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg">
                <Select.Viewport className="p-1">
                  {workspaces.map(ws => (
                    <SelectItem key={ws.id} value={ws.id}>
                      <span>{ws.name}</span>
                    </SelectItem>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--text-primary)]">Friend</label>
          <Select.Root value={selectedFriend} onValueChange={setSelectedFriend}>
            <Select.Trigger className="w-full px-3 py-2 rounded-lg border-2 border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center justify-between">
              <Select.Value placeholder="Select friend" />
              <Select.Icon>
                <ChevronDownIcon className="w-5 h-5 text-[var(--text-secondary)]" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="z-[10001] bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg">
                <Select.Viewport className="p-1">
                  {friends.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      <img
                        src={f.avatar_url || '/public/assets/apple-touch-icon.png'}
                        alt={f.username || f.email || f.id}
                        className="w-6 h-6 rounded-full object-cover border border-[var(--accent-primary)] bg-[var(--bg-primary)] mr-2"
                      />
                      <span>{f.username || f.email || f.id}</span>
                      <span className="text-sm text-[var(--text-secondary)] ml-2">{f.email}</span>
                    </SelectItem>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
        <button
          className="w-full mt-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-semibold hover:bg-[var(--accent-primary)]/90"
          onClick={handleShare}
        >
          Share
        </button>
        {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
        {success && <div className="text-green-500 text-sm mt-1">{success}</div>}
      </div>
    </BaseModal>
  );
};

export default ShareWorkspaceModal; 