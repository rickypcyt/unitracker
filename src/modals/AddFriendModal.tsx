import { useEffect, useState } from 'react';

import BaseModal from './BaseModal';
import { X } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  from_user?: {
    id: string;
    username?: string;
  };
  to_user?: {
    id: string;
    username?: string;
  };
}

interface Friend {
  id: string;
  username?: string;
  email?: string;
}

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendRequest?: (username: string, options: { onSuccess: () => void; onError: (message?: string) => void }) => void;
  receivedRequests?: FriendRequest[];
  sentRequests?: FriendRequest[];
  onAccept?: (request: FriendRequest) => void;
  onReject?: (request: FriendRequest) => void;
  onRefreshRequests?: () => Promise<void>;
}

const normalizeProfile = (raw: any): FriendRequest['from_user'] | undefined => {
  const profile = Array.isArray(raw) ? raw[0] : raw;
  if (!profile) {
    return undefined;
  }

  return {
    id: String(profile.id),
    username: typeof profile.username === 'string' ? profile.username : undefined,
  };
};

const haveRequestsChanged = (prev: FriendRequest[], next: FriendRequest[]): boolean => {
  if (prev === next) {
    return false;
  }

  if (prev.length !== next.length) {
    return true;
  }

  const prevMap = new Map(prev.map((req) => [req.id, `${req.status}|${req.to_user?.username ?? ''}|${req.from_user?.username ?? ''}`]));

  for (const req of next) {
    const signature = `${req.status}|${req.to_user?.username ?? ''}|${req.from_user?.username ?? ''}`;
    if (prevMap.get(req.id) !== signature) {
      return true;
    }
  }

  return false;
};

const AddFriendModal = ({ isOpen, onClose, onSendRequest, receivedRequests, sentRequests, onAccept, onReject, onRefreshRequests }: AddFriendModalProps) => {
  const [tab, setTab] = useState('received');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [userExists, setUserExists] = useState<boolean | undefined>(undefined); // undefined: not checked, true: exists, false: not found
  const [checkingUser, setCheckingUser] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const hasExternalReceivedRequests = receivedRequests !== undefined;
  const externalReceivedRequests = receivedRequests ?? [];
  const [internalReceivedRequests, setInternalReceivedRequests] = useState<FriendRequest[]>(externalReceivedRequests);
  const hasExternalSentRequests = sentRequests !== undefined;
  const externalSentRequests = sentRequests ?? [];
  const [visibleSentRequests, setVisibleSentRequests] = useState<FriendRequest[]>(externalSentRequests);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const displayedReceivedRequests = hasExternalReceivedRequests ? externalReceivedRequests : internalReceivedRequests;
  const receivedCount = displayedReceivedRequests.length;

  const finishProcessing = (requestId: string) => {
    setProcessingIds((prev) => prev.filter((id) => id !== requestId));
  };

  const handleAcceptInternal = async (request: FriendRequest) => {
    if (!user) {
      return;
    }

    setProcessingIds((prev) => (prev.includes(request.id) ? prev : [...prev, request.id]));
    try {
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', request.id);
      if (updateError) {
        console.error('AddFriendModal: error updating request', updateError);
        return;
      }

      const [user1, user2] = [request.from_user_id, request.to_user_id].sort();
      const { error: insertError } = await supabase
        .from('friends')
        .insert([{ user1, user2 }]);
      if (insertError && !insertError.message?.toLowerCase().includes('duplicate')) {
        console.error('AddFriendModal: error creating friendship', insertError);
        return;
      }

      setInternalReceivedRequests((prev) => prev.filter((req) => req.id !== request.id));

      if (onRefreshRequests) {
        await onRefreshRequests();
      }
    } catch (err) {
      console.error('AddFriendModal: unexpected error accepting request', err);
    } finally {
      finishProcessing(request.id);
    }
  };

  const handleRejectInternal = async (request: FriendRequest) => {
    if (!user) {
      return;
    }

    setProcessingIds((prev) => (prev.includes(request.id) ? prev : [...prev, request.id]));
    try {
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', request.id);
      if (updateError) {
        console.error('AddFriendModal: error rejecting request', updateError);
        return;
      }

      setInternalReceivedRequests((prev) => prev.filter((req) => req.id !== request.id));

      if (onRefreshRequests) {
        await onRefreshRequests();
      }
    } catch (err) {
      console.error('AddFriendModal: unexpected error rejecting request', err);
    } finally {
      finishProcessing(request.id);
    }
  };

  const handleAcceptClick = (request: FriendRequest) => {
    if (onAccept) {
      onAccept(request);
      return;
    }

    void handleAcceptInternal(request);
  };

  const handleRejectClick = (request: FriendRequest) => {
    if (onReject) {
      onReject(request);
      return;
    }

    void handleRejectInternal(request);
  };

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

  useEffect(() => {
    if (!hasExternalReceivedRequests) {
      return;
    }

    setInternalReceivedRequests(externalReceivedRequests);
  }, [externalReceivedRequests, hasExternalReceivedRequests]);

  // Keep visibleSentRequests in sync with sentRequests from parent
  useEffect(() => {
    if (!hasExternalSentRequests) {
      return;
    }

    setVisibleSentRequests((prev) => {
      if (!haveRequestsChanged(prev, externalSentRequests)) {
        return prev;
      }

      return externalSentRequests;
    });
  }, [externalSentRequests, hasExternalSentRequests]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (hasExternalReceivedRequests) {
      return;
    }
    if (!user?.id) {
      return;
    }

    let cancelled = false;

    const fetchReceivedRequests = async () => {
      try {
        const { data, error } = await supabase
          .from('friend_requests')
          .select('id, from_user_id, to_user_id, status, created_at, from_user:profiles!friend_requests_from_user_id_fkey(id, username)')
          .eq('to_user_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (cancelled) {
          return;
        }

        if (error) {
          console.error('AddFriendModal: error fetching received requests', error);
          return;
        }

        const normalized: FriendRequest[] = (data ?? []).map((row: any) => {
          const base: FriendRequest = {
            id: String(row.id),
            from_user_id: String(row.from_user_id),
            to_user_id: String(row.to_user_id),
            status: row.status as FriendRequest['status'],
          };

          const fromProfile = normalizeProfile((row as any).from_user);
          if (fromProfile) {
            base.from_user = fromProfile;
          }

          return base;
        });

        setInternalReceivedRequests((prev) => {
          if (!haveRequestsChanged(prev, normalized)) {
            return prev;
          }
          return normalized;
        });
      } catch (fetchError) {
        if (!cancelled) {
          console.error('AddFriendModal: unexpected error fetching received requests', fetchError);
        }
      }
    };

    fetchReceivedRequests();

    return () => {
      cancelled = true;
    };
  }, [hasExternalReceivedRequests, isOpen, user?.id]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (hasExternalSentRequests) {
      return;
    }
    if (!user?.id) {
      return;
    }

    let cancelled = false;

    const fetchSentRequests = async () => {
      try {
        const { data, error } = await supabase
          .from('friend_requests')
          .select('id, from_user_id, to_user_id, status, created_at, to_user:profiles!friend_requests_to_user_id_fkey(id, username)')
          .eq('from_user_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (cancelled) {
          return;
        }

        if (error) {
          console.error('AddFriendModal: error fetching sent requests', error);
          return;
        }

        const normalized: FriendRequest[] = (data ?? []).map((row: any) => {
          const base: FriendRequest = {
            id: String(row.id),
            from_user_id: String(row.from_user_id),
            to_user_id: String(row.to_user_id),
            status: row.status as FriendRequest['status'],
          };

          const toProfile = normalizeProfile((row as any).to_user);
          if (toProfile) {
            base.to_user = toProfile;
          }

          return base;
        });

        setVisibleSentRequests((prev) => {
          if (!haveRequestsChanged(prev, normalized)) {
            return prev;
          }
          return normalized;
        });
      } catch (fetchError) {
        if (!cancelled) {
          console.error('AddFriendModal: unexpected error fetching sent requests', fetchError);
        }
      }
    };

    fetchSentRequests();

    return () => {
      cancelled = true;
    };
  }, [hasExternalSentRequests, isOpen, user?.id]);

  const handleRequestSuccess = (newRequest?: FriendRequest) => {
    setUsername('');
    setRequestSent(true);
    setError('');
    if (newRequest) {
      setVisibleSentRequests((prev) => {
        if (prev.some((req) => req.id === newRequest.id)) {
          return prev;
        }
        return [...prev, newRequest];
      });
    }
    setTimeout(() => setRequestSent(false), 2000);
  };

  const handleSend = async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Enter a username');
      return;
    }
    // Check if already a friend (case-insensitive) - temporarily disabled since friends list is not available
    // const alreadyFriend = friends.some((f) => (f.username || '').toLowerCase() === trimmedUsername.toLowerCase());
    // if (alreadyFriend) {
    //   setError('This user is already your friend.');
    //   return;
    // }
    setError('');
    if (onSendRequest) {
      setIsSubmitting(true);
      onSendRequest(trimmedUsername, {
        onSuccess: () => {
          setIsSubmitting(false);
          handleRequestSuccess();
        },
        onError: (msg?: string) => {
          setIsSubmitting(false);
          setError(msg || 'Error sending request');
        },
      });
      return;
    }

    if (!user) {
      setIsSubmitting(false);
      setError('You must be logged in to send a friend request.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: toUser, error: userError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', trimmedUsername)
        .maybeSingle();

      if (userError || !toUser) {
        setIsSubmitting(false);
        setError('User not found.');
        return;
      }

      if (toUser.id === user.id) {
        setIsSubmitting(false);
        setError('You cannot send a friend request to yourself.');
        return;
      }

      const { data: inserted, error: insertError } = await supabase
        .from('friend_requests')
        .insert({ from_user_id: user.id, to_user_id: toUser.id, status: 'pending' })
        .select('id, from_user_id, to_user_id, status, from_user:profiles!friend_requests_from_user_id_fkey(id, username), to_user:profiles!friend_requests_to_user_id_fkey(id, username)')
        .maybeSingle();

      if (insertError) {
        if (insertError.message?.toLowerCase().includes('duplicate')) {
          setError('Friend request already sent.');
        } else {
          setError('Error sending friend request: ' + insertError.message);
        }
        setIsSubmitting(false);
        return;
      }

      const normalizeProfile = (raw: any) => {
        const profile = Array.isArray(raw) ? raw[0] : raw;
        if (!profile) {
          return undefined;
        }
        return {
          id: String(profile.id),
          username: typeof profile.username === 'string' ? profile.username : undefined,
        } satisfies Friend['username'] extends never ? never : { id: string; username?: string };
      };

      const fromProfile = inserted ? normalizeProfile((inserted as any).from_user) : undefined;
      const toProfile = inserted ? normalizeProfile((inserted as any).to_user) : undefined;

      const newRequest: FriendRequest | undefined = inserted
        ? {
            id: String(inserted.id),
            from_user_id: String(inserted.from_user_id),
            to_user_id: String(inserted.to_user_id),
            status: inserted.status as FriendRequest['status'],
            ...(fromProfile ? { from_user: fromProfile } : {}),
            ...(toProfile ? { to_user: toProfile } : {}),
          }
        : undefined;

      handleRequestSuccess(newRequest);
      if (onRefreshRequests) {
        await onRefreshRequests();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError('Unexpected error: ' + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePending = async (request: FriendRequest) => {
    console.warn('[DEBUG] handleDeletePending called for request:', request);
    setDeletingIds(prev => [...prev, request.id]);
    setVisibleSentRequests(prev => prev.filter(r => r.id !== request.id));
    try {
      const { error, data } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', request.id);
      console.warn('[DEBUG] supabase delete result:', { error, data });
      if (error) {
        setError('Error deleting request: ' + error.message);
        console.error('[DEBUG] Error deleting request:', error);
      } else {
        if (onRefreshRequests) {
          await onRefreshRequests();
        }
        console.warn('[DEBUG] Request deleted successfully');
      }
    } catch (err) {
      setError('Unexpected error: ' + (err instanceof Error ? err.message : String(err)));
      console.error('[DEBUG] Unexpected error in handleDeletePending:', err);
    } finally {
      setDeletingIds(prev => prev.filter(id => id !== request.id));
      console.warn('[DEBUG] handleDeletePending finished for request:', request);
    }
  };

  const isSelfRequest = !!(user && username.trim().length > 0 && username.trim().toLowerCase() === ((user as any).username || '').toLowerCase());

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
            {receivedCount > 0 && (
              <span className="absolute -top-2 -right-4 w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] border-2 border-[var(--bg-primary)]"></span>
            )}
          </span>
        </button>
        <span className="text-[var(--border-primary)] font-bold">|</span>
        <button
          className={`flex-1 text-center px-4 py-1 font-semibold relative ${tab === 'sent' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'} focus:outline-none`}
          onClick={() => setTab('sent')}
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
            className="mt-2 px-4 py-2 rounded-lg border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold hover:bg-[var(--accent-primary)]/10 w-full disabled:opacity-60 disabled:hover:bg-transparent"
            onClick={handleSend}
            disabled={requestSent || userExists === false || isSelfRequest || isSubmitting}
          >
            {requestSent ? 'Request Sent!' : isSubmitting ? 'Sending...' : 'Send Request'}
          </button>
          {isSelfRequest && (
            <div className="text-sm text-red-600 mt-1">You cannot send a friend request to yourself.</div>
          )}
          {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
        </div>
      )}
      {tab === 'received' && (
        <div className="w-full flex flex-col gap-2 py-4">
          {displayedReceivedRequests.length === 0 ? (
            <div className="text-[var(--text-secondary)] text-center">No received requests</div>
          ) : (
            displayedReceivedRequests.map((req, i) => (
              <div key={i} className="flex items-center justify-between bg-[var(--bg-secondary)] rounded-lg px-3 py-2">
                <span className="text-[var(--text-primary)] font-medium">{req.from_user?.username || req.from_user_id}</span>
                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 rounded bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
                    onClick={() => handleAcceptClick(req)}
                    disabled={processingIds.includes(req.id)}
                  >
                    {processingIds.includes(req.id) ? 'Processing...' : 'Accept'}
                  </button>
                  <button
                    className="px-2 py-1 rounded bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                    onClick={() => handleRejectClick(req)}
                    disabled={processingIds.includes(req.id)}
                  >
                    {processingIds.includes(req.id) ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {tab === 'sent' && (
        <div className="w-full flex flex-col gap-2 py-4">
          {visibleSentRequests.filter(req => !deletingIds.includes(req.id)).length === 0 ? (
            <div className="text-[var(--text-secondary)] text-center">No pending requests</div>
          ) : (
            visibleSentRequests.filter(req => !deletingIds.includes(req.id)).map((req, i) => (
              <div key={`req-${i}`} className="flex flex-row items-center bg-[var(--bg-secondary)] rounded-lg px-3 py-2 min-h-[2.5rem]">
                <div className="flex-1 flex items-center min-w-0">
                  <span className="text-[var(--text-primary)] font-medium whitespace-nowrap">{req.to_user?.username || req.to_user_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--text-secondary)] font-semibold capitalize text-right">{req.status}</span>
                  <button
                    className="p-1 rounded-full hover:bg-red-500/20 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                    onClick={() => handleDeletePending(req)}
                    disabled={deletingIds.includes(req.id)}
                    title="Cancel request"
                  >
                    <X size={16} />
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