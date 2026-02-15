import { BookOpen, Briefcase, ChevronDown, Coffee, FolderOpen, Gamepad2, Heart, Home, Music, Plane, ShoppingBag, Smartphone, Star, Target, Trophy, Umbrella, User, Users, Wifi, Workflow, Zap } from 'lucide-react';

import { Workspace } from '@/types/workspace';
import WorkspaceModal from '@/modals/WorkspaceModal';
import { useState } from 'react';

interface WorkspaceDropdownProps {
  workspaces: (Workspace & { taskCount?: number })[];
  activeWorkspace: (Workspace & { taskCount?: number }) | null;
  onSelectWorkspace: (workspace: Workspace & { taskCount?: number }) => void;
  onCreateWorkspace: (workspace: Workspace & { taskCount?: number }) => void;
  onEditWorkspace: (workspace: Workspace & { taskCount?: number }) => void;
  onDeleteWorkspace: (workspaceId: string | number) => void;
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

const WorkspaceDropdown: React.FC<WorkspaceDropdownProps> = ({
  workspaces = [],
  activeWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  onRefreshWorkspaces,
}) => {
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);










  return (
    <>
      {/* Desktop Button */}
      <div className="hidden lg:block">
        <button 
          data-tour="workspace-selector"
          onClick={() => setShowWorkspaceModal(true)}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-md transition-colors border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] antialiased focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] relative"
          aria-label={`Workspace selector. Current workspace: ${activeWorkspace?.name || 'None'}. Click to open workspace selector.`}
        >
          {(() => {
            const IconComp = iconOptions[activeWorkspace?.icon || 'Briefcase'] || Briefcase;
            return <IconComp className="w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5" />;
          })()}
          <span className="font-medium truncate max-w-[140px] text-[13px] sm:text-sm md:text-base">{activeWorkspace?.name || 'Select Workspace'}</span>
          <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-4 lg:h-4" />
        </button>
      </div>
      
      {/* Mobile Button */}
      <div className="lg:hidden flex-shrink-0">
        <button 
          onClick={() => setShowWorkspaceModal(true)}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none p-2 rounded-lg antialiased focus:ring-2 focus:ring-[var(--accent-primary)] relative"
          aria-label={`Workspace selector. Current workspace: ${activeWorkspace?.name || 'None'}. Click to open workspace selector.`}
        >
          {(() => {
            const IconComp = iconOptions[activeWorkspace?.icon || 'Briefcase'] || Briefcase;
            return <IconComp className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" />;
          })()}
        </button>
      </div>
      
      {/* Workspace Modal */}
      <WorkspaceModal
        isOpen={showWorkspaceModal}
        onClose={() => setShowWorkspaceModal(false)}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={onSelectWorkspace}
        onCreateWorkspace={onCreateWorkspace}
        onEditWorkspace={onEditWorkspace}
        onDeleteWorkspace={onDeleteWorkspace}
        {...(onRefreshWorkspaces && { onRefreshWorkspaces })}
      />
    </>
  );
};

export default WorkspaceDropdown; 