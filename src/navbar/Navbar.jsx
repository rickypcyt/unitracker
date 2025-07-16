import { Book, Briefcase, Check, ChevronDown, Code, Globe, Info, LogIn, LogOut, Menu, Pencil, Plus, Settings, Star, User, X, X as XIcon } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { addWorkspace, setActiveWorkspace, setWorkspaces } from '@/store/slices/workspaceSlice';
import { useDispatch, useSelector } from 'react-redux';

import AboutModal from '@/modals/AboutModal';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@/navbar/NavigationContext';

const ICON_OPTIONS = [
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Book', icon: Book },
  { name: 'Code', icon: Code },
  { name: 'Globe', icon: Globe },
  { name: 'Star', icon: Star },
  { name: 'User', icon: User },
];

const Navbar = ({ onOpenSettings }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const { isLoggedIn, loginWithGoogle, logout } = useAuth();
  const { activePage, navigateTo } = useNavigation();
  const settingsRef = useRef(null);
  const workspaceDropdownRef = useRef(null);
  const dispatch = useDispatch();
  const workspaces = useSelector(state => state.workspace.workspaces);
  const activeWorkspace = useSelector(state => state.workspace.activeWorkspace);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [showNewWorkspaceInput, setShowNewWorkspaceInput] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [editingWorkspaceId, setEditingWorkspaceId] = useState(null);
  const [editingWorkspaceName, setEditingWorkspaceName] = useState('');
  const [editingWorkspaceIcon, setEditingWorkspaceIcon] = useState('Briefcase');
  const [isEditingLoading, setIsEditingLoading] = useState(false);
  const [editingError, setEditingError] = useState('');

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

  const resetWorkspaceEdit = () => {
    setEditingWorkspaceId(null);
    setEditingWorkspaceName('');
    setEditingError('');
  };

  const handleSelectWorkspace = (ws) => {
    dispatch(setActiveWorkspace(ws));
    setWorkspaceMenuOpen(false);
    resetWorkspaceEdit();
    // Aquí puedes disparar fetchTasks filtrando por workspace
  };

  const handleCreateWorkspace = async () => {
    if (newWorkspaceName.trim().length < 2) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('workspaces')
      .insert([{ name: newWorkspaceName, user_id: user.id }])
      .select()
      .single();
    if (!error && data) {
      dispatch(addWorkspace(data));
      setShowNewWorkspaceInput(false);
      setNewWorkspaceName('');
      setWorkspaceMenuOpen(false);
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
  };

  const handleEditWorkspaceIconChange = (iconName) => {
    setEditingWorkspaceIcon(iconName);
  };

  const handleEditWorkspaceCancel = () => {
    setEditingWorkspaceId(null);
    setEditingWorkspaceName('');
    setEditingError('');
  };

  const handleEditWorkspaceSave = async (ws) => {
    if (editingWorkspaceName.trim().length < 2) {
      setEditingError('Name too short');
      return;
    }
    setIsEditingLoading(true);
    setEditingError('');
    // Log cambio
    console.log('[Workspace Edit] Guardando cambios:', {
      id: ws.id,
      nuevoNombre: editingWorkspaceName,
      nuevoIcono: editingWorkspaceIcon
    });
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .update({ name: editingWorkspaceName, icon: editingWorkspaceIcon })
        .eq('id', ws.id)
        .select()
        .single();
      if (error) {
        setEditingError('Error updating name');
      } else if (data) {
        // Actualiza el store solo con el dato real de la base de datos
        dispatch(setWorkspaces(workspaces.map(w => w.id === ws.id ? data : w)));
        setEditingWorkspaceId(null);
        setEditingWorkspaceName('');
      }
    } catch (e) {
      setEditingError('Error updating name');
    }
    setIsEditingLoading(false);
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
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(event.target)) {
        setWorkspaceMenuOpen(false);
      }
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

            {/* Enlaces de navegación - Desktop - CENTRADOS */}
            <div className="hidden md:flex flex-1 justify-center items-center space-x-4 lg:space-x-8">
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

            {/* Settings Menu - Desktop */}
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              {/* Workspace Dropdown */}
              <div className="hidden md:block relative mr-1 md:mr-2" ref={workspaceDropdownRef}>
                <button
                  onClick={() => {
                    if (workspaceMenuOpen) resetWorkspaceEdit();
                    setWorkspaceMenuOpen((v) => !v);
                  }}
                  className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-md transition-colors border border-[var(--border-primary)] bg-[var(--bg-secondary)]"
                >
                  {(() => {
                    const Icon = ICON_OPTIONS.find(opt => opt.name === (activeWorkspace?.icon || 'Briefcase'))?.icon || Briefcase;
                    return <Icon size={18} />;
                  })()}
                  <span className="font-medium">{activeWorkspace?.name || 'Workspace'}</span>
                  <ChevronDown size={16} />
                </button>
                {workspaceMenuOpen && (
                  <div className="absolute right-0 mt-2 w-68 max-w-xs bg-[var(--bg-secondary)] rounded-lg shadow-lg z-[9999] border border-[var(--border-primary)]">
                    <div className="max-h-60 overflow-y-auto">
                      {workspaces.map(ws => (
                        <div key={ws.id} className="group">
                          {editingWorkspaceId === ws.id ? (
                            <div className="flex flex-col gap-1 px-4 py-2 bg-[var(--bg-primary)]">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  className={`px-2 py-1 rounded bg-[var(--bg-secondary)] border ${editingWorkspaceId === ws.id ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-[var(--border-primary)] text-[var(--text-primary)]'}`}
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
                                <button onClick={() => { handleEditWorkspaceCancel(); resetWorkspaceEdit(); }} disabled={isEditingLoading} className="text-red-500 hover:text-red-700 disabled:opacity-50"><XIcon size={16} /></button>
                                {isEditingLoading && <span className="ml-2 text-xs text-[var(--accent-primary)]">...</span>}
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
                            <button
                              onClick={() => handleSelectWorkspace(ws)}
                              className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-[var(--bg-primary)] transition-colors group ${activeWorkspace?.id === ws.id ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-secondary)]'}`}
                            >
                              {(() => {
                                const Icon = ICON_OPTIONS.find(opt => opt.name === (ws.icon || 'Briefcase'))?.icon || Briefcase;
                                return <Icon size={14} />;
                              })()}
                              <span className="flex-1 truncate">{ws.name}</span>
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150" onClick={e => { e.stopPropagation(); handleEditWorkspaceClick(ws); }}>
                                <Pencil size={16} className="text-[var(--accent-primary)] cursor-pointer" title="Edit workspace name" />
                              </span>
                            </button>
                          )}
                          {editingWorkspaceId === ws.id && editingError && (
                            <div className="text-xs text-red-500 px-4 pb-1">{editingError}</div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-[var(--border-primary)] px-4 py-2">
                      {showNewWorkspaceInput ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            className="px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] text-xs max-w-[100px]"
                            placeholder="New workspace"
                            value={newWorkspaceName}
                            onChange={e => setNewWorkspaceName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleCreateWorkspace(); }}
                            autoFocus
                          />
                          <button onClick={handleCreateWorkspace} className="text-[var(--accent-primary)] text-base p-1"><Plus size={16} /></button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowNewWorkspaceInput(true)}
                          className="flex text-xs items-center gap-1 text-[var(--accent-primary)] hover:underline mt-1"
                        >
                          <Plus size={16} /> New workspace
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="hidden md:block relative" ref={settingsRef}>
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-md transition-colors"
                >
                  <Settings size={22} />
                </button>
                {isSettingsOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-secondary)] rounded-lg shadow-lg z-[9999] border border-[var(--border-primary)]">
                    <button
                      onClick={() => {
                        onOpenSettings();
                        setIsSettingsOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
                    >
                      <Settings size={16} />
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        setShowAbout(true);
                        setIsSettingsOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
                    >
                      <Info size={16} />
                      About
                    </button>
                    {isLoggedIn ? (
                      <button
                        onClick={() => {
                          logout();
                          setIsSettingsOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        Log Out
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          loginWithGoogle();
                          setIsSettingsOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
                      >
                        <LogIn size={16} />
                        Log In
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Botón de menú móvil */}
            <div className="md:hidden flex-shrink-0">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none"
              >
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Menú móvil */}
        {isMenuOpen && (
          <div className="md:hidden absolute w-full bg-[var(--bg-primary)] border-b border-[var(--border-primary)]">
            <div className="px-2 pt-2 pb-2 space-y-1 flex flex-col items-center">
              <button onClick={() => {
                navigateTo('tasks');
                setIsMenuOpen(false);
              }} className="px-3 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] w-full text-center">
                Tasks
              </button>
              <button onClick={() => {
                navigateTo('calendar');
                setIsMenuOpen(false);
              }} className="px-3 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] w-full text-center">
                Calendar
              </button>
              <button onClick={() => {
                navigateTo('session');
                setIsMenuOpen(false);
              }} className="px-3 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] w-full text-center">
                Session
              </button>
              <button onClick={() => {
                navigateTo('notes');
                setIsMenuOpen(false);
              }} className="px-3 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] w-full text-center">
                Notes
              </button>
              <button onClick={() => {
                navigateTo('stats');
                setIsMenuOpen(false);
              }} className="px-3 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] w-full text-center">
                Statistics
              </button>
              <button
                onClick={() => {
                  onOpenSettings();
                  setIsMenuOpen(false);
                }}
                className="px-3 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] w-full text-center"
              >
                Settings
              </button>
              <button
                onClick={() => {
                  setShowAbout(true);
                  setIsMenuOpen(false);
                }}
                className="px-3 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] w-full text-center"
              >
                About
              </button>
            </div>
          </div>
        )}
      </nav>

      {showAbout && (
        <AboutModal
          isOpen={showAbout}
          onClose={() => setShowAbout(false)}
        />
      )}
    </>
  );
};

export default Navbar; 