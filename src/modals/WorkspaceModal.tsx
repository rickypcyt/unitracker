import { BookOpen, Briefcase, Check, Coffee, Edit, FolderOpen, Gamepad2, Heart, Home, Loader2, Music, Plane, Plus, Share, ShoppingBag, Smartphone, Star, Target, Trash2, Trophy, Umbrella, User, Users, Wifi, Workflow, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import BaseModal from './BaseModal';
import ManageWorkspacesModal from '@/modals/ManageWorkspacesModal';
import ShareWorkspaceModal from '@/modals/ShareWorkspaceModal';
import { Workspace } from '@/types/workspace';
import WorkspaceCreateModal from '@/modals/WorkspaceCreateModal';
import { supabase } from '@/utils/supabaseClient';

// Constant for the "All" workspace
const ALL_WORKSPACE_ID = 'all';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: (Workspace & { taskCount?: number })[];
  activeWorkspace: (Workspace & { taskCount?: number }) | null;
  onSelectWorkspace: (workspace: Workspace & { taskCount?: number }) => void;
  onCreateWorkspace: (workspace: Workspace & { taskCount?: number }) => void;
  onEditWorkspace: (workspace: Workspace & { taskCount?: number }) => void;
  onDeleteWorkspace: (workspaceId: string | number) => void;
  currentUserId?: string;
  friends?: any[];
  onAddFriend?: () => void;
  onRefreshWorkspaces?: () => void;
}

const iconOptions: { [key: string]: React.ComponentType<any> } = {
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
  Workflow,
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
  onRefreshWorkspaces,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [sharedByUser, setSharedByUser] = useState<any[]>([]);
  const [sharedWithUser, setSharedWithUser] = useState<any[]>([]);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [sharedError, setSharedError] = useState<string | null>(null);
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

      const currentFriends = friendsRef.current ?? [];

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
  const getTaskCountByWorkspace = (ws: Workspace & { taskCount?: number }) => {
    return ws.taskCount || 0;
  };

  const handleUnshareWorkspace = async (shareId: string, removedWorkspaceId?: string | number) => {
    try {
      const { error } = await supabase
        .from('shared_workspaces')
        .delete()
        .eq('id', shareId);
      
      if (error) {
        console.error('Error unsharing workspace:', error);
        // Could add toast notification here
      } else {
        console.log('Workspace unshared successfully');
        // Could add success toast here
      }

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

        onSelectWorkspace(fallbackWorkspace as Workspace & { taskCount?: number });
      }
      await fetchSharedWorkspaces();
    } catch (error) {
      console.error('Error unsharing workspace:', error);
    }
  };

  const handleShareWorkspace = async (
    workspaceId: string,
    recipient: string,
    { onSuccess, onError }: { onSuccess?: () => void; onError?: (message: string) => void }
  ) => {
    try {
      // Find the workspace to get its name and icon
      const workspace = workspacesRef.current.find(ws => String(ws.id) === workspaceId);
      
      const { error } = await supabase
        .from('shared_workspaces')
        .insert([{ 
          workspace_id: workspaceId, 
          shared_by: currentUserId || '', 
          received_by: recipient,
          user_id: recipient,
          workspace_name: workspace?.name || 'Shared workspace',
          workspace_icon: workspace?.icon || 'Briefcase'
        }]);
      if (error) {
        if (error.message?.toLowerCase().includes('duplicate')) {
          onError && onError('This workspace is already shared with that user.');
        } else {
          onError && onError(error.message);
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

  const handleSelectWorkspace = useCallback((ws: Workspace & { taskCount?: number }) => {
    console.log('handleSelectWorkspace called with workspace:', ws);
    
    if (activeWorkspace?.id === ws.id) {
      console.log('Workspace already selected, closing modal');
      onClose();
      return;
    }
    
    console.log('Saving workspace to localStorage:', ws.id);
    localStorage.setItem('activeWorkspaceId', ws.id.toString());
    
    console.log('Calling onSelectWorkspace with:', ws);
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

  const handleSelectSharedWorkspaceEntry = useCallback(
    (entry: any) => {
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
        sharedBy: entry?.partner?.id || entry?.shared_by || null,
      };

      handleSelectWorkspace((matchedWorkspace || fallbackWorkspace) as Workspace & { taskCount?: number });
    },
    [handleSelectWorkspace]
  );

  const sortedWorkspaces = useMemo(() => {
    // Create the "All" workspace
    const allWorkspace = {
      id: ALL_WORKSPACE_ID,
      name: 'All',
      icon: 'Workflow', // Using Workflow icon for "All"
      taskCount: workspaces.reduce((sum, ws) => sum + (ws.taskCount || 0), 0)
    };
    
    // Return "All" workspace first, then sorted workspaces
    return [allWorkspace, ...workspaces.sort((a, b) => a.name.localeCompare(b.name))];
  }, [workspaces]);

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Select Workspace"
        maxWidth="max-w-md"
      >
        <div className="space-y-2" onKeyDown={handleKeyDown}>
          {sortedWorkspaces.map((ws: any, i: number) => (
            <button
              key={ws.id}
              ref={el => { itemRefs.current[i] = el; }}
              onClick={() => handleSelectWorkspace(ws)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                activeWorkspace?.id === ws.id
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                  : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5'
              }`}
            >
              {(() => {
                const IconComp = iconOptions[ws.icon || 'Briefcase'] || Briefcase;
                return <IconComp className="w-5 h-5 text-[var(--text-primary)]" />;
              })()}
              <div className="flex-1 text-left">
                <span className={`font-medium ${
                  activeWorkspace?.id === ws.id
                    ? 'text-[var(--accent-primary)]'
                    : 'text-[var(--text-primary)]'
                }`}>
                  {ws.name}
                </span>
                <span className="text-sm text-[var(--text-secondary)] ml-2">
                  ({getTaskCountByWorkspace(ws)})
                </span>
              </div>
              {activeWorkspace?.id === ws.id && (
                <Check className="w-5 h-5 text-[var(--accent-primary)]" />
              )}
            </button>
          ))}
          
          <div className="border-t border-[var(--border-primary)] pt-4 mt-4 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Shared Workspaces</h3>
            {sharedLoading ? (
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading shared workspaces...
              </div>
            ) : (
              <>
                {sharedError && (
                  <div className="text-sm text-red-500">{sharedError}</div>
                )}

                {sharedByUser.length === 0 && sharedWithUser.length === 0 && !sharedError ? (
                  <div className="text-sm text-[var(--text-secondary)]">You haven&apos;t shared or received any workspaces yet.</div>
                ) : (
                  <div className="space-y-3">
                    {sharedByUser.length > 0 && (
                      <div className="space-y-2">
                        <ul className="space-y-2">
                          {sharedByUser.map(entry => (
                            <li key={entry.id}>
                              <button
                                onClick={() => handleSelectSharedWorkspaceEntry(entry)}
                                className="w-full flex items-center gap-3 p-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-colors text-left"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-[var(--text-primary)] truncate">{entry.workspace?.name || 'Unknown workspace'}</div>
                                  <div className="text-xs text-[var(--text-secondary)] truncate">
                                    Shared with {entry.partner?.username || entry.partner?.email || entry.partner?.id || 'Unknown user'}
                                  </div>
                                  <div className="text-[0.7rem] text-[var(--text-tertiary)]">Tap to open</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-xs text-[var(--text-secondary)]">
                                    {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : ''}
                                  </div>
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleUnshareWorkspace(entry.id, entry.workspace?.id);
                                    }}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleUnshareWorkspace(entry.id, entry.workspace?.id);
                                      }
                                    }}
                                    className="p-1 rounded hover:bg-red-500/10 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                                    title="Stop sharing"
                                  >
                                    <Trash2 size={14} />
                                  </span>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {sharedWithUser.length > 0 && (
                      <div className="space-y-2">
                        <ul className="space-y-2">
                          {sharedWithUser.map(entry => (
                            <li key={entry.id}>
                              <button
                                onClick={() => handleSelectSharedWorkspaceEntry(entry)}
                                className="w-full flex items-center gap-3 p-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-colors text-left"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-[var(--text-primary)] truncate">{entry.workspace?.name || 'Unknown workspace'}</div>
                                  <div className="text-xs text-[var(--text-secondary)] truncate">
                                    Shared by {entry.partner?.username || entry.partner?.email || entry.partner?.id || 'Unknown user'}
                                  </div>
                                  <div className="text-[0.7rem] text-[var(--text-tertiary)]">Tap to open</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-xs text-[var(--text-secondary)]">
                                    {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : ''}
                                  </div>
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleUnshareWorkspace(entry.id, entry.workspace?.id);
                                    }}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleUnshareWorkspace(entry.id, entry.workspace?.id);
                                      }
                                    }}
                                    className="p-1 rounded hover:bg-red-500/10 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                                    title="Remove from shared workspaces"
                                  >
                                    <Trash2 size={14} />
                                  </span>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="border-t border-[var(--border-primary)] pt-4 mt-4 space-y-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-all duration-200"
            >
              <Plus className="w-5 h-5 text-[var(--accent-primary)]" />
              <span className="font-medium text-[var(--accent-primary)]">New workspace</span>
            </button>
            
            <button
              onClick={() => setShowManageModal(true)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-all duration-200"
            >
              <Edit className="w-5 h-5 text-[var(--accent-primary)]" />
              <span className="font-medium text-[var(--accent-primary)]">Edit workspaces</span>
            </button>
            
            <button
              onClick={() => setShowShareModal(true)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-all duration-200"
            >
              <Share className="w-5 h-5 text-[var(--accent-primary)]" />
              <span className="font-medium text-[var(--accent-primary)]">Share workspace</span>
            </button>
          </div>
        </div>
      </BaseModal>

      {/* Modals */}
      <WorkspaceCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onWorkspaceCreated={onCreateWorkspace}
      />
      <ManageWorkspacesModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        workspaces={workspaces}
        onWorkspaceUpdated={onEditWorkspace}
        onWorkspaceDeleted={onDeleteWorkspace}
      />
      {showShareModal && (
        <ShareWorkspaceModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          workspaces={workspaces}
          friends={friends}
          currentUserId={currentUserId || ''}
          onShare={handleShareWorkspace}
          {...(onAddFriend && { onAddFriend })}
        />
      )}
    </>
  );
};

export default WorkspaceModal;