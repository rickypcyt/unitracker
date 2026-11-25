import { BookOpen, Briefcase, ChevronDown, Coffee, FolderOpen, Gamepad2, Heart, Home, Music, Plane, ShoppingBag, Smartphone, Star, Target, Trophy, Umbrella, User, Users, Wifi, Workflow, Zap } from 'lucide-react';

import { useState } from 'react';
import { useWorkspace } from '@/store/appStore';

interface LocalWorkspaceSelectorProps {
  selectedWorkspace: any;
  onWorkspaceChange: (workspace: any) => void;
  className?: string;
}

const LocalWorkspaceSelector: React.FC<LocalWorkspaceSelectorProps> = ({ 
  selectedWorkspace, 
  onWorkspaceChange, 
  className = '' 
}) => {
  const { workspaces } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);

  // Create workspaces list (exclude "All" option for task creation)
  const allWorkspaces = workspaces || [];

  const handleSelectWorkspace = (workspace: any) => {
    onWorkspaceChange(workspace);
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
    return <IconComp className={`w-4 h-4 ${isActive ? 'text-(--accent-primary)' : 'text-(--text-primary)'}`} />;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 rounded-lg border-2 border-(--border-primary) bg-(--bg-secondary) hover:bg-(--bg-primary) transition-colors"
      >
        <div className="flex items-center gap-3">
          {getWorkspaceIcon(selectedWorkspace?.icon || 'Briefcase', true)}
          <span className="text-sm font-medium text-(--text-primary)">
            Create in: {selectedWorkspace?.name || 'Select Workspace'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-(--text-secondary) transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-(--bg-primary) border-2 border-(--border-primary) rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
            {allWorkspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleSelectWorkspace(workspace)}
                className={`w-full flex items-center gap-3 p-3 hover:bg-(--bg-secondary) transition-colors text-left ${
                  selectedWorkspace?.id === workspace.id ? 'bg-(--bg-secondary)' : ''
                }`}
              >
                {getWorkspaceIcon(workspace.icon ?? "", selectedWorkspace?.id === workspace.id)}
                <span className="text-sm text-(--text-primary)">{workspace.name}</span>
                {selectedWorkspace?.id === workspace.id && (
                  <div className="w-2 h-2 bg-(--accent-primary) rounded-full ml-auto" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LocalWorkspaceSelector;
