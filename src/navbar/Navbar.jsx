import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import { Briefcase, Check, ChevronDown, Edit, FolderOpen, Info, LogOut, Menu, Settings, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { setActiveWorkspace, setWorkspaces } from '@/store/slices/workspaceSlice';
import { useDispatch, useSelector } from 'react-redux';

import ManageWorkspacesModal from '@/modals/ManageWorkspacesModal';
import WorkspaceCreateModal from '@/modals/WorkspaceCreateModal';
import WorkspaceDropdown from '@/components/WorkspaceDropdown';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@/navbar/NavigationContext';

const Navbar = ({ onOpenSettings }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [showManageWorkspacesModal, setShowManageWorkspacesModal] = useState(false);
  const { isLoggedIn, loginWithGoogle, logout } = useAuth();
  const { activePage, navigateTo } = useNavigation();
  const settingsRef = useRef(null);
  const dispatch = useDispatch();
  const workspaces = useSelector(state => state.workspace.workspaces);
  const activeWorkspace = useSelector(state => state.workspace.activeWorkspace);
  const tasks = useSelector(state => state.tasks.tasks);

  // Función para contar tareas por workspace
  const getTaskCountByWorkspace = (workspaceId) => {
    return tasks.filter(task => task.workspace_id === workspaceId && !task.completed).length;
  };

  // Función para manejar la creación de workspace
  const handleWorkspaceCreated = (newWorkspace) => {
    dispatch(setWorkspaces([...workspaces, newWorkspace]));
    dispatch(setActiveWorkspace(newWorkspace));
  };

  // Función para manejar la actualización de workspace
  const handleWorkspaceUpdated = (updatedWorkspace) => {
    dispatch(setWorkspaces(workspaces.map(ws => ws.id === updatedWorkspace.id ? updatedWorkspace : ws)));
    if (activeWorkspace?.id === updatedWorkspace.id) {
      dispatch(setActiveWorkspace(updatedWorkspace));
    }
  };

  // Función para manejar la eliminación de workspace
  const handleWorkspaceDeleted = (workspaceId) => {
    const updatedWorkspaces = workspaces.filter(ws => ws.id !== workspaceId);
    dispatch(setWorkspaces(updatedWorkspaces));
    if (activeWorkspace?.id === workspaceId) {
      const newActiveWorkspace = updatedWorkspaces.length > 0 ? updatedWorkspaces[0] : null;
      dispatch(setActiveWorkspace(newActiveWorkspace));
    }
  };

  // Cargar workspaces desde Supabase al montar
  useEffect(() => {
    const fetchWorkspaces = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (!error && data) {
        dispatch(setWorkspaces(data));
        // Seleccionar el workspace activo guardado en localStorage
        const savedId = localStorage.getItem('activeWorkspaceId');
        if (savedId) {
          const found = data.find(ws => ws.id === savedId);
          if (found) dispatch(setActiveWorkspace(found));
        }
      }
    };
    fetchWorkspaces();
  }, [dispatch]);

  const handleSelectWorkspace = (ws) => {
    dispatch(setActiveWorkspace(ws));
    localStorage.setItem('activeWorkspaceId', ws.id);
    // setShowWorkspaceDropdown(false); // This state variable was removed
  };

  const handleCreateWorkspace = async (name) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('workspaces')
      .insert([{ name, user_id: user.id, icon: 'Briefcase' }])
      .select()
      .single();

    if (!error && data) {
      dispatch(setWorkspaces([...workspaces, data]));
      dispatch(setActiveWorkspace(data));
      localStorage.setItem('activeWorkspaceId', data.id);
    }
  };

  const handleEditWorkspace = async (ws, newName, newIcon) => {
      const { data, error } = await supabase
        .from('workspaces')
      .update({ name: newName, icon: newIcon })
        .eq('id', ws.id)
        .select()
        .single();

    if (!error && data) {
        dispatch(setWorkspaces(workspaces.map(w => w.id === ws.id ? data : w)));
      if (activeWorkspace?.id === ws.id) {
        dispatch(setActiveWorkspace(data));
      }
    }
  };

  const isActive = (page) => {
    return activePage === page;
  };

  const navLinkClass = (page) => {
    return `px-4 py-2 rounded-md text-xl ${
      isActive(page)
        ? 'text-[var(--accent-primary)] '
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium'
    }`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
      // if (workspaceRef.current && !workspaceRef.current.contains(event.target)) { // workspaceRef was removed
      //   setShowWorkspaceDropdown(false);
      // }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] z-[10000] overflow-x-hidden">
        <div className="w-full px-2 overflow-x-hidden">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <span className="text-[var(--text-primary)] font-bold text-2xl">Uni</span>
              <span className="text-[var(--accent-primary)] font-bold text-2xl">Tracker</span>
            </div>

            {/* Enlaces de navegación - Solo Desktop (lg+) - CENTRADOS */}
            <div className="hidden lg:flex flex-1 justify-center items-center space-x-4 lg:space-x-8">
              <button onClick={() => navigateTo('tasks')} className={navLinkClass('tasks') + ' text-base lg:text-xl'}>
                Tasks
              </button>
              <button onClick={() => navigateTo('calendar')} className={navLinkClass('calendar') + ' text-base lg:text-xl'}>
                Calendar
              </button>
              <button onClick={() => navigateTo('session')} className={navLinkClass('session') + ' text-base lg:text-xl'}>
                Session
              </button>
              <button onClick={() => navigateTo('notes')} className={navLinkClass('notes') + ' text-base lg:text-xl'}>
                Notes
              </button>
              <button onClick={() => navigateTo('stats')} className={navLinkClass('stats') + ' text-base lg:text-xl'}>
                Statistics
              </button>
            </div>

            {/* Controles de la derecha */}
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              {/* Botón de menú móvil - Izquierda */}
              <div className="lg:hidden flex-shrink-0">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none p-2 rounded-lg">
                      <Menu size={28} />
                    </button>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="min-w-[200px] rounded-lg p-1 w-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] z-[10000] animate-in fade-in0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                      sideOffset={5}
                      align="end"
                      collisionPadding={10}
                    >
                      <DropdownMenu.Item
                        onClick={() => navigateTo('tasks')}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none transition-colors ${activePage === 'tasks' ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'}`}
                      >
                        Tasks
                      </DropdownMenu.Item>
                      
                      <DropdownMenu.Item
                        onClick={() => navigateTo('calendar')}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none transition-colors ${activePage === 'calendar' ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'}`}
                      >
                        Calendar
                      </DropdownMenu.Item>
                      
                      <DropdownMenu.Item
                        onClick={() => navigateTo('session')}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none transition-colors ${activePage === 'session' ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'}`}
                      >
                        Session
                      </DropdownMenu.Item>
                      
                      <DropdownMenu.Item
                        onClick={() => navigateTo('notes')}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none transition-colors ${activePage === 'notes' ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'}`}
                      >
                        Notes
                      </DropdownMenu.Item>
                      
                      <DropdownMenu.Item
                        onClick={() => navigateTo('stats')}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none transition-colors ${activePage === 'stats' ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'}`}
                      >
                        Statistics
                      </DropdownMenu.Item>
                      
                      <DropdownMenu.Separator className="h-px bg-[var(--border-primary)] my-1" />
                      
              {/* Workspace Dropdown */}
                      <DropdownMenu.Sub>
                        <DropdownMenu.SubTrigger className="flex items-center justify-between px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors">
                          <div className="flex items-center gap-2">
                            <Briefcase size={16} />
                            <span>{activeWorkspace?.name || 'Workspace'}</span>
                          </div>
                          <ChevronDown size={14} />
                        </DropdownMenu.SubTrigger>
                        
                        <DropdownMenu.Portal>
                          <DropdownMenu.SubContent
                            className="min-w-[200px] rounded-lg p-1 w-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] z-[10000] animate-in fade-in0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                            sideOffset={2}
                            alignOffset={-5}
                          >
                            {workspaces.map(ws => (
                              <DropdownMenu.Item
                                key={ws.id}
                                onClick={() => handleSelectWorkspace(ws)}
                                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none transition-colors ${activeWorkspace?.id === ws.id ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'}`}
                              >
                                <Briefcase size={14} />
                                <span className="flex-1">{ws.name} ({getTaskCountByWorkspace(ws.id)})</span>
                                {activeWorkspace?.id === ws.id && (
                                  <Check size={14} className="text-[var(--accent-primary)]" />
                                )}
                              </DropdownMenu.Item>
                            ))}
                            
                            <DropdownMenu.Separator className="h-px bg-[var(--border-primary)] my-1" />
                            
                            <DropdownMenu.Item
                              onClick={() => setShowCreateWorkspaceModal(true)}
                              className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
                            >
                              <Briefcase size={14} />
                              New workspace
                            </DropdownMenu.Item>
                            
                            <DropdownMenu.Item
                              onClick={() => setShowManageWorkspacesModal(true)}
                              className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
                            >
                              <Edit size={14} />
                              Edit workspaces
                            </DropdownMenu.Item>
                          </DropdownMenu.SubContent>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Sub>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>

              {/* Workspace Button - Desktop (solo en lg+) */}
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
                    <DropdownMenu.Content
                      className="min-w-[200px] rounded-lg p-1 w-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] z-[10000] animate-in fade-in0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                      sideOffset={5}
                      align="end"
                      collisionPadding={10}
                    >
                      {workspaces.map(ws => (
                        <DropdownMenu.Item
                          key={ws.id}
                              onClick={() => handleSelectWorkspace(ws)}
                          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none transition-colors ${activeWorkspace?.id === ws.id ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'}`}
                        >
                          <Briefcase size={14} />
                          <span className="flex-1">{ws.name} ({getTaskCountByWorkspace(ws.id)})</span>
                          {activeWorkspace?.id === ws.id && (
                            <Check size={14} className="text-[var(--accent-primary)]" />
                          )}
                        </DropdownMenu.Item>
                      ))}
                      
                      <DropdownMenu.Separator className="h-px bg-[var(--border-primary)] my-1" />
                      
                      <DropdownMenu.Item
                        onClick={() => setShowCreateWorkspaceModal(true)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
                      >
                        <Briefcase size={14} />
                        New workspace
                      </DropdownMenu.Item>
                      
                      <DropdownMenu.Item
                        onClick={() => setShowManageWorkspacesModal(true)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
                      >
                        <Edit size={14} />
                        Edit workspaces
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
              
              {/* Settings Button - Derecha */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                <button
                    className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-15 active:scale-95"
                    title="Settings"
                >
                  <Settings size={22} />
                </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="min-w-[200px] rounded-lg p-1 w-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] z-[10000] animate-in fade-in0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                    sideOffset={5}
                    align="end"
                    collisionPadding={10}
                  >
                    <DropdownMenu.Item
                      onClick={onOpenSettings}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
                    >
                      <Settings size={16} />
                      Settings
                    </DropdownMenu.Item>
                    
                    <DropdownMenu.Item
                      onClick={() => setShowAbout(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
                    >
                      <Info size={16} />
                      About
                    </DropdownMenu.Item>
                    
                    {isLoggedIn && (
                      <DropdownMenu.Item
                        onClick={logout}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
                      >
                        <LogOut size={16} />
                        Log Out
                      </DropdownMenu.Item>
                    )}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
        </div>
      </nav>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[10001] flex items-center justify-center p-4">
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">About UniTracker</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              UniTracker is a comprehensive productivity app designed for students and professionals.
              Manage your tasks, track your study sessions, and organize your notes all in one place.
            </p>
              <button
              onClick={() => setShowAbout(false)}
              className="w-full bg-[var(--accent-primary)] text-white py-2 px-4 rounded-lg hover:bg-[var(--accent-secondary)] transition-colors"
            >
              Close
              </button>
            </div>
          </div>
        )}

      {/* Workspace Create Modal */}
      <WorkspaceCreateModal
        isOpen={showCreateWorkspaceModal}
        onClose={() => setShowCreateWorkspaceModal(false)}
        onWorkspaceCreated={handleWorkspaceCreated}
      />

      {/* Manage Workspaces Modal */}
      <ManageWorkspacesModal
        isOpen={showManageWorkspacesModal}
        onClose={() => setShowManageWorkspacesModal(false)}
        workspaces={workspaces}
        onWorkspaceUpdated={handleWorkspaceUpdated}
        onWorkspaceDeleted={handleWorkspaceDeleted}
      />
    </>
  );
};

export default Navbar; 