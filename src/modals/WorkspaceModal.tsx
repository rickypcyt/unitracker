import { BookOpen, Briefcase, Check, Coffee, Edit, FolderOpen, Gamepad2, Heart, Home, Loader2, Music, Plane, Plus, Search, Share, ShoppingBag, Smartphone, Star, Target, Trash2, Trophy, Umbrella, User, Users, Wifi, Workflow, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import BaseModal from './BaseModal';
import ManageWorkspacesModal from '@/modals/ManageWorkspacesModal';
import ShareWorkspaceModal from '@/modals/ShareWorkspaceModal';
import { Workspace } from '@/types/workspace';
import WorkspaceCreateModal from '@/modals/WorkspaceCreateModal';
import { supabase } from '@/utils/supabaseClient';
import { SharedWorkspaceService } from '@/services/WorkspaceService';

// Constant for the "All" workspace
const ALL_WORKSPACE_ID = 'all';
interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: (Workspace & {
    taskCount?: number;
  })[];
  activeWorkspace: (Workspace & {
    taskCount?: number;
  }) | null;
  onSelectWorkspace: (workspace: Workspace & {
    taskCount?: number;
  }) => void;
  onCreateWorkspace: (workspace: Workspace & {
    taskCount?: number;
  }) => void;
  onEditWorkspace: (workspace: Workspace & {
    taskCount?: number;
  }) => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  currentUserId?: string;
  friends?: any[];
  onAddFriend?: () => void;
  onRefreshWorkspaces?: () => void;
}
const iconOptions: {
  [key: string]: React.ComponentType<any>;
} = {
  Briefcase,
  FolderOpen,
  Home,
  User,
  Users,
  Zap,
  BookOpen,
  Coffee,
  Gamepad2,
  Heart,
  Music,
  Plane,
  ShoppingBag,
  Smartphone,
  Star,
  Target,
  Trophy,
  Umbrella,
  Wifi,
  Workflow
};
const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  workspaces = [],
  activeWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  isOpen,
  onClose,
  currentUserId,
  friends = [],
  onAddFriend,
  onRefreshWorkspaces
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [sharedByUser, setSharedByUser] = useState<any[]>([]);
  const [sharedWithUser, setSharedWithUser] = useState<any[]>([]);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [, setSharedError] = useState<string | null>(null);
  const friendsRef = useRef(friends);
  const workspacesRef = useRef(workspaces);
  useEffect(() => {
    friendsRef.current = friends;
  }, [friends]);
  useEffect(() => {
    workspacesRef.current = workspaces;
  }, [workspaces]);
  const fetchSharedWorkspaces = useCallback(async () => {
    if (!currentUserId) {
      setSharedByUser([]);
      setSharedWithUser([]);
      return;
    }
    try {
      setSharedLoading(true);
      setSharedError(null);

      const data = await SharedWorkspaceService.fetchSharedWorkspaces(currentUserId);
      const currentFriends = friendsRef.current ?? [];
      const partnerIds = Array.from(new Set((data || []).map(row => row.shared_by === currentUserId ? row.received_by : row.shared_by).filter((id): id is string => !!id)));
      let partnerProfiles: Record<string, any> = {};
      if (partnerIds.length > 0) {
        const {
          data: profileData,
          error: profileError
        } = await supabase.from('profiles').select('id, username, email, avatar_url').in('id', partnerIds);
        if (!profileError && profileData) {
          partnerProfiles = profileData.reduce<Record<string, any>>((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {});
        }
      }
      currentFriends.forEach(friend => {
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
          created_at: row.created_at
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
      console.error('WorkspaceModal: error fetching shared workspaces', err);
      setSharedError(err instanceof Error ? err.message : String(err));
    } finally {
      setSharedLoading(false);
    }
  }, [currentUserId]);

  // Refresh workspace data when modal opens
  useEffect(() => {
    if (isOpen && onRefreshWorkspaces) {
      onRefreshWorkspaces();
    }
  }, [isOpen, onRefreshWorkspaces]);

  // Use the taskCount from props since it's calculated in the parent component
  const getTaskCountByWorkspace = (ws: Workspace & {
    taskCount?: number;
  }) => {
    return ws.taskCount || 0;
  };
  const handleUnshareWorkspace = async (shareId: string, removedWorkspaceId?: string) => {
    try {
      await SharedWorkspaceService.unshareWorkspace(shareId);

      // If the active workspace was the one just unshared, switch to a fallback
      if (removedWorkspaceId && activeWorkspace?.id === removedWorkspaceId) {
        const availableWorkspaces = workspacesRef.current ?? [];
        const fallbackWorkspace = availableWorkspaces.find(ws => ws.id !== removedWorkspaceId) || {
          id: ALL_WORKSPACE_ID,
          name: 'All',
          icon: 'Workflow',
          taskCount: availableWorkspaces.reduce((sum, ws) => sum + (ws.taskCount || 0), 0)
        };
        try {
          localStorage.setItem('activeWorkspaceId', fallbackWorkspace.id.toString());
        } catch {
          // Ignore localStorage errors
        }
        onSelectWorkspace(fallbackWorkspace as Workspace & {
          taskCount?: number;
        });
      }
      await fetchSharedWorkspaces();
    } catch (error) {
      console.error('Error unsharing workspace:', error);
    }
  };
  const handleShareWorkspace = async (workspaceId: string, recipient: string, {
    onSuccess,
    onError
  }: {
    onSuccess?: () => void;
    onError?: (message: string) => void;
  }) => {
    try {
      const workspace = workspacesRef.current.find(ws => String(ws.id) === workspaceId);
      try {
        await SharedWorkspaceService.shareWorkspace(workspaceId, currentUserId || '', recipient, workspace?.name, workspace?.icon);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        if (errMsg?.toLowerCase().includes('duplicate')) {
          onError && onError('This workspace is already shared with that user.');
        } else {
          onError && onError(errMsg);
        }
        return;
      }
      onSuccess && onSuccess();
      await fetchSharedWorkspaces();
    } catch (err) {
      const error = err as Error;
      onError?.(error.message);
    }
  };
  const handleSelectWorkspace = useCallback((ws: Workspace & {
    taskCount?: number;
  }) => {
    if (activeWorkspace?.id === ws.id) {
      onClose();
      return;
    }
    localStorage.setItem('activeWorkspaceId', ws.id.toString());
    onSelectWorkspace(ws);
    onClose();
  }, [activeWorkspace?.id, onSelectWorkspace, onClose]);
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = itemRefs.current.filter(Boolean);
    if (items.length === 0) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => {
          const nextIndex = prev >= items.length - 1 ? 0 : prev + 1;
          (items[nextIndex] as HTMLElement)?.focus();
          return nextIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => {
          const nextIndex = prev <= 0 ? items.length - 1 : prev - 1;
          (items[nextIndex] as HTMLElement)?.focus();
          return nextIndex;
        });
        break;
      case 'Enter':
        if (focusedIndex >= 0 && focusedIndex < workspaces.length) {
          e.preventDefault();
          const sortedWorkspaces = [...workspaces].sort((a, b) => a.name.localeCompare(b.name));
          const ws = sortedWorkspaces[focusedIndex];
          if (ws) {
            handleSelectWorkspace(ws);
          }
        }
        break;
      default:
        break;
    }
  }, [focusedIndex, workspaces, handleSelectWorkspace]);
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0);
      setTimeout(() => {
        const firstItem = itemRefs.current[0];
        if (firstItem) {
          firstItem.focus();
        }
      }, 100);
      void fetchSharedWorkspaces();
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen, fetchSharedWorkspaces]);
  const handleSelectSharedWorkspaceEntry = useCallback((entry: any) => {
    const workspaceId = entry?.workspace?.id;
    if (!workspaceId) {
      console.warn('Shared workspace entry is missing a workspace id.');
      return;
    }
    const currentList = workspacesRef.current ?? [];
    const matchedWorkspace = currentList.find(ws => String(ws.id) === String(workspaceId));
    const fallbackWorkspace = {
      id: workspaceId,
      name: entry?.workspace?.name || 'Shared workspace',
      icon: entry?.workspace?.icon || 'Briefcase',
      taskCount: entry?.workspace?.taskCount ?? 0,
      sharedBy: entry?.partner?.id || entry?.shared_by || null
    };
    handleSelectWorkspace((matchedWorkspace || fallbackWorkspace) as Workspace & {
      taskCount?: number;
    });
  }, [handleSelectWorkspace]);
  const sortedWorkspaces = useMemo(() => {
    // Create the "All" workspace
    const allWorkspace = {
      id: ALL_WORKSPACE_ID,
      name: 'All',
      icon: 'Workflow',
      // Using Workflow icon for "All"
      taskCount: workspaces.reduce((sum, ws) => sum + (ws.taskCount || 0), 0)
    };

    // Return "All" workspace first, then sorted workspaces
    return [allWorkspace, ...workspaces.sort((a, b) => a.name.localeCompare(b.name))];
  }, [workspaces]);

  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) return sortedWorkspaces;
    const q = searchQuery.toLowerCase();
    return sortedWorkspaces.filter((ws: any) => ws.name.toLowerCase().includes(q));
  }, [sortedWorkspaces, searchQuery]);

  return <>
      <BaseModal isOpen={isOpen} onClose={onClose} title="Select Workspace" maxWidth="max-w-lg" showHeader={false}>
        <div className="flex flex-col" onKeyDown={handleKeyDown}>
          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-3 w-5 h-5 text-[var(--text-secondary)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspaces..."
              className="w-full pl-10 pr-3 py-2.5 bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-lg text-base text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
            />
          </div>

          {/* Workspace list */}
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {filteredWorkspaces.length === 0 && (
              <div className="text-center py-6 text-sm text-[var(--text-secondary)]">
                No workspaces found
              </div>
            )}
            {filteredWorkspaces.map((ws: any, i: number) => {
              const isActive = activeWorkspace?.id === ws.id;
              const IconComp = iconOptions[ws.icon || 'Briefcase'] || Briefcase;
              return (
                <button
                  key={ws.id}
                  ref={el => { itemRefs.current[i] = el; }}
                  onClick={() => handleSelectWorkspace(ws)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-200 ${
                    isActive
                      ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]'
                      : 'border-transparent hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-[var(--accent-primary)]/15' : 'bg-[var(--bg-secondary)]'
                  }`}>
                    <IconComp className={`w-5 h-5 ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <span className={`text-base font-medium ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                      {ws.name}
                    </span>
                    {getTaskCountByWorkspace(ws) > 0 && (
                      <span className="ml-2 text-sm text-[var(--text-secondary)]">
                        {getTaskCountByWorkspace(ws)} tasks
                      </span>
                    )}
                  </div>
                  {isActive && <Check className="w-5 h-5 text-[var(--accent-primary)] flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Shared Workspaces section */}
          {(sharedByUser.length > 0 || sharedWithUser.length > 0 || sharedLoading) && (
            <div className="border-t border-[var(--border-primary)] pt-3 mt-3">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Shared</h3>
              {sharedLoading ? (
                <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                  {sharedByUser.map(entry => (
                    <button
                      key={entry.id}
                      onClick={() => handleSelectSharedWorkspaceEntry(entry)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[var(--bg-secondary)]">
                        <Share className="w-4 h-4 text-[var(--text-secondary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-medium text-[var(--text-primary)] truncate">{entry.workspace?.name || 'Unknown'}</div>
                        <div className="text-sm text-[var(--text-secondary)] truncate">
                          → {entry.partner?.username || entry.partner?.email || 'Unknown'}
                        </div>
                      </div>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); handleUnshareWorkspace(entry.id, entry.workspace?.id); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); handleUnshareWorkspace(entry.id, entry.workspace?.id); } }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-red-500 transition-all cursor-pointer"
                        title="Stop sharing"
                      >
                        <Trash2 size={14} />
                      </span>
                    </button>
                  ))}
                  {sharedWithUser.map(entry => (
                    <button
                      key={entry.id}
                      onClick={() => handleSelectSharedWorkspaceEntry(entry)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[var(--bg-secondary)]">
                        <Share className="w-4 h-4 text-[var(--text-secondary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-medium text-[var(--text-primary)] truncate">{entry.workspace?.name || 'Unknown'}</div>
                        <div className="text-sm text-[var(--text-secondary)] truncate">
                          ← {entry.partner?.username || entry.partner?.email || 'Unknown'}
                        </div>
                      </div>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); handleUnshareWorkspace(entry.id, entry.workspace?.id); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); handleUnshareWorkspace(entry.id, entry.workspace?.id); } }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-red-500 transition-all cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action buttons footer */}
          <div className="border-t border-[var(--border-primary)] pt-3 mt-3 grid grid-cols-3 gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex flex-col items-center gap-1.5 py-2.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center group-hover:bg-[var(--accent-primary)]/20 transition-colors">
                <Plus className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">New</span>
            </button>
            <button
              onClick={() => setShowManageModal(true)}
              className="flex flex-col items-center gap-1.5 py-2.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center group-hover:bg-[var(--accent-primary)]/20 transition-colors">
                <Edit className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Edit</span>
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="flex flex-col items-center gap-1.5 py-2.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center group-hover:bg-[var(--accent-primary)]/20 transition-colors">
                <Share className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Share with a friend</span>
            </button>
          </div>
        </div>
      </BaseModal>

      {/* Modals */}
      <WorkspaceCreateModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onWorkspaceCreated={onCreateWorkspace} />
      <ManageWorkspacesModal isOpen={showManageModal} onClose={() => setShowManageModal(false)} workspaces={workspaces} onWorkspaceUpdated={onEditWorkspace} onWorkspaceDeleted={onDeleteWorkspace} />
      {showShareModal && <ShareWorkspaceModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} workspaces={workspaces} friends={friends} currentUserId={currentUserId || ''} onShare={handleShareWorkspace} {...onAddFriend && {
      onAddFriend
    }} />}
    </>;
};
export default WorkspaceModal;