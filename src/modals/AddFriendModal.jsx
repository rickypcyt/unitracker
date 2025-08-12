import React, { useEffect, useState } from 'react';

import BaseModal from './BaseModal';
import { X } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useSelector } from 'react-redux';

const AddFriendModal = ({ isOpen, onClose, onSendRequest, receivedRequests = [], sentRequests = [], onAccept, onReject, hasRequests, onRefreshRequests }) => {
  const [tab, setTab] = useState('send');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [userExists, setUserExists] = useState(undefined); // undefined: not checked, true: exists, false: not found
  const [checkingUser, setCheckingUser] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);
  const [visibleSentRequests, setVisibleSentRequests] = useState(sentRequests);
  const { user } = useAuth();
  // Get friends from Redux if available
  const friends = useSelector(state => state?.friends?.friends || []);

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
    // Check if already a friend (case-insensitive)
    const alreadyFriend = friends.some(f => (f.username || '').toLowerCase() === username.trim().toLowerCase());
    if (alreadyFriend) {
      setError('This user is already your friend.');
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
    setDeletingIds(prev => [...prev, request.id]);
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
      setDeletingIds(prev => prev.filter(id => id !== request.id));
      console.log('[DEBUG] handleDeletePending finished for request:', request);
    }
  };

  const isSelfRequest = user && username.trim().length > 0 && username.trim().toLowerCase() === (user.username || '').toLowerCase();

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Add Friend" maxWidth="max-w-md">
      <div className="flex items-center justify-evenly gap-0 mb-2 w-full">
        <button
          className={`flex-1 text-center px-4 py-1 font-semibold ${tab === 'send' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'} focus:outline-none`}
          onClick={() => setTab('send')}
        >
          Send
        </button>
        <span className="text-[var(--border-primary)] font-bold">|</span>
        <button
          className={`flex-1 text-center px-4 py-1 font-semibold relative ${tab === 'received' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'} focus:outline-none`}
          onClick={() => setTab('received')}
        >
          <span className="relative inline-block">
            Received
            {receivedRequests.length > 0 && (
              <span className="absolute -top-2 -right-4 w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] border-2 border-[var(--bg-primary)]"></span>
            )}
          </span>
        </button>
        <span className="text-[var(--border-primary)] font-bold">|</span>
        <button
          className={`flex-1 text-center px-4 py-1 font-semibold relative ${tab === 'pending' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'} focus:outline-none`}
          onClick={() => setTab('pending')}
        >
          Sent{visibleSentRequests.filter(req => !deletingIds.includes(req.id)).length > 0 ? ` (${visibleSentRequests.filter(req => !deletingIds.includes(req.id)).length})` : ''}
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
            <div className="text-sm text-gray-500 mt-1">Checking username...</div>
          )}
          {userExists === false && username.trim().length >= 3 && !checkingUser && (
            <div className="text-sm text-red-600 mt-1">No user found with that username.</div>
          )}
          <button
            className="mt-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-semibold hover:bg-[var(--accent-primary)]/90 w-full disabled:opacity-60"
            onClick={handleSend}
            disabled={requestSent || userExists === false || isSelfRequest}
          >
            {requestSent ? 'Request Sent!' : 'Send Request'}
          </button>
          {isSelfRequest && (
            <div className="text-sm text-red-600 mt-1">You cannot send a friend request to yourself.</div>
          )}
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
                    className="px-2 py-1 rounded bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
                    onClick={() => onAccept && onAccept(req)}
                  >
                    Accept
                  </button>
                  <button
                    className="px-2 py-1 rounded bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
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
          {visibleSentRequests.filter(req => !deletingIds.includes(req.id)).length === 0 ? (
            <div className="text-[var(--text-secondary)] text-center">No pending requests</div>
          ) : (
            visibleSentRequests.filter(req => !deletingIds.includes(req.id)).map((req, i) => (
              <div key={i} className="flex flex-row items-center bg-[var(--bg-secondary)] rounded-lg px-3 py-2 min-h-[2.5rem]">
                <div className="flex-1 flex items-center min-w-0">
                  <span className="text-[var(--text-primary)] font-medium whitespace-nowrap">{req.to_user?.username || req.to_user_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--text-secondary)] font-semibold capitalize text-right">{req.status}</span>
                  <button
                    className="p-1 rounded-full hover:bg-red-500/20 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                    onClick={() => handleDeletePending(req)}
                    disabled={deletingIds.includes(req.id)}
                    title="Delete request"
                  >
                    {deletingIds.includes(req.id) ? (
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