import React, { useState } from 'react';

import BaseModal from './BaseModal';

const ShareWorkspaceModal = ({ isOpen, onClose, workspaces = [], friends = [], onShare, currentUserId }) => {
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [selectedFriend, setSelectedFriend] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleShare = () => {
    if (!selectedWorkspace || !selectedFriend) {
      setError('Please select a workspace and a friend.');
      return;
    }
    setError('');
    if (onShare) {
      onShare(selectedWorkspace, selectedFriend, currentUserId, {
        onSuccess: () => {
          setSuccess('Workspace shared!');
          setSelectedWorkspace('');
          setSelectedFriend('');
        },
        onError: (msg) => setError(msg || 'Error sharing workspace'),
      });
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Share Workspace" maxWidth="max-w-md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--text-primary)]">Workspace</label>
          <select
            className="w-full px-3 py-2 rounded-lg border-2 border-[var(--border-primary)] bg-[var(--bg-secondary)] focus:border-[var(--accent-primary)] focus:outline-none text-[var(--text-primary)]"
            value={selectedWorkspace}
            onChange={e => setSelectedWorkspace(e.target.value)}
          >
            <option value="">Select workspace</option>
            {workspaces.map(ws => (
              <option key={ws.id} value={ws.id}>{ws.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--text-primary)]">Friend</label>
          <div className="relative">
            <select
              className="w-full px-3 py-2 rounded-lg border-2 border-[var(--border-primary)] bg-[var(--bg-secondary)] focus:border-[var(--accent-primary)] focus:outline-none text-[var(--text-primary)] appearance-none"
              value={selectedFriend}
              onChange={e => setSelectedFriend(e.target.value)}
            >
              <option value="">Select friend</option>
              {friends.map(f => (
                <option key={f.id} value={f.id}>{f.username || f.email || f.id}</option>
              ))}
            </select>
            {selectedFriend && (
              <div className="flex items-center gap-2 mt-2">
                {(() => {
                  const f = friends.find(x => x.id === selectedFriend);
                  return f ? (
                    <>
                      <img src={f.avatar_url || '/public/assets/apple-touch-icon.png'} alt={f.username || f.email || f.id} className="w-8 h-8 rounded-full object-cover border border-[var(--accent-primary)]" />
                      <span className="font-medium text-[var(--text-primary)]">{f.username || f.email || f.id}</span>
                      <span className="text-xs text-[var(--text-secondary)]">{f.email}</span>
                    </>
                  ) : null;
                })()}
              </div>
            )}
          </div>
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