import { BookOpen, Briefcase, ChevronDown, Coffee, FolderOpen, Gamepad2, Heart, Home, Music, Plane, ShoppingBag, Smartphone, Star, Target, Trophy, Umbrella, User, Users, Wifi, Workflow, Zap } from 'lucide-react';
import { useWorkspace, useWorkspaceActions } from '@/store/appStore';

import { ALL_WORKSPACE_ID } from '@/hooks/useTaskBoard';
import { useState } from 'react';

interface WorkspaceSelectorProps {
  className?: string;
}

const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({ className = '' }) => {
  const { workspaces, currentWorkspace: activeWorkspace } = useWorkspace();
  const { setCurrentWorkspace } = useWorkspaceActions();
  const [isOpen, setIsOpen] = useState(false);

  // Create workspaces with "All" option
  const allWorkspaces = [
    {
      id: ALL_WORKSPACE_ID,
      name: 'All',
      icon: 'Workflow',
    },
    ...(workspaces || []),
  ];

  const handleSelectWorkspace = (workspace: any) => {
    setCurrentWorkspace(workspace);
    // Save to localStorage to match Navbar behavior
    if (workspace.id === 'all') {
      localStorage.removeItem('activeWorkspaceId');
    } else {
      localStorage.setItem('activeWorkspaceId', workspace.id);
    }
    setIsOpen(false);
  };

  const getWorkspaceIcon = (iconName: string, isActive: boolean = false) => {
    // Icon mapping using lucide-react icons
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      Workflow,
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
    };
    
    const IconComp = iconMap[iconName] || Briefcase;
    return <IconComp className={`w-4 h-4 ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`} />;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-colors"
      >
        <div className="flex items-center gap-3">
          {getWorkspaceIcon(activeWorkspace?.icon || 'Briefcase', true)}
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Workspace: {activeWorkspace?.name || 'Select Workspace'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
            {allWorkspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleSelectWorkspace(workspace)}
                className={`w-full flex items-center gap-3 p-3 hover:bg-[var(--bg-secondary)] transition-colors text-left ${
                  activeWorkspace?.id === workspace.id ? 'bg-[var(--bg-secondary)]' : ''
                }`}
              >
                {getWorkspaceIcon(workspace.icon, activeWorkspace?.id === workspace.id)}
                <span className="text-sm text-[var(--text-primary)]">{workspace.name}</span>
                {activeWorkspace?.id === workspace.id && (
                  <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full ml-auto" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default WorkspaceSelector;
