import React, { useEffect, useState } from 'react';

import BaseModal from './BaseModal';
import { X } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';

const AddFriendModal = ({ isOpen, onClose, onSendRequest, receivedRequests = [], sentRequests = [], onAccept, onReject, hasRequests, onRefreshRequests }) => {
  const [tab, setTab] = useState('send');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [userExists, setUserExists] = useState(undefined); // undefined: not checked, true: exists, false: not found
  const [checkingUser, setCheckingUser] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [visibleSentRequests, setVisibleSentRequests] = useState(sentRequests);

  // Check if user exists in DB when username changes
  useEffect(() => {
    let cancelled = false;
    const checkUser = async () => {
      if (username.trim().length < 3) {
        setUserExists(undefined);
        setCheckingUser(false);
        return;
      }
      setCheckingUser(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim())
        .maybeSingle();
      if (cancelled) return;
      setCheckingUser(false);
      if (error) {
        setUserExists(undefined);
        return;
      }
      setUserExists(!!data);
    };
    checkUser();
    return () => { cancelled = true; };
  }, [username]);

  // Keep visibleSentRequests in sync with sentRequests from parent
  useEffect(() => {
    setVisibleSentRequests(sentRequests);
  }, [sentRequests]);

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
          setRequestSent(true);
          setTimeout(() => setRequestSent(false), 2000);
        },
        onError: (msg) => setError(msg || 'Error sending request'),
      });
    }
  };

  const handleDeletePending = async (request) => {
    console.log('[DEBUG] handleDeletePending called for request:', request);
    setDeletingId(request.id);
    // Optimistic UI: remove from visibleSentRequests immediately
    setVisibleSentRequests(prev => prev.filter(r => r.id !== request.id));
    try {
      const { error, data } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', request.id);
      console.log('[DEBUG] supabase delete result:', { error, data });
      if (error) {
        setError('Error deleting request: ' + error.message);
        console.error('[DEBUG] Error deleting request:', error);
      } else {
        if (onRefreshRequests) {
          await onRefreshRequests();
        }
        console.log('[DEBUG] Request deleted successfully');
      }
    } catch (err) {
      setError('Unexpected error: ' + (err?.message || err));
      console.error('[DEBUG] Unexpected error in handleDeletePending:', err);
    } finally {
      setDeletingId(null);
      console.log('[DEBUG] handleDeletePending finished for request:', request);
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
          Pending{visibleSentRequests.length > 0 ? ` (${visibleSentRequests.length})` : ''}
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
            disabled={requestSent}
          />
          {checkingUser && username.trim().length >= 3 && (
            <div className="text-xs text-gray-500 mt-1">Checking username...</div>
          )}
          {userExists === false && username.trim().length >= 3 && !checkingUser && (
            <div className="text-xs text-red-600 mt-1">No user found with that username.</div>
          )}
          <button
            className="mt-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-semibold hover:bg-[var(--accent-primary)]/90 w-full disabled:opacity-60"
            onClick={handleSend}
            disabled={requestSent || userExists === false}
          >
            {requestSent ? 'Request Sent!' : 'Send Request'}
          </button>
          {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
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
          {visibleSentRequests.length === 0 ? (
            <div className="text-[var(--text-secondary)] text-center">No pending requests</div>
          ) : (
            visibleSentRequests.map((req, i) => (
              <div key={i} className="flex flex-row items-center bg-[var(--bg-secondary)] rounded-lg px-3 py-2 min-h-[2.5rem]">
                <div className="flex-1 flex items-center min-w-0">
                  <span className="text-[var(--text-primary)] font-medium whitespace-nowrap">{req.to_user?.username || req.to_user_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-secondary)] font-semibold capitalize text-right">{req.status}</span>
                  <button
                    className="p-1 rounded-full hover:bg-red-500/20 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                    onClick={() => handleDeletePending(req)}
                    disabled={deletingId === req.id}
                    title="Delete request"
                  >
                    {deletingId === req.id ? (
                      <span className="w-4 h-4 animate-spin border-2 border-red-500 border-t-transparent rounded-full inline-block"></span>
                    ) : (
                      <X size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </BaseModal>
  );
};

export default AddFriendModal; 