import { Briefcase, Edit, FolderOpen, Home, Settings, User, Users, Zap } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useModalClose } from '@/hooks/useModalClose';

const iconOptions = [
  { name: 'Briefcase', icon: Briefcase },
  { name: 'FolderOpen', icon: FolderOpen },
  { name: 'Home', icon: Home },
  { name: 'Settings', icon: Settings },
  { name: 'User', icon: User },
  { name: 'Users', icon: Users },
  { name: 'Zap', icon: Zap },
];

const WorkspaceEditModal = ({ isOpen, onClose, workspace, onWorkspaceUpdated }) => {
  const [workspaceName, setWorkspaceName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Briefcase');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (workspace) {
      setWorkspaceName(workspace.name || '');
      setSelectedIcon(workspace.icon || 'Briefcase');
    }
  }, [workspace]);

  const handleSubmit = async (e) => {
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
        .update({
          name: workspaceName.trim(),
          icon: selectedIcon
        })
        .eq('id', workspace.id)
        .select()
        .single();
      if (error) throw error;
      onWorkspaceUpdated(data);
      onClose();
    } catch (error) {
      setError('Failed to update workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setWorkspaceName('');
    setSelectedIcon('Briefcase');
    setError('');
    onClose();
  };

  const modalRef = useRef();
  useModalClose(modalRef, handleClose);

  if (!isOpen || !workspace) return null;

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div ref={modalRef} className="bg-[var(--bg-primary)] rounded-xl p-4 w-full max-w-md mx-4 border border-[var(--border-primary)]">
        <div className="flex items-center gap-3 mb-6">
          <Edit size={24} className="text-[var(--accent-primary)]" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Edit Workspace</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Workspace Icon
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {iconOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.name}
                    type="button"
                    onClick={() => setSelectedIcon(option.name)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedIcon === option.name
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                        : 'border-[var(--border-primary)] hover:border-[var(--accent-primary)]'
                    }`}
                  >
                    <IconComponent
                      size={20}
                      className={selectedIcon === option.name ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}
                    />
                  </button>
                );
              })}
            </div>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !workspaceName.trim()}
              className="flex-1 px-4 py-2 text-[var(--accent-primary)] border border-[var(--accent-primary)] bg-transparent rounded-lg hover:bg-[var(--accent-primary)]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Updating...' : 'Update Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkspaceEditModal; 