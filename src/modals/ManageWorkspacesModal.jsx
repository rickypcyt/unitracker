import { BookOpen, Briefcase, Coffee, Edit, FolderOpen, Gamepad2, Heart, Home, Music, Plane, Save, Settings, ShoppingBag, Smartphone, Star, Target, Trash2, Trophy, Umbrella, User, Users, Wifi, Workflow, X, Zap } from 'lucide-react';
import React, { useRef, useState } from 'react';

import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useModalClose } from '@/hooks/useModalClose';
import { useSelector } from 'react-redux';

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
];

const ManageWorkspacesModal = ({ isOpen, onClose, workspaces, onWorkspaceUpdated, onWorkspaceDeleted }) => {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('Briefcase');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedIconSelector, setExpandedIconSelector] = useState(null);
  const { user } = useAuth();
  const tasks = useSelector(state => state.tasks.tasks);

  // Función para contar tareas por workspace
  const getTaskCountByWorkspace = (workspaceId) => {
    return tasks.filter(task => task.workspace_id === workspaceId && !task.completed).length;
  };

  const handleEdit = (workspace) => {
    setEditingId(workspace.id);
    setEditName(workspace.name);
    setEditIcon(workspace.icon || 'Briefcase');
    setError('');
  };

  const handleSave = async (workspace) => {
    if (!editName.trim()) {
      setError('Workspace name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .update({
          name: editName.trim(),
          icon: editIcon
        })
        .eq('id', workspace.id)
        .select()
        .single();

      if (error) throw error;

      onWorkspaceUpdated(data);
      setEditingId(null);
      setEditName('');
      setEditIcon('Briefcase');
    } catch (error) {
      console.error('Error updating workspace:', error);
      setError('Failed to update workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (workspace) => {
    if (!window.confirm(`Are you sure you want to delete "${workspace.name}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspace.id);

      if (error) throw error;

      onWorkspaceDeleted(workspace.id);
      if (editingId === workspace.id) {
        setEditingId(null);
        setEditName('');
        setEditIcon('Briefcase');
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
      setError('Failed to delete workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditName('');
    setEditIcon('Briefcase');
    setError('');
  };

  const handleKeyPress = (e, workspace) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(workspace);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleClose = () => {
    handleCancel();
    onClose();
  };

  const modalRef = useRef();
  useModalClose(modalRef, handleClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div ref={modalRef} className="bg-[var(--bg-primary)] rounded-xl p-4 w-full max-w-2xl mx-4 border border-[var(--border-primary)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Edit size={24} className="text-[var(--accent-primary)]" />
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Manage Workspaces</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {workspaces.map((workspace) => {
            const isEditing = editingId === workspace.id;
            const IconComponent = iconOptions.find(opt => opt.name === workspace.icon)?.icon || Briefcase;
            return (
              <div key={workspace.id}>
                <div className="flex items-center gap-3 p-3 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)]">
                  <div className="flex-shrink-0">
                    {isEditing ? (
                      <div className="relative">
                        <button
                          onClick={() => setExpandedIconSelector(expandedIconSelector === workspace.id ? null : workspace.id)}
                          className="p-2 rounded-lg border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-colors"
                        >
                          {(() => {
                            const IconComp = iconOptions.find(opt => opt.name === editIcon)?.icon || Briefcase;
                            return <IconComp size={20} className="text-[var(--text-secondary)]" />;
                          })()}
                        </button>
                      </div>
                    ) : (
                      <IconComponent size={20} className="text-[var(--text-secondary)]" />
                    )}
                  </div>
                  <div className="flex-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, workspace)}
                        className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                        placeholder="Workspace name"
                        autoFocus
                      />
                    ) : (
                      <span className="text-[var(--text-primary)] font-medium">
                        {workspace.name} ({getTaskCountByWorkspace(workspace.id)})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSave(workspace)}
                          disabled={loading}
                          className="p-2 text-green-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                          title="Save changes"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={loading}
                          className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(workspace)}
                          className="p-2 text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--accent-primary)]/10 rounded-lg transition-colors"
                          title="Edit workspace"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(workspace)}
                          disabled={loading}
                          className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete workspace"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {isEditing && expandedIconSelector === workspace.id && (
                  <div className="mt-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-3">
                    <div className="text-xs font-medium text-[var(--text-secondary)] mb-3">Choose Icon</div>
                    <div className="flex gap-2">
                      {iconOptions.map((option) => {
                        const IconComp = option.icon;
                        return (
                          <button
                            key={option.name}
                            onClick={() => {
                              setEditIcon(option.name);
                              setExpandedIconSelector(null);
                            }}
                            className={`p-2 rounded-lg border transition-all ${
                              editIcon === option.name
                                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                                : 'border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-secondary)]'
                            }`}
                          >
                            <IconComp 
                              size={18} 
                              className={editIcon === option.name ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'} 
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ManageWorkspacesModal; 