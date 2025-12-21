import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import { BookOpen, Briefcase, Check, ChevronDown, Coffee, Edit, FolderOpen, Gamepad2, Heart, Home, Music, Plane, Plus, Share, ShoppingBag, Smartphone, Star, Target, Trophy, Umbrella, User, Users, Wifi, Workflow, Zap } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import ManageWorkspacesModal from '@/modals/ManageWorkspacesModal';
import ShareWorkspaceModal from '@/modals/ShareWorkspaceModal';
import { Workspace } from '@/types/workspace';
import WorkspaceCreateModal from '@/modals/WorkspaceCreateModal';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/store/appStore';

interface Friend {
  id: string;
  username?: string;
  email?: string;
  avatar_url?: string;
}

interface User {
  id: string;
  // Add other user properties as needed
}

interface WorkspaceDropdownProps {
  workspaces: (Workspace & { taskCount?: number })[];
  activeWorkspace: (Workspace & { taskCount?: number }) | null;
  onSelectWorkspace: (workspace: Workspace & { taskCount?: number }) => void;
  onCreateWorkspace: (workspace: Workspace & { taskCount?: number }) => void;
  onEditWorkspace: (workspace: Workspace & { taskCount?: number }) => void;
  onDeleteWorkspace: (workspaceId: string | number) => void;
  friends?: Friend[] | undefined;
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

// Key para localStorage (unificado con workspaceSlice)
const LAST_WORKSPACE_KEY = 'activeWorkspaceId';

interface User {
  id: string;
  // Add other user properties as needed
}

interface WorkspaceDropdownProps {
  workspaces: (Workspace & { taskCount?: number })[];
  activeWorkspace: (Workspace & { taskCount?: number }) | null;
  onSelectWorkspace: (workspace: Workspace & { taskCount?: number }) => void;
  onCreateWorkspace: (workspace: Workspace & { taskCount?: number }) => void;
  onEditWorkspace: (workspace: Workspace & { taskCount?: number }) => void;
  onDeleteWorkspace: (workspaceId: string | number) => void;
  friends?: Friend[] | undefined;
}

const WorkspaceDropdown: React.FC<WorkspaceDropdownProps> = ({
  workspaces = [],
  activeWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  friends,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { user } = useAuth();

  const getTaskCountByWorkspace = (ws: Workspace & { taskCount?: number }) => {
    const count = ws.taskCount || 0;
    return count;
  };

  // Restaurar workspace seleccionado al montar (si Redux aún no lo tiene)
  useEffect(() => {
    if (!activeWorkspace && workspaces.length > 0) {
      const lastId = localStorage.getItem(LAST_WORKSPACE_KEY);
      if (lastId) {
        const found = workspaces.find(ws => ws.id === lastId);
        if (found) {
          onSelectWorkspace(found);
        }
      }
    }
  }, [workspaces, activeWorkspace, onSelectWorkspace]);

  const handleShareWorkspace = async (
    workspaceId: string,
    receivedBy: string,
    sharedBy: string,
    { onSuccess, onError }: { onSuccess?: () => void; onError?: (message: string) => void }
  ) => {
    try {
      const { error } = await supabase
        .from('shared_workspaces')
        .insert([{ workspace_id: workspaceId, shared_by: sharedBy, received_by: receivedBy }]);
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

  // Si friends no está definido, muestra advertencia
  if (!friends) {
    console.warn('WorkspaceDropdown: friends prop is missing. The autocomplete for friends will be empty.');
  }

  // Envolver onSelectWorkspace para guardar en localStorage
  const handleSelectWorkspace = useCallback((ws: Workspace) => {
    console.log('handleSelectWorkspace called with workspace:', ws);
    
    if (activeWorkspace?.id === ws.id) {
      console.log('Workspace already selected, ignoring');
      return; // no-op si ya está seleccionado
    }
    
    console.log('Saving workspace to localStorage:', ws.id);
    localStorage.setItem(LAST_WORKSPACE_KEY, ws.id.toString());
    
    console.log('Calling onSelectWorkspace with:', ws);
    onSelectWorkspace(ws);
  }, [activeWorkspace?.id, onSelectWorkspace]);

  // Handle workspace switching with Ctrl+Arrow keys
  const handleWorkspaceKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    console.log('Key pressed:', e.key, 'Ctrl pressed:', e.ctrlKey);
    console.log('Current workspaces:', workspaces);
    console.log('Current active workspace:', activeWorkspace);
    
    // Only proceed if Ctrl key is pressed
    if (!e.ctrlKey) {
      console.log('Ctrl key not pressed, ignoring');
      return;
    }
    
    if (workspaces.length <= 1) {
      console.log('Only one workspace, nothing to switch');
      return; // No need to switch if there's only one workspace
    }
    
    const currentIndex = workspaces.findIndex(ws => ws.id === activeWorkspace?.id);
    console.log('Current workspace index:', currentIndex);
    
    if (currentIndex === -1) {
      console.log('Current workspace not found in workspaces array');
      return;
    }

    let nextIndex = currentIndex;
    let direction = '';
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % workspaces.length;
        direction = 'next';
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = (currentIndex - 1 + workspaces.length) % workspaces.length;
        direction = 'previous';
        break;
      default:
        console.log('Key not handled:', e.key);
        return; // Exit if it's not an arrow key
    }
    
    const nextWorkspace = workspaces[nextIndex];
    console.log(`Switching to ${direction} workspace:`, nextWorkspace?.name || 'none');
    
    if (nextWorkspace) {
      console.log('Calling handleSelectWorkspace with:', nextWorkspace);
      handleSelectWorkspace(nextWorkspace);
    } else {
      console.error('Next workspace is undefined at index:', nextIndex);
    }
  }, [workspaces, activeWorkspace, handleSelectWorkspace]);

  // Handle keyboard navigation inside dropdown
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
  }, [focusedIndex, workspaces]);

  // Reset focused index when dropdown closes
  useEffect(() => {
    if (!showCreateModal && !showManageModal && !showShareModal) {
      setFocusedIndex(-1);
    }
  }, [showCreateModal, showManageModal, showShareModal]);


  return (
    <>
      {/* Desktop Dropdown */}
      <div className="hidden lg:block">
        <DropdownMenu.Root onOpenChange={(open) => {
          if (open) {
            // Reset focus when dropdown opens
            setTimeout(() => {
              const firstItem = itemRefs.current[0];
              if (firstItem) {
                firstItem.focus();
                setFocusedIndex(0);
              }
            }, 0);
          } else {
            setFocusedIndex(-1);
          }
        }}>
          <DropdownMenu.Trigger asChild>
            <button 
              className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-md transition-colors border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] antialiased focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] relative"
              onKeyDown={handleWorkspaceKeyDown}
              tabIndex={0}
              aria-label={`Workspace selector. Current workspace: ${activeWorkspace?.name || 'None'}. Use Ctrl+Arrow Up/Down to switch workspaces. Scroll to switch workspace.`}
            >
              {(() => {
                const IconComp = iconOptions[activeWorkspace?.icon || 'Briefcase'] || Briefcase;
                return <IconComp className="w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5" />;
              })()}
              <span className="font-medium truncate max-w-[140px] text-[13px] sm:text-sm md:text-base">{activeWorkspace?.name || 'Select Workspace'}</span>
              <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-4 lg:h-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="min-w-[180px] sm:min-w-[220px] max-w-[90vw] rounded-lg p-1 w-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] z-[10001] animate-in fade-in zoom-in-95 antialiased text-[12px] sm:text-sm md:text-sm lg:text-base" sideOffset={5} align="end" collisionPadding={10}>
              {[...workspaces].sort((a, b) => a.name.localeCompare(b.name)).map((ws, i) => (
                <DropdownMenu.Item
                  key={ws.id}
                  ref={el => { itemRefs.current[i] = el; }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setFocusedIndex(i)}
                  tabIndex={-1}
                  onClick={() => handleSelectWorkspace(ws)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-md cursor-pointer outline-none transition-colors text-[12px] sm:text-sm md:text-sm lg:text-base ${activeWorkspace?.id === ws.id ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'} focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-50`}
                >
                  {(() => {
                    const IconComp = iconOptions[ws.icon || 'Briefcase'] || Briefcase;
                    return <IconComp className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-4 lg:h-4" />;
                  })()}
                  <span className="flex-1 break-words">{ws.name} <span className="text-[11px] sm:text-[12px] md:text-sm lg:text-sm text-[var(--text-secondary)]">({getTaskCountByWorkspace(ws)})</span></span>
                  {activeWorkspace?.id === ws.id && <Check className="text-[var(--accent-primary)] w-3.5 h-3.5 md:w-4 md:h-4" />}
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Separator className="h-px bg-[var(--border-primary)] my-1" />
              <DropdownMenu.Item
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-[13px] md:text-sm lg:text-base text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                New workspace
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() => setShowManageModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-[13px] md:text-sm lg:text-base text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Edit workspaces
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-[13px] md:text-sm lg:text-base text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Share className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Share workspace
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      {/* Mobile Dropdown */}
      <div className="lg:hidden flex-shrink-0">
        <DropdownMenu.Root onOpenChange={(open) => {
          if (open) {
            // Reset focus when dropdown opens
            setTimeout(() => {
              const firstItem = itemRefs.current[0];
              if (firstItem) {
                firstItem.focus();
                setFocusedIndex(0);
              }
            }, 0);
          } else {
            setFocusedIndex(-1);
          }
        }}>
          <DropdownMenu.Trigger asChild>
            <button 
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none p-2 rounded-lg antialiased focus:ring-2 focus:ring-[var(--accent-primary)] relative"
              onKeyDown={handleWorkspaceKeyDown}
              tabIndex={0}
              aria-label={`Workspace selector. Current workspace: ${activeWorkspace?.name || 'None'}. Use Ctrl+Arrow Up/Down to switch workspaces. Scroll to switch workspace.`}
            >
              {(() => {
                const IconComp = iconOptions[activeWorkspace?.icon || 'Briefcase'] || Briefcase;
                return <IconComp className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" />;
              })()}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="min-w-[160px] sm:min-w-[220px] max-w-[90vw] rounded-lg p-1 w-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] z-[10001] animate-in fade-in zoom-in-95 antialiased text-[11px] sm:text-[12px] md:text-sm lg:text-base" sideOffset={5} align="end" collisionPadding={10}>
              {[...workspaces].sort((a, b) => a.name.localeCompare(b.name)).map((ws, i) => (
                <DropdownMenu.Item
                  key={ws.id}
                  ref={el => { itemRefs.current[i] = el; }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setFocusedIndex(i)}
                  tabIndex={-1}
                  onClick={() => handleSelectWorkspace(ws)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-md cursor-pointer outline-none transition-colors text-[11px] sm:text-[12px] md:text-sm lg:text-base ${activeWorkspace?.id === ws.id ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'} focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-50`}
                >
                  {(() => {
                    const IconComp = iconOptions[ws.icon || 'Briefcase'] || Briefcase;
                    return <IconComp className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-4 lg:h-4" />;
                  })()}
                  <span className="flex-1 break-words">{ws.name} <span className="text-[10px] sm:text-[11px] md:text-sm lg:text-sm text-[var(--text-secondary)]">({getTaskCountByWorkspace(ws)})</span></span>
                  {activeWorkspace?.id === ws.id && <Check className="text-[var(--accent-primary)] w-3.5 h-3.5 md:w-4 md:h-4" />}
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Separator className="h-px bg-[var(--border-primary)] my-1" />
              <DropdownMenu.Item
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-[11px] sm:text-[12px] md:text-sm lg:text-base text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                New workspace
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() => setShowManageModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-[11px] sm:text-[12px] md:text-sm lg:text-base text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Edit workspaces
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-[11px] sm:text-[12px] md:text-sm lg:text-base text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Share className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Share workspace
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
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
          friends={friends || []}
          currentUserId={user?.id}
          onShare={handleShareWorkspace}
        />
      )}
    </>
  );
};

export default WorkspaceDropdown; 