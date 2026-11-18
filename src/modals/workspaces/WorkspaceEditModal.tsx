import { Briefcase, Edit, FolderOpen, Home, Settings, User, Users, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workspaceFormSchema, type WorkspaceFormValues } from '@/schemas/workspace';

import BaseModal from '@/modals/shared/BaseModal';
import React from 'react';
import { Workspace } from '@/types/workspace';
import { WorkspaceService } from '@/services/WorkspaceService';
import { useModalClose } from '@/hooks/common/useModalClose';

interface IconOption {
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface WorkspaceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace & { icon?: string };
  onWorkspaceUpdated: (workspace: Workspace) => void;
}

const WorkspaceEditModal: React.FC<WorkspaceEditModalProps> = ({ isOpen, onClose, workspace, onWorkspaceUpdated }) => {
  const [error, setError] = useState('');
  const { register, handleSubmit, reset, setValue, watch, formState: { isValid, isSubmitting: loading } } = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: { name: workspace?.name ?? '', icon: workspace?.icon || 'Briefcase' },
    mode: 'onChange',
  });
  const selectedIcon = watch('icon');
  const setSelectedIcon = (icon: string) => setValue('icon', icon, { shouldValidate: true });

  const iconOptions: IconOption[] = [
    { name: 'Briefcase', icon: Briefcase },
    { name: 'FolderOpen', icon: FolderOpen },
    { name: 'Home', icon: Home },
    { name: 'Settings', icon: Settings },
    { name: 'User', icon: User },
    { name: 'Users', icon: Users },
    { name: 'Zap', icon: Zap },
  ];

  const initialValues = () => ({ name: workspace?.name || '', icon: workspace?.icon || 'Briefcase' });

  useEffect(() => {
    if (workspace) reset(initialValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace, reset]);

  const onSubmit = async ({ name, icon }: WorkspaceFormValues) => {
    setError('');
    try {
      const data = await WorkspaceService.updateWorkspace(workspace.id, { name, icon });
      onWorkspaceUpdated(data);
      onClose();
    } catch {
      setError('Failed to update workspace');
    }
  };

  const handleClose = () => {
    reset(initialValues());
    setError('');
    onClose();
  };

  const modalRef = useRef<HTMLDivElement>(null);
  useModalClose(modalRef, handleClose);

  if (!isOpen || !workspace) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Workspace"
      maxWidth="max-w-md"
      showHeader={false}
    >
      <div ref={modalRef}>
        <div className="flex items-center gap-3 mb-6">
          <Edit size={24} className="text-[var(--accent-primary)]" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Edit Workspace</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="workspaceName" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Workspace Name
            </label>
            <input
              type="text"
              id="workspaceName"
              {...register('name')}
              className="w-full px-3 py-2 border-2 border-[var(--border-primary)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
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
              className="flex-1 px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-2 border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isValid}
              className="flex-1 px-4 py-2 text-[var(--accent-primary)] border-2 border-[var(--accent-primary)] bg-transparent rounded-lg hover:bg-[var(--accent-primary)]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Updating...' : 'Update Workspace'}
            </button>
          </div>
        </form>
      </div>
    </BaseModal>
  );
};

export default WorkspaceEditModal; 