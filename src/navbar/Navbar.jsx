import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import { Briefcase, Check, ChevronDown, Edit, FolderOpen, Info, LogIn, LogOut, Menu, Settings, User, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { setActiveWorkspace, setWorkspaces } from '@/store/slices/workspaceSlice';
import { useDispatch, useSelector } from 'react-redux';

import AddFriendModal from '@/modals/AddFriendModal';
import ManageWorkspacesModal from '@/modals/ManageWorkspacesModal';
import UserModal from '@/modals/UserModal';
import { UserPlus } from 'lucide-react';
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
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  // Dummy requests y badge para demo
  const [friendRequests, setFriendRequests] = useState([
    // { username: 'john_doe' },
  ]);
  const hasRequests = friendRequests.length > 0;
  const { isLoggedIn, loginWithGoogle, logout, user } = useAuth();
  const { activePage, navigateTo } = useNavigation();
  const settingsRef = useRef(null);
  const dispatch = useDispatch();
  const workspaces = useSelector(state => state.workspace.workspaces);
  const activeWorkspace = useSelector(state => state.workspace.activeWorkspace);
  const tasks = useSelector(state => state.tasks.tasks);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  // Abrir UserModal automáticamente si falta username, con delay y consulta a profiles
  useEffect(() => {
    let timeout;
    async function checkUsername() {
      if (isLoggedIn && user && user.id) {
        // Espera 1 segundo para asegurar que el perfil esté sincronizado
        await new Promise(res => setTimeout(res, 1000));
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        console.log('Profile data:', data, 'Error:', error); // <-- Log para depuración
        if (!error && data && data.username) {
          setShowUserModal(false);
        } else {
          setShowUserModal(true);
        }
      }
    }
    checkUsername();
    return () => clearTimeout(timeout);
  }, [isLoggedIn, user]);

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
      if (!user) {
        dispatch(setWorkspaces([]));
        localStorage.removeItem('activeWorkspaceId');
        localStorage.removeItem('workspacesHydrated');
        return;
      }
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
  // Limpia workspaces si no está logueado
  useEffect(() => {
    if (!isLoggedIn) {
      dispatch(setWorkspaces([]));
      localStorage.removeItem('activeWorkspaceId');
      localStorage.removeItem('workspacesHydrated');
    }
  }, [isLoggedIn, dispatch]);

  // Cargar solicitudes de amistad desde Supabase
  useEffect(() => {
    if (!user) {
      setReceivedRequests([]);
      setSentRequests([]);
      return;
    }
    const fetchRequests = async () => {
      // Recibidas
      const { data: rec, error: recErr } = await supabase
        .from('friend_requests')
        .select('*, from_user:profiles!friend_requests_from_user_id_fkey(username, avatar_url)')
        .eq('to_user_id', user.id)
        .eq('status', 'pending');
      // Enviadas
      const { data: sent, error: sentErr } = await supabase
        .from('friend_requests')
        .select('*, to_user:profiles!friend_requests_to_user_id_fkey(username, avatar_url)')
        .eq('from_user_id', user.id)
        .eq('status', 'pending');
      setReceivedRequests(rec || []);
      setSentRequests(sent || []);
    };
    fetchRequests();
  }, [user]);

  // Función para enviar solicitud de amistad real
  const handleSendRequest = async (username, { onSuccess, onError }) => {
    try {
      // 1. Busca el usuario destino
      const { data: userTo, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();
      if (userError || !userTo) throw new Error('Usuario no encontrado');
      if (userTo.id === user.id) throw new Error('No puedes enviarte una solicitud a ti mismo');
      // 2. Verifica que no exista ya una solicitud pendiente
      const { data: existing } = await supabase
        .from('friend_requests')
        .select('id')
        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${userTo.id})`, `and(from_user_id.eq.${userTo.id},to_user_id.eq.${user.id})`)
        .eq('status', 'pending');
      if (existing && existing.length > 0) throw new Error('Ya existe una solicitud pendiente entre ustedes');
      // 3. Inserta la solicitud
      const { error } = await supabase
        .from('friend_requests')
        .insert({ from_user_id: user.id, to_user_id: userTo.id, status: 'pending' });
      if (error) throw error;
      onSuccess && onSuccess();
    } catch (err) {
      onError && onError(err.message);
    }
  };

  // Función para aceptar solicitud
  const handleAccept = async (req) => {
    await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', req.id);
    setReceivedRequests(receivedRequests.filter(r => r.id !== req.id));
  };
  // Función para rechazar solicitud
  const handleReject = async (req) => {
    await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', req.id);
    setReceivedRequests(receivedRequests.filter(r => r.id !== req.id));
  };

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
                  className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-15 active:scale-95 relative"
                  title="Settings"
                >
                  <Settings size={22} />
                  {/* Badge sobre el icono de Add Friend en la barra de herramientas */}
                  {hasRequests && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] border-2 border-[var(--bg-primary)] z-10"></span>
                  )}
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
                      onClick={() => {
                        if (!isLoggedIn) {
                          loginWithGoogle();
                        } else {
                          setShowUserModal(true);
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
                    >
                      <User size={16} />
                      User
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onClick={() => {
                        if (!isLoggedIn) {
                          loginWithGoogle();
                        } else {
                          setShowAddFriendModal(true);
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors relative"
                    >
                      <span className="relative">
                        <UserPlus size={16} />
                        {hasRequests && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] border-2 border-[var(--bg-primary)]"></span>
                        )}
                      </span>
                      Add Friend
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onClick={() => setShowAbout(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
                    >
                      <Info size={16} />
                      About
                    </DropdownMenu.Item>
                    
                    {isLoggedIn ? (
                      <DropdownMenu.Item
                        onClick={async () => {
                          await logout();
                          dispatch(setWorkspaces([]));
                          localStorage.removeItem('activeWorkspaceId');
                          localStorage.removeItem('workspacesHydrated');
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
                      >
                        <LogOut size={16} />
                        Log Out
                      </DropdownMenu.Item>
                    ) : (
                      <DropdownMenu.Item
                        onClick={loginWithGoogle}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
                      >
                        <LogIn size={16} />
                        Log In with Google
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
          <div className="bg-[var(--bg-secondary)] rounded-lg p-8 max-w-lg w-full relative shadow-xl">
            <button
              onClick={() => setShowAbout(false)}
              className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl font-bold focus:outline-none"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-center text-[var(--text-primary)] mb-8">About Uni Tracker</h2>
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">The Story</h3>
              <p className="text-base text-[var(--text-secondary)]">
                Uni Tracker was born in December 2024 from a simple idea: to create a better way to manage university assignments and tasks. As a student myself, I noticed the need for a tool that could help organize academic work more effectively while being intuitive and user-friendly.
              </p>
            </div>
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">About Me</h3>
              <p className="text-base text-[var(--text-secondary)]">
                Hi! I'm Ricky, the creator of Uni Tracker. I'm passionate about building tools that make life easier for students. This project represents my commitment to improving the academic experience through technology.
              </p>
            </div>
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Get in Touch</h3>
              <p className="text-base text-[var(--text-secondary)] mb-2">
                I'm always open to feedback, suggestions, or just a friendly chat about the app. Whether you've found a bug, have a feature request, or want to share your experience, I'd love to hear from you!
              </p>
              <a href="mailto:rickypcyt@gmail.com" className="flex items-center gap-2 text-[var(--accent-primary)] text-base font-medium hover:underline">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-.876 1.797l-7.5 5.625a2.25 2.25 0 01-2.748 0l-7.5-5.625A2.25 2.25 0 012.25 6.993V6.75" />
                </svg>
                rickypcyt@gmail.com
              </a>
            </div>
            <div className="border-t border-[var(--border-primary)] pt-4 mt-4 text-center text-[var(--text-secondary)]">
              Thank you for using Uni Tracker! Your support and feedback help make this app better every day.
            </div>
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
      {/* User Modal */}
      <UserModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} />
      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onSendRequest={handleSendRequest}
        receivedRequests={receivedRequests}
        sentRequests={sentRequests}
        onAccept={handleAccept}
        onReject={handleReject}
        hasRequests={receivedRequests.length > 0}
      />
    </>
  );
};

export default Navbar; 