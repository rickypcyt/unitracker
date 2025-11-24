import BaseModal from './BaseModal';
import { Check } from 'lucide-react';
import React from 'react';
import type { Task } from '@/types/taskStorage';

interface Workspace {
  id: string;
  name: string;
  icon: string;
}

interface WorkspaceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  onSelectWorkspace: (workspace: Workspace) => void;
  assignment: string;
  tasks: Array<Pick<Task, 'workspace_id' | 'completed'>>;
}

const WorkspaceSelectionModal: React.FC<WorkspaceSelectionModalProps> = ({
  isOpen,
  onClose,
  workspaces,
  activeWorkspace,
  onSelectWorkspace,
  assignment,
  tasks = [],
}) => {
  const handleWorkspaceSelect = (workspace: Workspace): void => {
    onSelectWorkspace(workspace);
    onClose();
  };

  // Función para contar tareas por workspace
  const getTaskCountByWorkspace = (workspaceId: string): number => {
    return tasks.filter(task => task.workspace_id === workspaceId && !task.completed).length;
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Workspace"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="text-center mb-4">
          <p className="text-[var(--text-secondary)]">
            Move assignment <span className="font-semibold text-[var(--text-primary)]">"{assignment}"</span> to:
          </p>
        </div>
        
        <div className="space-y-2">
          {[...workspaces].sort((a, b) => a.name.localeCompare(b.name)).map((workspace) => (
            <button
              key={workspace.id}
              onClick={() => handleWorkspaceSelect(workspace)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200 ${
                activeWorkspace?.id === workspace.id
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                  : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  activeWorkspace?.id === workspace.id
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]'
                    : 'border-[var(--border-primary)]'
                }`}>
                  {activeWorkspace?.id === workspace.id && (
                    <Check size={12} className="text-white" />
                  )}
                </div>
                <span className={`font-medium ${
                  activeWorkspace?.id === workspace.id
                    ? 'text-[var(--accent-primary)]'
                    : 'text-[var(--text-primary)]'
                }`}>
                  {workspace.name} <span className="text-sm text-[var(--text-secondary)]">({getTaskCountByWorkspace(workspace.id)})</span>
                </span>
              </div>
              
              {activeWorkspace?.id === workspace.id && (
                <span className="text-sm text-[var(--accent-primary)] font-medium">
                  Current
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div className="flex justify-end gap-2 pt-2 pb-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default WorkspaceSelectionModal; 