import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import { BookOpen, Briefcase, Check, ChevronDown, Coffee, Edit, FolderOpen, Gamepad2, Heart, Home, Music, Plane, Plus, Settings, Share, ShoppingBag, Smartphone, Star, Target, Trophy, Umbrella, User, Users, Wifi, Workflow, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

import ManageWorkspacesModal from '@/modals/ManageWorkspacesModal';
import ShareWorkspaceModal from '@/modals/ShareWorkspaceModal';
import WorkspaceCreateModal from '@/modals/WorkspaceCreateModal';
import { supabase } from '@/utils/supabaseClient';
import { useSelector } from 'react-redux';

const iconOptions = {
  Briefcase,
  FolderOpen,
  Home,
  Settings,
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

const WorkspaceDropdown = ({
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

  const user = useSelector(state => state.auth.user);

  const getTaskCountByWorkspace = ws => ws.taskCount || 0;

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

  const handleShareWorkspace = async (workspaceId, receivedBy, sharedBy, { onSuccess, onError }) => {
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
      onError && onError(err.message);
    }
  };

  // Si friends no está definido, muestra advertencia
  if (!friends) {
    console.warn('WorkspaceDropdown: friends prop is missing. The autocomplete for friends will be empty.');
  }

  // Envolver onSelectWorkspace para guardar en localStorage
  const handleSelectWorkspace = (ws) => {
    if (activeWorkspace?.id === ws.id) return; // no-op si ya está seleccionado
    localStorage.setItem(LAST_WORKSPACE_KEY, ws.id);
    onSelectWorkspace(ws);
  };

  return (
    <>
      {/* Desktop Dropdown */}
      <div className="hidden lg:block">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-md transition-colors border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] antialiased">
              {(() => {
                const IconComp = iconOptions[activeWorkspace?.icon] || Briefcase;
                return <IconComp className="w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5" />;
              })()}
              <span className="font-medium truncate max-w-[140px] text-[13px] sm:text-sm md:text-base">{activeWorkspace?.name || 'Area'}</span>
              <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-4 lg:h-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="min-w-[180px] sm:min-w-[220px] max-w-[90vw] rounded-lg p-1 w-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] z-[10000] animate-in fade-in0 zoom-in-95 antialiased text-[12px] sm:text-sm md:text-sm lg:text-base" sideOffset={5} align="end" collisionPadding={10}>
              {[...workspaces].sort((a, b) => a.name.localeCompare(b.name)).map(ws => (
                <DropdownMenu.Item
                  key={ws.id}
                  onClick={() => handleSelectWorkspace(ws)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-md cursor-pointer outline-none transition-colors text-[12px] sm:text-sm md:text-sm lg:text-base ${activeWorkspace?.id === ws.id ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'}`}
                >
                  {(() => {
                    const IconComp = iconOptions[ws.icon] || Briefcase;
                    return <IconComp className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-4 lg:h-4" />;
                  })()}
                  <span className="flex-1 break-words">{ws.name} <span className="text-[11px] sm:text-[12px] md:text-xs lg:text-sm text-[var(--text-secondary)]">({getTaskCountByWorkspace(ws)})</span></span>
                  {activeWorkspace?.id === ws.id && <Check className="text-[var(--accent-primary)] w-3.5 h-3.5 md:w-4 md:h-4" />}
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Separator className="h-px bg-[var(--border-primary)] my-1" />
              <DropdownMenu.Item
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-[13px] md:text-sm lg:text-base text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                New area
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() => setShowManageModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-[13px] md:text-sm lg:text-base text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Edit areas
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-[13px] md:text-sm lg:text-base text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Share className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Share area
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      {/* Mobile Dropdown */}
      <div className="lg:hidden flex-shrink-0">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none p-2 rounded-lg antialiased">
              {(() => {
                const IconComp = iconOptions[activeWorkspace?.icon] || Briefcase;
                return <IconComp className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" />;
              })()}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="min-w-[160px] sm:min-w-[220px] max-w-[90vw] rounded-lg p-1 w-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] z-[10000] animate-in fade-in0 zoom-in-95 antialiased text-[11px] sm:text-[12px] md:text-sm lg:text-base" sideOffset={5} align="end" collisionPadding={10}>
              {[...workspaces].sort((a, b) => a.name.localeCompare(b.name)).map(ws => (
                <DropdownMenu.Item
                  key={ws.id}
                  onClick={() => handleSelectWorkspace(ws)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-md cursor-pointer outline-none transition-colors text-[11px] sm:text-[12px] md:text-sm lg:text-base ${activeWorkspace?.id === ws.id ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'}`}
                >
                  {(() => {
                    const IconComp = iconOptions[ws.icon] || Briefcase;
                    return <IconComp className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-4 lg:h-4" />;
                  })()}
                  <span className="flex-1 break-words">{ws.name} <span className="text-[10px] sm:text-[11px] md:text-xs lg:text-sm text-[var(--text-secondary)]">({getTaskCountByWorkspace(ws)})</span></span>
                  {activeWorkspace?.id === ws.id && <Check className="text-[var(--accent-primary)] w-3.5 h-3.5 md:w-4 md:h-4" />}
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Separator className="h-px bg-[var(--border-primary)] my-1" />
              <DropdownMenu.Item
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-[11px] sm:text-[12px] md:text-sm lg:text-base text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                New area
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() => setShowManageModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-[11px] sm:text-[12px] md:text-sm lg:text-base text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Edit areas
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-[11px] sm:text-[12px] md:text-sm lg:text-base text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Share className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Share area
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
          friends={friends}
          currentUserId={user?.id}
          onShare={handleShareWorkspace}
        />
      )}
    </>
  );
};

export default WorkspaceDropdown; 