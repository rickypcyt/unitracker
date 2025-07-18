import React, { useState } from 'react';

import BaseModal from './BaseModal';

const AddFriendModal = ({ isOpen, onClose, onSendRequest, receivedRequests = [], sentRequests = [], onAccept, onReject, hasRequests }) => {
  const [tab, setTab] = useState('send');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSend = () => {
    if (!username.trim()) {
      setError('Enter a username');
      return;
    }
    setError('');
    setSuccess('');
    if (onSendRequest) {
      onSendRequest(username.trim(), {
        onSuccess: () => {
          setSuccess('Request sent!');
          setUsername('');
        },
        onError: (msg) => setError(msg || 'Error sending request'),
      });
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Add Friend" maxWidth="max-w-md">
      <div className="flex items-center justify-center gap-2 mb-2">
        <button
          className={`px-4 py-1 font-semibold ${tab === 'send' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'} focus:outline-none`}
          onClick={() => setTab('send')}
        >
          Send
        </button>
        <span className="text-[var(--border-primary)] font-bold">|</span>
        <button
          className={`px-4 py-1 font-semibold ${tab === 'received' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'} focus:outline-none`}
          onClick={() => setTab('received')}
        >
          Received
        </button>
        <span className="text-[var(--border-primary)] font-bold">|</span>
        <button
          className={`px-4 py-1 font-semibold ${tab === 'pending' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'} focus:outline-none`}
          onClick={() => setTab('pending')}
        >
          Pending
        </button>
      </div>
      {tab === 'send' && (
        <div className="w-full flex flex-col items-center gap-2">
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Friend's username"
            className="w-full px-3 py-2 rounded-lg border-2 border-[var(--border-primary)] bg-[var(--bg-secondary)] focus:border-[var(--accent-primary)] focus:outline-none text-[var(--text-primary)]"
            autoFocus
          />
          <button
            className="mt-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-semibold hover:bg-[var(--accent-primary)]/90 w-full"
            onClick={handleSend}
          >
            Send Request
          </button>
          {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
          {success && <div className="text-green-500 text-sm mt-1">{success}</div>}
        </div>
      )}
      {tab === 'received' && (
        <div className="w-full flex flex-col gap-2 py-4">
          {receivedRequests.length === 0 ? (
            <div className="text-[var(--text-secondary)] text-center">No received requests</div>
          ) : (
            receivedRequests.map((req, i) => (
              <div key={i} className="flex items-center justify-between bg-[var(--bg-secondary)] rounded-lg px-3 py-2">
                <span className="text-[var(--text-primary)] font-medium">{req.from_user?.username || req.from_user_id}</span>
                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 rounded bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
                    onClick={() => onAccept && onAccept(req)}
                  >
                    Accept
                  </button>
                  <button
                    className="px-2 py-1 rounded bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                    onClick={() => onReject && onReject(req)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {tab === 'pending' && (
        <div className="w-full flex flex-col gap-2 py-4">
          {sentRequests.length === 0 ? (
            <div className="text-[var(--text-secondary)] text-center">No pending requests</div>
          ) : (
            sentRequests.map((req, i) => (
              <div key={i} className="flex items-center justify-between bg-[var(--bg-secondary)] rounded-lg px-3 py-2">
                <span className="text-[var(--text-primary)] font-medium">{req.to_user?.username || req.to_user_id}</span>
                <span className="text-xs text-[var(--text-secondary)] font-semibold capitalize">{req.status}</span>
              </div>
            ))
          )}
        </div>
      )}
    </BaseModal>
  );
};

export default AddFriendModal; 