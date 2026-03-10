import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '@/utils/supabaseClient';

type FriendProfile = {
  id: string;
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  friendship_id?: string;
  added_at?: string | null;
};

type FriendRequestRecord = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  from_user?: { username?: string | null } | null;
  to_user?: { username?: string | null } | null;
};

type RequestCallbacks = {
  onSuccess?: () => void;
  onError?: (message?: string) => void;
};

export const useFriendManagement = (userId?: string | null) => {
  const [receivedRequests, setReceivedRequests] = useState<FriendRequestRecord[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequestRecord[]>([]);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const initialRequestsFetchedRef = useRef(false);

  const fetchRequests = useCallback(async () => {
    if (!userId) {
      setReceivedRequests([]);
      setSentRequests([]);
      return;
    }

    const { data: rec } = await supabase
      .from('friend_requests')
      .select('*, from_user:profiles!friend_requests_from_user_id_fkey(username, avatar_url)')
      .eq('to_user_id', userId)
      .eq('status', 'pending');

    const { data: sent } = await supabase
      .from('friend_requests')
      .select('*, to_user:profiles!friend_requests_to_user_id_fkey(username, avatar_url)')
      .eq('from_user_id', userId)
      .eq('status', 'pending');

    let newlyReceived: FriendRequestRecord[] = [];
    setReceivedRequests(prev => {
      const previousIds = new Set(prev.map(request => request.id));
      newlyReceived = (rec || []).filter(request => !previousIds.has(request.id));
      return (rec ?? []) as FriendRequestRecord[];
    });
    setSentRequests((sent ?? []) as FriendRequestRecord[]);

    if (initialRequestsFetchedRef.current && newlyReceived.length > 0) {
      if (newlyReceived.length === 1) {
        const senderName = newlyReceived[0]?.from_user?.username || 'Someone';
        console.info(`Friend request from ${senderName}`);
      } else {
        console.info(`${newlyReceived.length} new friend requests`);
      }
    }

    if (!initialRequestsFetchedRef.current) {
      initialRequestsFetchedRef.current = true;
    }
  }, [userId]);

  const fetchFriends = useCallback(async () => {
    if (!userId) {
      setFriends([]);
      return;
    }

    const { data, error } = await supabase
      .from('friends')
      .select('id, created_at, user1, user2')
      .or(`user1.eq.${userId},user2.eq.${userId}`);

    if (error) {
      console.error('useFriendManagement: error fetching friends', error);
      setFriends([]);
      return;
    }

    const rows = Array.isArray(data) ? data : [];

    if (rows.length === 0) {
      setFriends([]);
      return;
    }

    const partnerIds = Array.from(
      new Set(
        rows
          .map(row => {
            if (row.user1 === userId) return row.user2;
            if (row.user2 === userId) return row.user1;
            return null;
          })
          .filter((id): id is string => Boolean(id))
      )
    );

    let profileMap = new Map<string, { id: string; username?: string | null; email?: string | null; avatar_url?: string | null }>();

    if (partnerIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, email, avatar_url')
        .in('id', partnerIds);

      if (profilesError) {
        console.warn('useFriendManagement: error fetching friend profiles', profilesError);
      }

      if (Array.isArray(profiles)) {
        profileMap = profiles.reduce((acc, profile) => {
          if (profile?.id) {
            acc.set(profile.id, profile);
          }
          return acc;
        }, new Map<string, { id: string; username?: string | null; email?: string | null; avatar_url?: string | null }>());
      }
    }

    const normalized = rows.reduce<FriendProfile[]>((acc, row) => {
      const partnerId = row.user1 === userId ? row.user2 : row.user1;
      if (!partnerId) {
        return acc;
      }

      const profile = profileMap.get(partnerId);
      acc.push({
        id: partnerId,
        username: profile?.username ?? null,
        email: profile?.email ?? null,
        avatar_url: profile?.avatar_url ?? null,
        friendship_id: row.id,
        added_at: row.created_at,
      });
      return acc;
    }, []);

    const deduped = Array.from(
      normalized.reduce<Map<string, FriendProfile>>((acc, friend) => {
        if (!acc.has(friend.id)) {
          acc.set(friend.id, friend);
        }
        return acc;
      }, new Map<string, FriendProfile>()).values()
    );

    setFriends(deduped);
  }, [userId]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    void fetchFriends();
  }, [fetchFriends]);

  const handleSendRequest = useCallback(
    async (username: string, { onSuccess, onError }: RequestCallbacks = {}) => {
      if (!userId) {
        onError?.('You must be logged in to send a friend request.');
        return;
      }

      try {
        const { data: toUser, error: userError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .maybeSingle();

        if (userError || !toUser) {
          onError?.('User not found.');
          return;
        }

        if (toUser.id === userId) {
          onError?.('You cannot send a friend request to yourself.');
          return;
        }

        const { error: insertError } = await supabase
          .from('friend_requests')
          .insert({ from_user_id: userId, to_user_id: toUser.id, status: 'pending' });

        if (insertError) {
          if (insertError.message?.includes('duplicate')) {
            onError?.('Friend request already sent.');
          } else {
            onError?.('Error sending friend request: ' + insertError.message);
          }
          return;
        }

        onSuccess?.();
        await fetchRequests();
      } catch (err) {
        onError?.('Unexpected error: ' + (err as Error).message);
      }
    },
    [userId, fetchRequests]
  );

  const handleAccept = useCallback(
    async (request: FriendRequestRecord) => {
      try {
        const { error: updateError } = await supabase
          .from('friend_requests')
          .update({ status: 'accepted' })
          .eq('id', request.id);

        if (updateError) {
          console.error('Error updating request:', updateError);
          throw new Error(updateError.message);
        }

        const [user1, user2] = [request.from_user_id, request.to_user_id].sort();
        const { error: insertError } = await supabase
          .from('friends')
          .insert([{ user1, user2 }]);

        if (insertError && !insertError.message.includes('duplicate')) {
          console.error('Error creating friendship:', insertError);
          throw new Error(insertError.message);
        }

        await fetchRequests();
        await fetchFriends();
      } catch (error) {
        console.error('Unexpected error accepting friend request:', error);
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
    [fetchFriends, fetchRequests]
  );

  const handleReject = useCallback(
    async (request: FriendRequestRecord) => {
      try {
        const { error } = await supabase
          .from('friend_requests')
          .update({ status: 'rejected' })
          .eq('id', request.id);

        if (error) {
          console.error('Error rejecting request:', error);
          throw new Error(error.message);
        }

        await fetchRequests();
      } catch (err) {
        console.error('Unexpected error rejecting friend request:', err);
        throw err instanceof Error ? err : new Error(String(err));
      }
    },
    [fetchRequests]
  );

  const handleRemoveFriend = useCallback(
    async (friend: FriendProfile) => {
      if (!userId) {
        throw new Error('You must be logged in to remove friends.');
      }

      if (!friend?.id) {
        throw new Error('Friend is missing an id.');
      }

      try {
        const [user1, user2] = [userId, friend.id].sort();

        const { error } = await supabase
          .from('friends')
          .delete()
          .eq('user1', user1)
          .eq('user2', user2);

        if (error) {
          throw error;
        }

        setFriends(prev => prev.filter(f => f.id !== friend.id));

        const cleanupFilter = [
          `and(shared_by.eq.${userId},received_by.eq.${friend.id})`,
          `and(shared_by.eq.${friend.id},received_by.eq.${userId})`,
          `and(user_id.eq.${userId},received_by.eq.${friend.id})`,
          `and(user_id.eq.${friend.id},received_by.eq.${userId})`,
        ].join(',');

        const { error: cleanupError } = await supabase
          .from('shared_workspaces')
          .delete()
          .or(cleanupFilter);

        if (cleanupError) {
          console.warn('useFriendManagement: error cleaning shared workspaces after removing friend', cleanupError);
        }

        await fetchFriends();
        console.info(`Friend removed: ${friend.username || friend.email || friend.id}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Error removing friend:', message);
        throw (err instanceof Error ? err : new Error(message));
      }
    },
    [userId, fetchFriends]
  );

  return {
    friends,
    receivedRequests,
    sentRequests,
    fetchFriends,
    fetchRequests,
    handleSendRequest,
    handleAccept,
    handleReject,
    handleRemoveFriend,
  };
};
