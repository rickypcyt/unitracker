import { BookOpen, Briefcase, Check, Coffee, Edit, FolderOpen, Gamepad2, Heart, Home, Music, Plane, Plus, Share, ShoppingBag, Smartphone, Star, Target, Trophy, Umbrella, User, Users, Wifi, Workflow, Zap } from 'lucide-react';
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

  const handleShareWorkspace = async (
    workspaceId: string,
    recipient: string,
    { onSuccess, onError }: { onSuccess?: () => void; onError?: (message: string) => void }
  ) => {
    try {
      const { error } = await supabase
        .from('shared_workspaces')
        .insert([{ workspace_id: workspaceId, shared_by: currentUserId || '', received_by: recipient }]);
      if (error) {
        onError && onError(error.message);
        return;
      }
      onSuccess && onSuccess();
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
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

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
