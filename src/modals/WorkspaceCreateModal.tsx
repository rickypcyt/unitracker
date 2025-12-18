import { BookOpen, Briefcase, Code, Coffee, Database, FolderOpen, Gamepad2, Globe, Heart, Home, Music, Plane, Settings, ShoppingBag, Smartphone, Star, Target, Trophy, Umbrella, User, Users, Wifi, Workflow, Zap } from 'lucide-react';

import BaseModal from './BaseModal';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

const iconOptions = [
  { name: 'Briefcase', icon: Briefcase },
  { name: 'FolderOpen', icon: FolderOpen },
  { name: 'Home', icon: Home },
  { name: 'Settings', icon: Settings },
  { name: 'User', icon: User },
  { name: 'Users', icon: Users },
  { name: 'Zap', icon: Zap },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Coffee', icon: Coffee },
  { name: 'Gamepad2', icon: Gamepad2 },
  { name: 'Heart', icon: Heart },
  { name: 'Music', icon: Music },
  { name: 'Plane', icon: Plane },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'Smartphone', icon: Smartphone },
  { name: 'Star', icon: Star },
  { name: 'Target', icon: Target },
  { name: 'Trophy', icon: Trophy },
  { name: 'Umbrella', icon: Umbrella },
  { name: 'Wifi', icon: Wifi },
  { name: 'Workflow', icon: Workflow },
  { name: 'Code', icon: Code },
  { name: 'Database', icon: Database },
  { name: 'Globe', icon: Globe },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onWorkspaceCreated: (data: any) => void;
};

const WorkspaceCreateModal = ({ isOpen, onClose, onWorkspaceCreated }: Props) => {
  const [workspaceName, setWorkspaceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth() as any;
  const [selectedIcon, setSelectedIcon] = useState('Briefcase');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      setError('Workspace name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .insert([
          {
            name: workspaceName.trim(),
            user_id: user?.id,
            icon: selectedIcon
          }
        ])
        .select()
        .single();

      if (error) throw error;

      onWorkspaceCreated(data);
      onClose();
    } catch (error) {
      console.error('Error creating workspace:', error);
      setError('Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setWorkspaceName('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Workspace"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2 sm:pt-4">
        <div className="flex items-center gap-3 mb-6">
          {(() => {
            const IconComp = iconOptions.find(opt => opt.name === selectedIcon)?.icon || Briefcase;
            return <IconComp size={24} className="text-[var(--accent-primary)]" />;
          })()}
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Create New Workspace</h2>
        </div>
        <div>
            <label htmlFor="workspaceName" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Workspace Name
            </label>
            <input
              type="text"
              id="workspaceName"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
              placeholder="Enter workspace name..."
              autoFocus
            />
        </div>
        <div>
          <div className="text-sm font-medium text-[var(--text-secondary)] mb-3">Choose Icon</div>
          <div className="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-8 gap-2 mb-4">
            {iconOptions.map((option) => {
              const IconComp = option.icon;
              return (
                <button
                  key={option.name}
                  type="button"
                  onClick={() => setSelectedIcon(option.name)}
                  className={`group relative p-3 rounded-xl border-2 transition-all duration-200 ${
                    selectedIcon === option.name
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/15 shadow-sm shadow-[var(--accent-primary)]/20'
                      : 'border-[var(--border-primary)]'
                  }`}
                  title={option.name}
                  aria-label={`Select ${option.name} icon`}
                  aria-pressed={selectedIcon === option.name}
                >
                  <IconComp 
                    size={20} 
                    className={`transition-colors duration-200 ${
                      selectedIcon === option.name 
                        ? 'text-[var(--accent-primary)]' 
                        : 'text-[var(--text-secondary)]'
                    }`} 
                  />
                </button>
              );
            })}
          </div>
          <div className="text-xs text-[var(--text-secondary)] text-center">
            Selected: <span className="font-medium text-[var(--text-primary)]">{selectedIcon}</span>
          </div>
        </div>
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-2 border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !workspaceName.trim()}
              className="flex-1 px-4 py-2 text-[var(--accent-primary)] border-2 border-[var(--accent-primary)] bg-transparent rounded-lg hover:bg-[var(--accent-primary)]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
    </BaseModal>
  );
};

export default WorkspaceCreateModal; 