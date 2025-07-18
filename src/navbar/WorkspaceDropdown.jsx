import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import { Briefcase, Check, ChevronDown, Edit, FolderOpen } from 'lucide-react';
import React, { useState } from 'react';

import ManageWorkspacesModal from '@/modals/ManageWorkspacesModal';
import WorkspaceCreateModal from '@/modals/WorkspaceCreateModal';

const WorkspaceDropdown = ({
  workspaces = [],
  activeWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  onEditWorkspace,
  onDeleteWorkspace
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

  const getTaskCountByWorkspace = ws => ws.taskCount || 0;

  return (
    <>
      {/* Desktop Dropdown */}
      <div className="hidden lg:block">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-md transition-colors border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)]">
              <FolderOpen size={18} />
              <span className="font-medium truncate max-w-[100px]">{activeWorkspace?.name || 'Workspace'}</span>
              <ChevronDown size={16} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="min-w-[200px] rounded-lg p-1 w-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] z-[10000] animate-in fade-in0 zoom-in-95" sideOffset={5} align="end" collisionPadding={10}>
              {workspaces.map(ws => (
                <DropdownMenu.Item
                  key={ws.id}
                  onClick={() => onSelectWorkspace(ws)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none transition-colors ${activeWorkspace?.id === ws.id ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'}`}
                >
                  <Briefcase size={14} />
                  <span className="flex-1">{ws.name} ({getTaskCountByWorkspace(ws)})</span>
                  {activeWorkspace?.id === ws.id && <Check size={14} className="text-[var(--accent-primary)]" />}
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Separator className="h-px bg-[var(--border-primary)] my-1" />
              <DropdownMenu.Item
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Briefcase size={14} />
                New workspace
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() => setShowManageModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Edit size={14} />
                Edit workspaces
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      {/* Mobile Dropdown */}
      <div className="lg:hidden flex-shrink-0">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none p-2 rounded-lg">
              <Briefcase size={28} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="min-w-[200px] rounded-lg p-1 w-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] z-[10000] animate-in fade-in0 zoom-in-95" sideOffset={5} align="end" collisionPadding={10}>
              {workspaces.map(ws => (
                <DropdownMenu.Item
                  key={ws.id}
                  onClick={() => onSelectWorkspace(ws)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none transition-colors ${activeWorkspace?.id === ws.id ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'}`}
                >
                  <Briefcase size={14} />
                  <span className="flex-1">{ws.name} ({getTaskCountByWorkspace(ws)})</span>
                  {activeWorkspace?.id === ws.id && <Check size={14} className="text-[var(--accent-primary)]" />}
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Separator className="h-px bg-[var(--border-primary)] my-1" />
              <DropdownMenu.Item
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Briefcase size={14} />
                New workspace
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() => setShowManageModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Edit size={14} />
                Edit workspaces
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      {/* Modals */}
      <WorkspaceCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onWorkspaceCreated={onCreateWorkspace}
      />
      <ManageWorkspacesModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        workspaces={workspaces}
        onWorkspaceUpdated={onEditWorkspace}
        onWorkspaceDeleted={onDeleteWorkspace}
      />
    </>
  );
};

export default WorkspaceDropdown; 