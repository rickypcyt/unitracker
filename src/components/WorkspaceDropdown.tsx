import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import { Briefcase, Check, ChevronDown, Info, LogIn, LogOut, Pencil, Plus, Settings, X as XIcon } from 'lucide-react';
import React, { useState } from 'react';

const ICON_OPTIONS = [
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Settings', icon: Settings },
  { name: 'Info', icon: Info },
];

const WorkspaceDropdown = ({
  workspaces,
  activeWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  onEditWorkspace,
  onOpenSettings,
  onShowAbout,
  onLogin,
  onLogout,
  isLoggedIn,
}) => {
  const [showNewWorkspaceInput, setShowNewWorkspaceInput] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [editingWorkspaceId, setEditingWorkspaceId] = useState(null);
  const [editingWorkspaceName, setEditingWorkspaceName] = useState('');
  const [editingWorkspaceIcon, setEditingWorkspaceIcon] = useState('Briefcase');
  const [isEditingLoading, setIsEditingLoading] = useState(false);
  const [editingError, setEditingError] = useState('');

  const handleCreateWorkspace = async () => {
    if (newWorkspaceName.trim().length < 2) return;
    
    try {
      await onCreateWorkspace(newWorkspaceName);
      setNewWorkspaceName('');
      setShowNewWorkspaceInput(false);
    } catch (error) {
      console.error('Error creating workspace:', error);
    }
  };

  const handleEditWorkspaceClick = (ws) => {
    setEditingWorkspaceId(ws.id);
    setEditingWorkspaceName(ws.name);
    setEditingWorkspaceIcon(ws.icon || 'Briefcase');
    setEditingError('');
  };

  const handleEditWorkspaceChange = (e) => {
    setEditingWorkspaceName(e.target.value);
    setEditingError('');
  };

  const handleEditWorkspaceIconChange = (iconName) => {
    setEditingWorkspaceIcon(iconName);
  };

  const handleEditWorkspaceCancel = () => {
    setEditingWorkspaceId(null);
    setEditingWorkspaceName('');
    setEditingWorkspaceIcon('Briefcase');
    setEditingError('');
  };

  const handleEditWorkspaceSave = async (ws) => {
    if (editingWorkspaceName.trim().length < 2) {
      setEditingError('Name too short');
      return;
    }
    
    setIsEditingLoading(true);
    setEditingError('');
    
    try {
      await onEditWorkspace(ws, editingWorkspaceName, editingWorkspaceIcon);
      setEditingWorkspaceId(null);
      setEditingWorkspaceName('');
    } catch (error) {
      setEditingError('Error updating area');
      console.error('Error updating workspace:', error);
    }
    
    setIsEditingLoading(false);
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-md transition-colors border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)]">
          {(() => {
            const Icon = ICON_OPTIONS.find(opt => opt.name === (activeWorkspace?.icon || 'Briefcase'))?.icon || Briefcase;
            return <Icon size={18} />;
          })()}
          <span className="font-medium truncate max-w-[120px]">{activeWorkspace?.name || 'Area'}</span>
          <ChevronDown size={16} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[280px] bg-[var(--bg-secondary)] rounded-lg p-1 shadow-lg border border-[var(--border-primary)] z-[9999] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          sideOffset={5}
          align="end"
          collisionPadding={10}
        >
          <div className="max-h-60 overflow-y-auto">
            {workspaces.map(ws => (
              <div key={ws.id} className="group">
                {editingWorkspaceId === ws.id ? (
                  <div className="flex flex-col gap-1 px-3 py-2 bg-[var(--bg-primary)]">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className={`px-2 py-1 rounded bg-[var(--bg-secondary)] border text-sm ${editingWorkspaceId === ws.id ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-[var(--border-primary)] text-[var(--text-primary)]'}`}
                        value={editingWorkspaceName}
                        onChange={handleEditWorkspaceChange}
                        disabled={isEditingLoading}
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleEditWorkspaceSave(ws);
                          if (e.key === 'Escape') handleEditWorkspaceCancel();
                        }}
                      />
                      <button
                        onClick={() => handleEditWorkspaceSave(ws)}
                        disabled={isEditingLoading}
                        className="text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 disabled:opacity-50 transition-colors"
                        title="Save changes"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={handleEditWorkspaceCancel} 
                        disabled={isEditingLoading} 
                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        <XIcon size={16} />
                      </button>
                      {isEditingLoading && <span className="ml-2 text-sm text-[var(--accent-primary)]">...</span>}
                    </div>
                    <div className="flex gap-2 mt-1">
                      {ICON_OPTIONS.map(opt => {
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.name}
                            onClick={() => handleEditWorkspaceIconChange(opt.name)}
                            className={`p-1 rounded-full border ${editingWorkspaceIcon === opt.name ? 'border-[var(--accent-primary)] bg-[var(--bg-secondary)] text-[var(--accent-primary)]' : 'border-transparent text-[var(--text-secondary)]'}`}
                            disabled={isEditingLoading}
                            title={opt.name}
                            type="button"
                          >
                            <Icon size={18} className={editingWorkspaceIcon === opt.name ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <DropdownMenu.Item
                    onClick={() => {
                      try {
                        localStorage.setItem('activeWorkspaceId', ws.id);
                      } catch (_e) { void _e; /* noop */ }
                      onSelectWorkspace(ws);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[var(--bg-primary)] transition-colors cursor-pointer outline-none ${activeWorkspace?.id === ws.id ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-secondary)]'}`}
                  >
                    {(() => {
                      const Icon = ICON_OPTIONS.find(opt => opt.name === (ws.icon || 'Briefcase'))?.icon || Briefcase;
                      return <Icon size={14} />;
                    })()}
                    <span className="flex-1 truncate">{ws.name}</span>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleEditWorkspaceClick(ws); 
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80"
                      title="Edit area name"
                    >
                      <Pencil size={16} />
                    </button>
                  </DropdownMenu.Item>
                )}
                {editingWorkspaceId === ws.id && editingError && (
                  <div className="text-sm text-red-500 px-3 pb-1">{editingError}</div>
                )}
              </div>
            ))}
          </div>
          
          <DropdownMenu.Separator className="h-px bg-[var(--border-primary)] my-1" />
          
          <div className="px-3 py-2">
            {showNewWorkspaceInput ? (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  className="px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] text-sm flex-1"
                  placeholder="New area"
                  value={newWorkspaceName}
                  onChange={e => setNewWorkspaceName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateWorkspace(); }}
                  autoFocus
                />
                <button 
                  onClick={handleCreateWorkspace} 
                  className="text-[var(--accent-primary)] text-base p-1 hover:text-[var(--accent-primary)]/80"
                >
                  <Plus size={16} />
                </button>
              </div>
            ) : (
              <DropdownMenu.Item
                onClick={() => setShowNewWorkspaceInput(true)}
                className="flex text-sm items-center gap-1 text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 cursor-pointer outline-none"
              >
                <Plus size={16} /> New area
              </DropdownMenu.Item>
            )}
          </div>
          
          <DropdownMenu.Separator className="h-px bg-[var(--border-primary)] my-1" />
          
          <DropdownMenu.Item
            onClick={() => {
              onOpenSettings();
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] cursor-pointer outline-none transition-colors"
          >
            <Settings size={16} />
            Settings
          </DropdownMenu.Item>
          
          <DropdownMenu.Item
            onClick={() => {
              onShowAbout();
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] cursor-pointer outline-none transition-colors"
          >
            <Info size={16} />
            About
          </DropdownMenu.Item>
          
          {isLoggedIn ? (
            <DropdownMenu.Item
              onClick={() => {
                onLogout();
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] cursor-pointer outline-none transition-colors"
            >
              <LogOut size={16} />
              Log Out
            </DropdownMenu.Item>
          ) : (
            <DropdownMenu.Item
              onClick={() => {
                onLogin();
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] cursor-pointer outline-none transition-colors"
            >
              <LogIn size={16} />
              Log In
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default WorkspaceDropdown; 