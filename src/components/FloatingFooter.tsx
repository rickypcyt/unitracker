import { BookOpen, Briefcase, ChevronDown, Coffee, FolderOpen, Gamepad2, Heart, Home, Music, Plane, ShoppingBag, Smartphone, Star, Target, Trophy, Umbrella, User, Users, Wifi, Workflow, Zap } from 'lucide-react';

import { Github } from 'lucide-react';
import { Workspace } from '@/types/workspace';
import WorkspaceModal from '@/modals/WorkspaceModal';
import { useState } from 'react';

interface FloatingFooterProps {
  workspaces?: (Workspace & { taskCount?: number })[];
  activeWorkspace?: (Workspace & { taskCount?: number }) | null;
  onSelectWorkspace?: (workspace: Workspace & { taskCount?: number }) => void;
  onCreateWorkspace?: (workspace: Workspace & { taskCount?: number }) => void;
  onEditWorkspace?: (workspace: Workspace & { taskCount?: number }) => void;
  onDeleteWorkspace?: (workspaceId: string | number) => void;
  onRefreshWorkspaces?: () => void;
  friends?: any[];
  currentUserId?: string;
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

const FloatingFooter: React.FC<FloatingFooterProps> = ({
  workspaces = [],
  activeWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  onRefreshWorkspaces,
  friends = [],
  currentUserId,
}) => {
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999]">
        <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-[var(--border-primary)]/70 bg-[var(--bg-primary)]/70 backdrop-blur-[12px] shadow-[0_12px_30px_rgba(15,23,42,0.35)] text-[var(--text-secondary)]">
          <a
            href="https://github.com/rickypcyt/unitracker"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-colors"
          >
            <Github className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">GitHub</span>
          </a>
          
          <span className="w-px h-4 bg-[var(--border-primary)]" aria-hidden="true" />
          
          <a
            href="https://discord.gg/8sRswbPQQm"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-colors"
          >
            <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" aria-hidden="true">
              <title>Discord</title>
              <path fill="currentColor" d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
            </svg>
            <span className="hidden sm:inline text-sm font-medium">Discord</span>
          </a>
          
          <span className="w-px h-4 bg-[var(--border-primary)]" aria-hidden="true" />
          
          {/* Workspace selector */}
          <button 
            onClick={() => setShowWorkspaceModal(true)}
            className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-colors"
            aria-label={`Workspace selector. Current workspace: ${activeWorkspace?.name || 'None'}. Click to open workspace selector.`}
            title={activeWorkspace?.name || 'Select Workspace'}
          >
            {(() => {
              const IconComp = iconOptions[activeWorkspace?.icon || 'Briefcase'] || Briefcase;
              return <IconComp className="w-5 h-5" />;
            })()}
            <span className="hidden sm:inline text-sm font-medium">
              {activeWorkspace?.name || 'Select Workspace'}
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Workspace Modal */}
      <WorkspaceModal
        isOpen={showWorkspaceModal}
        onClose={() => setShowWorkspaceModal(false)}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace || null}
        onSelectWorkspace={onSelectWorkspace || (() => {})}
        onCreateWorkspace={onCreateWorkspace || (() => {})}
        onEditWorkspace={onEditWorkspace || (() => {})}
        onDeleteWorkspace={onDeleteWorkspace || (() => {})}
        {...(onRefreshWorkspaces && { onRefreshWorkspaces })}
        friends={friends}
        {...(currentUserId && { currentUserId })}
      />
    </>
  );
};

export default FloatingFooter;
