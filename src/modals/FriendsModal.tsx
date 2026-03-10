import { useCallback, useEffect, useRef, useState } from 'react';

import BaseModal from './BaseModal';
import FriendDetailModal from './FriendDetailModal';
import ShareWorkspaceModal from './ShareWorkspaceModal';
import { Trash2 } from 'lucide-react';
import { Workspace } from '@/types/workspace';
import { supabase } from '@/utils/supabaseClient';

// Friend interface with additional properties used in this component
interface Friend {
  id: string;
  username?: string;
  email?: string;
  avatar_url?: string;
};

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends?: Friend[];
  onRemoveFriend?: (friend: Friend) => void;
  sharedWorkspaces?: Record<string, Workspace[]>;
  availableWorkspaces?: Workspace[];
  currentUserId?: string;
}

const FriendsModal: React.FC<FriendsModalProps> = ({ isOpen, onClose, friends = [], onRemoveFriend, sharedWorkspaces = {}, availableWorkspaces = [], currentUserId }) => {
  const [selected, setSelected] = useState<Friend | null>(null); // amigo seleccionado para modal
  const [sharedByUser, setSharedByUser] = useState<any[]>([]);
  const [sharedWithUser, setSharedWithUser] = useState<any[]>([]);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [sharedError, setSharedError] = useState<string | null>(null);
  const friendsRef = useRef(friends);

  useEffect(() => {
    friendsRef.current = friends;
  }, [friends]);

  const fetchSharedWorkspaces = useCallback(async () => {
    if (!currentUserId) {
      setSharedByUser([]);
      setSharedWithUser([]);
      return;
    }

    try {
      setSharedLoading(true);
      setSharedError(null);

      // Backfill legacy rows where user_id was not set but the workspace was received by the current user
      const { error: updateError } = await supabase
        .from('shared_workspaces')
        .update({ user_id: currentUserId })
        .is('user_id', null)
        .eq('received_by', currentUserId);

      if (updateError) {
        console.warn('Error backfilling user_id:', updateError);
        // Continue anyway, don't block the fetch
      }

      const { data, error } = await supabase
        .from('shared_workspaces')
        .select('id, workspace_id, shared_by, received_by, user_id, created_at, workspace_name, workspace_icon')
        .or(`shared_by.eq.${currentUserId},received_by.eq.${currentUserId},user_id.eq.${currentUserId}`);

      if (error) {
        throw error;
      }

      const partnerIds = Array.from(
        new Set(
          (data || [])
            .map(row => (row.shared_by === currentUserId ? row.received_by : row.shared_by))
            .filter((id): id is string => !!id)
        )
      );

      let partnerProfiles: Record<string, any> = {};

      if (partnerIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, email, avatar_url')
          .in('id', partnerIds);

        if (!profileError && profileData) {
          partnerProfiles = profileData.reduce<Record<string, any>>((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {});
        }
      }

      friendsRef.current.forEach(friend => {
        if (friend?.id && !partnerProfiles[friend.id]) {
          partnerProfiles[friend.id] = friend;
        }
      });

      const outgoing: any[] = [];
      const incoming: any[] = [];

      (data || []).forEach(row => {
        const workspace = {
          id: row.workspace_id,
          name: row.workspace_name || 'Shared workspace',
          icon: row.workspace_icon || 'Briefcase'
        };
        const partnerId = row.shared_by === currentUserId ? row.received_by : row.shared_by || row.user_id;
        const partner = partnerId ? partnerProfiles[partnerId] : null;
        const entry = {
          id: row.id,
          workspace,
          partner,
          created_at: row.created_at,
        };

        if (row.shared_by === currentUserId) {
          outgoing.push(entry);
        } else {
          incoming.push(entry);
        }
      });

      setSharedByUser(outgoing);
      setSharedWithUser(incoming);
    } catch (err) {
      console.error('FriendsModal: error fetching shared workspaces', err);
      setSharedError(err instanceof Error ? err.message : String(err));
    } finally {
      setSharedLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (isOpen) {
      void fetchSharedWorkspaces();
    }
  }, [isOpen, fetchSharedWorkspaces]);

  const handleUnshareWorkspace = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('shared_workspaces')
        .delete()
        .eq('id', shareId);
      
      if (error) {
        console.error('Error unsharing workspace:', error);
      } else {
        console.log('Workspace unshared successfully');
      }
      await fetchSharedWorkspaces();
    } catch (error) {
      console.error('Error unsharing workspace:', error);
    }
  };

  return (
    <>
      <BaseModal isOpen={isOpen} onClose={onClose} title="Friends" maxWidth="max-w-md">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Your Friends</h3>
          {friends.length === 0 ? (
            <div className="text-[var(--text-secondary)] text-center">You have no friends yet.</div>
          ) : (
            <ul className="space-y-2">
              {friends.map((friend: Friend) => (
                <li key={friend.id}>
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] shadow-sm cursor-pointer transition hover:bg-[var(--bg-primary)]"
                    onClick={() => setSelected(friend)}
                    tabIndex={0}
                    role="button"
                  >
                    <div className="relative">
                      <img
                        src={friend.avatar_url || '/public/assets/apple-touch-icon.png'}
                        alt={friend.username || friend.email || friend.id}
                        className="w-10 h-10 rounded-full object-cover border-2 border-[var(--accent-primary)] bg-[var(--bg-primary)]"
                      />
                      {sharedWorkspaces[friend.id] && sharedWorkspaces[friend.id]!.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--accent-primary)] border-2 border-white"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[var(--text-primary)] truncate">{friend.username || friend.email || friend.id}</div>
                      <div className="text-sm text-[var(--text-secondary)] truncate">{friend.email}</div>
                    </div>
                    {onRemoveFriend && (
                      <button
                        className="p-2 rounded-full hover:bg-red-500/20 text-red-500 hover:text-red-700 transition-colors"
                        onClick={e => {
                          e.stopPropagation();
                          void onRemoveFriend(friend);
                        }}
                        title="Remove friend"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        

      </BaseModal>
      {/* Modal de detalle de amigo */}
      <FriendDetailModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        friend={selected!}
        sharedWorkspaces={selected ? (sharedWorkspaces[selected.id] || []) : []}
        availableWorkspaces={availableWorkspaces}
        allFriends={friends}
        {...(currentUserId && { currentUserId })}
        {...(onRemoveFriend && { onRemoveFriend })}
      />
    </>
  );
};

export default FriendsModal;