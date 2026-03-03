import BaseModal from './BaseModal';
import ShareWorkspaceModal from './ShareWorkspaceModal';
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

interface FriendDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: Friend;
  sharedWorkspaces: Workspace[];
  availableWorkspaces?: Workspace[];
  currentUserId?: string;
  allFriends?: Friend[];
  onRemoveFriend?: (friend: Friend) => void;
}

const FriendDetailModal: React.FC<FriendDetailModalProps> = ({ isOpen, onClose, friend, sharedWorkspaces, availableWorkspaces = [], currentUserId, allFriends = [], onRemoveFriend }) => {
  console.log('FriendDetailModal: Props', { onRemoveFriend: !!onRemoveFriend, friend: friend?.username });
  
  const [showShareModal, setShowShareModal] = useState(false);
  
  if (!friend) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={friend.username || friend.email || 'Friend'} maxWidth="max-w-sm">
      <div className="flex flex-col items-center gap-4 py-4">
        <img
          src={friend.avatar_url || '/public/assets/apple-touch-icon.png'}
          alt={friend.username || friend.email || 'Avatar'}
          className="w-20 h-20 rounded-full object-cover border-2 border-[var(--accent-primary)] bg-[var(--bg-primary)]"
        />
        <div className="text-lg font-semibold text-[var(--text-primary)]">{friend.username || friend.email || friend.id}</div>
        <div className="text-sm text-[var(--text-secondary)]">{friend.email}</div>
        
        {onRemoveFriend && (
          <button
            onClick={() => {
              onRemoveFriend(friend);
              onClose();
            }}
            className="p-2 rounded-full hover:bg-red-500/20 text-red-500 hover:text-red-700 transition-colors"
            title="Remove friend"
          >
            <Trash2 size={18} />
          </button>
        )}
        
        <div className="w-full mt-4">
          <div className="flex flex-col items-center gap-3 mb-4">
            {availableWorkspaces.length > 0 && (
              <button
                onClick={() => setShowShareModal(true)}
                className="px-4 py-2 rounded-lg border border-[var(--accent-primary)] text-[var(--accent-primary)] font-medium"
              >
                Share Workspace
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Share Workspace Modal */}
      {showShareModal && (
        <ShareWorkspaceModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          workspaces={availableWorkspaces}
          friends={allFriends}
          currentUserId={currentUserId || ''}
          onShare={async (workspaceId: string, recipient: string, options: { onSuccess?: () => void; onError?: (msg?: string) => void }) => {
            console.log('DEBUG: Sharing workspace', { workspaceId, recipient, allFriendsLength: allFriends.length });
            try {
              // Aquí puedes implementar la lógica para compartir el workspace
              // Por ahora, solo mostramos éxito
              options.onSuccess?.();
              setShowShareModal(false);
            } catch (error) {
              options.onError?.('Error sharing workspace');
            }
          }}
        />
      )}
    </BaseModal>
  );
};

export default FriendDetailModal;
