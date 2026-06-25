import BaseModal from './BaseModal';
import FriendDetailModal from './FriendDetailModal';
import { Trash2 } from 'lucide-react';
import { Workspace } from '@/types/workspace';
import { useState } from 'react';

// Friend interface with additional properties used in this component
interface Friend {
  id: string;
  username?: string;
  email?: string;
  avatar_url?: string;
}
;
interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends?: Friend[];
  onRemoveFriend?: (friend: Friend) => void;
  sharedWorkspaces?: Record<string, Workspace[]>;
  availableWorkspaces?: Workspace[];
  currentUserId?: string;
}
const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  friends = [],
  onRemoveFriend,
  sharedWorkspaces = {},
  availableWorkspaces = [],
  currentUserId
}) => {
  const [selected, setSelected] = useState<Friend | null>(null); // amigo seleccionado para modal
  return <>
      <BaseModal isOpen={isOpen} onClose={onClose} title="Friends" maxWidth="max-w-md">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Your Friends</h3>
          {friends.length === 0 ? <div className="text-[var(--text-secondary)] text-center">You have no friends yet.</div> : <ul className="space-y-2">
              {friends.map((friend: Friend) => <li key={friend.id}>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] shadow-sm cursor-pointer transition hover:bg-[var(--bg-primary)]" onClick={() => setSelected(friend)} tabIndex={0} role="button">
                    <div className="relative">
                      <img src={friend.avatar_url || '/public/assets/apple-touch-icon.png'} alt={friend.username || friend.email || friend.id} className="w-10 h-10 rounded-full object-cover border-2 border-[var(--accent-primary)] bg-[var(--bg-primary)]" />
                      {sharedWorkspaces[friend.id] && sharedWorkspaces[friend.id]!.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--accent-primary)] border-2 border-white"></span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[var(--text-primary)] truncate">{friend.username || friend.email || friend.id}</div>
                      <div className="text-sm text-[var(--text-secondary)] truncate">{friend.email}</div>
                    </div>
                    {onRemoveFriend && <button className="p-2 rounded-full hover:bg-red-500/20 text-red-500 hover:text-red-700 transition-colors" onClick={e => {
                e.stopPropagation();
                void onRemoveFriend(friend);
              }} title="Remove friend">
                        <Trash2 size={18} />
                      </button>}
                  </div>
                </li>)}
            </ul>}
        </div>
        

      </BaseModal>
      {/* Modal de detalle de amigo */}
      <FriendDetailModal isOpen={!!selected} onClose={() => setSelected(null)} friend={selected!} sharedWorkspaces={selected ? sharedWorkspaces[selected.id] || [] : []} availableWorkspaces={availableWorkspaces} allFriends={friends} {...currentUserId && {
      currentUserId
    }} {...onRemoveFriend && {
      onRemoveFriend
    }} />
    </>;
};
export default FriendsModal;