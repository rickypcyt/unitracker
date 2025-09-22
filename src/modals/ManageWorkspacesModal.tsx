import { BookOpen, Briefcase, Coffee, Edit, FolderOpen, Gamepad2, Heart, Home, Music, Plane, Save, Settings, ShoppingBag, Smartphone, Star, Target, Trash2, Trophy, Umbrella, User, Users, Wifi, Workflow, X, Zap } from 'lucide-react';
import { useRef, useState } from 'react';

import BaseModal from './BaseModal';
import DeleteCompletedModal from './DeleteTasksPop';
import { supabase } from '@/utils/supabaseClient';
import { useModalClose } from '@/hooks/useModalClose';
import { useSelector } from 'react-redux';

type Workspace = {
  id: string | number;
  name: string;
  icon?: string | null;
};

type Task = {
  workspace_id: string | number;
  completed?: boolean;
};

type ManageWorkspacesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  onWorkspaceUpdated: (workspace: Workspace) => void;
  onWorkspaceDeleted: (workspaceId: Workspace['id']) => void;
};

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

const ManageWorkspacesModal = ({ isOpen, onClose, workspaces, onWorkspaceUpdated, onWorkspaceDeleted }: ManageWorkspacesModalProps) => {
  const [editingId, setEditingId] = useState<Workspace['id'] | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editIcon, setEditIcon] = useState<string>('Briefcase');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [expandedIconSelector, setExpandedIconSelector] = useState<Workspace['id'] | null>(null);
  const tasks = useSelector((state: any) => (state?.tasks?.tasks ?? [])) as Task[];
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);

  // Función para contar tareas por workspace
  const getTaskCountByWorkspace = (workspaceId: Workspace['id']) => {
    return tasks.filter((task: Task) => task.workspace_id === workspaceId && !task.completed).length;
  };

  const handleEdit = (workspace: Workspace) => {
    setEditingId(workspace.id);
    setEditName(workspace.name);
    setEditIcon(workspace.icon || 'Briefcase');
    setError('');
  };

  const handleSave = async (workspace: Workspace) => {
    if (!editName.trim()) {
      setError('Area name is required');
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
      setError('Failed to update area');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (workspace: Workspace) => {
    setWorkspaceToDelete(workspace);
    setShowDeleteModal(true);
  };

  const confirmDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceToDelete.id);
      if (error) throw error;
      onWorkspaceDeleted(workspaceToDelete.id);
      if (editingId === workspaceToDelete.id) {
        setEditingId(null);
        setEditName('');
        setEditIcon('Briefcase');
      }
      setShowDeleteModal(false);
      setWorkspaceToDelete(null);
    } catch (error) {
      console.error('Error deleting workspace:', error);
      setError('Failed to delete area');
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, workspace: Workspace) => {
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

  const modalRef = useRef<HTMLDivElement | null>(null);
  useModalClose(modalRef, handleClose);

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Manage Areas"
      maxWidth="max-w-2xl"
    >
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
                {/* Icon to the left */}
                <div className="flex-shrink-0">
                  {isEditing ? (
                    <div className="relative">
                      <button
                        onClick={() => setExpandedIconSelector(expandedIconSelector === workspace.id ? null : workspace.id)}
                        className="p-2 sm:p-2.5 rounded-lg border transition-all flex items-center justify-center aspect-square border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-secondary)]"
                        title="Choose icon"
                      >
                        {(() => {
                          const IconComp = iconOptions.find(opt => opt.name === editIcon)?.icon || Briefcase;
                          return <IconComp size={22} className="text-[var(--text-secondary)]" />;
                        })()}
                      </button>
                    </div>
                  ) : (
                    <IconComponent size={20} className="text-[var(--text-secondary)]" />
                  )}
                </div>
                {/* Name/Input in the middle */}
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => handleKeyPress(e, workspace)}
                      className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                      placeholder="Area name"
                      autoFocus
                    />
                  ) : (
                    <span className="text-[var(--text-primary)] font-medium">
                      {workspace.name} ({getTaskCountByWorkspace(workspace.id)})
                    </span>
                  )}
                </div>
                {/* Actions to the right */}
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleSave(workspace)}
                        disabled={loading}
                        className="p-2 sm:p-2.5 rounded-lg border transition-all flex items-center justify-center aspect-square border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-secondary)]"
                        title="Save changes"
                      >
                        <Save size={18} className="text-green-500" />
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="p-2 sm:p-2.5 rounded-lg border transition-all flex items-center justify-center aspect-square border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-secondary)]"
                        title="Cancel"
                      >
                        <X size={18} className="text-[var(--text-secondary)]" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(workspace)}
                        className="p-2 text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--accent-primary)]/10 rounded-lg transition-colors"
                        title="Edit area"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(workspace)}
                        disabled={loading}
                        className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete area"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {isEditing && expandedIconSelector === workspace.id && (
                <div className="mt-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-3">
                  <div className="text-sm font-medium text-[var(--text-secondary)] mb-3">Choose Icon</div>
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-8 gap-2 sm:gap-3">
                    {iconOptions.map((option) => {
                      const IconComp = option.icon;
                      return (
                        <button
                          key={option.name}
                          onClick={() => {
                            setEditIcon(option.name);
                            setExpandedIconSelector(null);
                          }}
                          className={`p-2 sm:p-2.5 rounded-lg border transition-all flex items-center justify-center aspect-square ${
                            editIcon === option.name
                              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                              : 'border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-secondary)]'
                          }`}
                        >
                          <IconComp 
                            size={22} 
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
      {showDeleteModal && workspaceToDelete && (
        <DeleteCompletedModal
          onClose={() => {
            setShowDeleteModal(false);
            setWorkspaceToDelete(null);
          }}
          onConfirm={confirmDeleteWorkspace}
          message={`Are you sure you want to delete the area "${workspaceToDelete.name}"? This action cannot be undone.`}
          confirmButtonText="Delete Area"
        />
      )}
    </BaseModal>
  );
};

export default ManageWorkspacesModal; 