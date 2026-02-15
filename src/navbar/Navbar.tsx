import { BarChart3, BookOpen, Calendar, CircleCheckBig, Github, ListTodo, Timer } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useFetchTasks, useTasks, useWorkspace, useWorkspaceActions } from '@/store/appStore';

import Settings from './Settings';
import SettingsButton from './SettingsButton';
import WorkspaceDropdown from './WorkspaceDropdown';
import { supabase } from '@/utils/supabaseClient';
import { toast } from 'react-hot-toast';
import useAppStore from '@/store/appStore';
import { useAuth } from '@/hooks/useAuth';
import useDemoMode from '@/utils/useDemoMode';
import { useNavigation } from '@/navbar/NavigationContext';

const Navbar = () => {
  const { isLoggedIn, loginWithGoogle, logout, user } = useAuth();
  const { activePage, navigateTo, navOrder, setNavOrder } = useNavigation();
  const { workspaces, currentWorkspace: activeWorkspace } = useWorkspace();
  const { tasks } = useTasks();
  const { setCurrentWorkspace, setWorkspaces } = useWorkspaceActions();
  const fetchTasks = useFetchTasks();
  const { isDemo } = useDemoMode();
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Load workspaces from Supabase on mount
  useEffect(() => {
    const fetchWorkspaces = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Navbar: Error getting user:', userError);
      }

      if (!user) {
        setWorkspaces([]);
        localStorage.removeItem('activeWorkspaceId');
        localStorage.removeItem('workspacesHydrated');
        return;
      }

      // Always fetch real workspaces if user exists, regardless of demo mode
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setWorkspaces(data);
        const savedId = localStorage.getItem('activeWorkspaceId');
        if (savedId) {
          const found = data.find((ws: any) => ws.id === savedId);
          if (found) setCurrentWorkspace(found);
        } else if (data.length > 0) {
          // If no saved workspace but workspaces exist, set the first one as active
          setCurrentWorkspace(data[0]);
          localStorage.setItem('activeWorkspaceId', data[0].id);
        }
      } else {
        console.error('Navbar: Error fetching workspaces:', error);
      }
    };
    fetchWorkspaces();
  }, [setWorkspaces, setCurrentWorkspace]);

  // Fetch tasks for all workspaces to get accurate counts
  useEffect(() => {
    const fetchAllTasks = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const { data: allTasks, error } = await supabase
          .from('tasks')
          .select('id, title, description, completed, completed_at, created_at, updated_at, user_id, assignment, difficulty, activetask, deadline, workspace_id, recurrence_type, recurrence_weekdays, start_at, end_at')
          .eq('user_id', user.id)
          .order('assignment');

        if (!error && allTasks) {
          // Update the global tasks state with all tasks
          useAppStore.setState((state) => ({
            tasks: { ...state.tasks, tasks: allTasks, error: null, isCached: true, lastFetch: Date.now() }
          }));
        }
      } catch (error) {
        console.error('Error fetching all tasks for workspace counts:', error);
      }
    };

    if (workspaces.length > 0) {
      fetchAllTasks();
    }
  }, [workspaces.length]); // Re-fetch when workspaces change

  // Clear workspaces if not logged in (but not in demo mode)
  useEffect(() => {
    if (!isLoggedIn && !isDemo) {
      setWorkspaces([]);
      localStorage.removeItem('activeWorkspaceId');
      localStorage.removeItem('workspacesHydrated');
    }
  }, [isLoggedIn, isDemo, setWorkspaces]);

  // Load friend requests from Supabase
  const fetchRequests = useCallback(async () => {
    if (!user) {
      setReceivedRequests([]);
      setSentRequests([]);
      return;
    }
    const { data: rec } = await supabase
      .from('friend_requests')
      .select('*, from_user:profiles!friend_requests_from_user_id_fkey(username, avatar_url)')
      .eq('to_user_id', user.id)
      .eq('status', 'pending');
    const { data: sent } = await supabase
      .from('friend_requests')
      .select('*, to_user:profiles!friend_requests_to_user_id_fkey(username, avatar_url)')
      .eq('from_user_id', user.id)
      .eq('status', 'pending');
    setReceivedRequests(rec || []);
    setSentRequests(sent || []);
  }, [user]);
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const fetchFriends = useCallback(async () => {
    if (!user) {
      setFriends([]);
      return;
    }
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .or(`user1.eq.${user.id},user2.eq.${user.id}`);
    if (error) {
      setFriends([]);
      return;
    }
    // Map to get the friend user id (the other one)
    const friendIds = data.map(row => row.user1 === user.id ? row.user2 : row.user1);
    // Fetch friend profiles
    if (friendIds.length === 0) {
      setFriends([]);
      return;
    }
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, email, avatar_url')
      .in('id', friendIds);
    if (profilesError) {
      setFriends([]);
      return;
    }
    setFriends(profiles);
  }, [user]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);


  // Calcula el número de tasks por workspace (solo incompletas)
  const workspacesWithTaskCount = (Array.isArray(workspaces) ? workspaces : []).map(ws => {
    const taskCount = tasks.filter(task => {
      return task.workspace_id === ws.id && !task.completed;
    }).length;
    return {
      ...ws,
      taskCount
    };
  });

  // Workspace handlers
  const handleSelectWorkspace = (ws: any) => {
    setCurrentWorkspace(ws);
    localStorage.setItem('activeWorkspaceId', ws.id);
  };
  const handleCreateWorkspace = (newWorkspace: any) => {
    setWorkspaces([...workspaces, newWorkspace]);
  };
  const handleEditWorkspace = (updatedWorkspace: any) => {
    setWorkspaces(workspaces.map((ws: any) => ws.id === updatedWorkspace.id ? updatedWorkspace : ws));
    if (activeWorkspace?.id === updatedWorkspace.id) {
      setCurrentWorkspace(updatedWorkspace);
    }
  };
  const handleDeleteWorkspace = (workspaceId: any) => {
    const updatedWorkspaces = workspaces.filter((ws: any) => ws.id !== workspaceId);
    setWorkspaces(updatedWorkspaces);
    if (activeWorkspace?.id === workspaceId) {
      const newActiveWorkspace = updatedWorkspaces.length > 0 ? updatedWorkspaces[0] : null;
      setCurrentWorkspace(newActiveWorkspace);
    }
  };

  const refreshWorkspaces = () => {
    // This will trigger a re-calculation of task counts
    // The workspacesWithTaskCount will be recalculated with fresh task data
    fetchTasks(undefined, true); // Fetch ALL tasks (no workspace filter) with force refresh
  };

  // Send friend request logic
  const handleSendRequest = async (username: any, { onSuccess, onError }: { onSuccess: any; onError: any }) => {
    try {
      if (!user) {
        onError && onError('You must be logged in to send a friend request.');
        return;
      }
      // 1. Find user by username
      const { data: toUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      if (userError || !toUser) {
        onError && onError('User not found.');
        return;
      }
      if (toUser.id === user.id) {
        onError && onError('You cannot send a friend request to yourself.');
        return;
      }
      // 2. Insert friend request
      const { error: insertError } = await supabase
        .from('friend_requests')
        .insert({ from_user_id: user.id, to_user_id: toUser.id, status: 'pending' });
      if (insertError) {
        if (insertError.message && insertError.message.includes('duplicate')) {
          onError && onError('Friend request already sent.');
        } else {
          onError && onError('Error sending friend request: ' + insertError.message);
        }
        return;
      }
      // 3. Refresh requests
      await fetchRequests();
      onSuccess && onSuccess();
    } catch (err) {
      onError && onError('Unexpected error: ' + (err as any)?.message || err);
    }
  };
  const handleAccept = async (request: any) => {
    try {
      console.warn('[ACCEPT] Iniciando proceso para request:', request);
      // 1. Actualiza la solicitud a "accepted"
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', request.id);
      if (updateError) {
        toast.error('Error updating request: ' + updateError.message);
        return;
      }
      console.warn('[ACCEPT] Solicitud actualizada a accepted');
      // 2. Inserta en la tabla friends (amistad simétrica)
      const [user1, user2] = [request.from_user_id, request.to_user_id].sort();
      const { error: insertError } = await supabase
        .from('friends')
        .insert([{ user1, user2 }]);
      if (insertError && !insertError.message.includes('duplicate key value')) {
        toast.error('Error creating friendship: ' + insertError.message);
        return;
      }
      if (insertError && insertError.message.includes('duplicate key value')) {
        console.warn('[ACCEPT] Amistad ya existía, ignorando error de duplicado.');
      } else {
        console.warn('[ACCEPT] Amistad insertada en tabla friends');
      }
      // 3. Refresca solicitudes y amigos
      await fetchRequests();
      await fetchFriends();
      console.warn('[ACCEPT] Solicitudes y amigos refrescados');
      toast.success('Friend request accepted!');
    } catch (error) {
      toast.error('Unexpected error: ' + (error as any).message);
      console.error('[ACCEPT] Error inesperado:', error);
    }
  };
  const handleReject = async (request: any) => {
    try {
      console.warn('[REJECT] Iniciando proceso para request:', request);
      // 1. Actualiza la solicitud a "rejected"
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', request.id);
      if (updateError) {
        toast.error('Error updating request: ' + updateError.message);
        return;
      }
      console.warn('[REJECT] Solicitud actualizada a rejected');
      // 2. Refresca solicitudes
      await fetchRequests();
      console.warn('[REJECT] Solicitudes refrescadas');
      toast.success('Friend request rejected!');
    } catch (error) {
      toast.error('Unexpected error: ' + (error as any).message);
      console.error('[REJECT] Error inesperado:', error);
    }
  };

  
  // Navigation link class
  const isActive = (page: any) => activePage === page;
  const navLinkClass = (page: any) =>
    `px-4 py-2 rounded-md ${isActive(page) ? 'text-[var(--accent-primary)] ' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium'}`;

  // Icon mapping
  const iconMap = {
    calendar: Calendar,
    tasks: ListTodo,
    session: Timer,
    habits: CircleCheckBig,
    notes: BookOpen,
    stats: BarChart3,
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: any) => {
    setIsDragging(true);
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const draggedIndex = navOrder.findIndex(item => item.page === draggedItem.page);
    if (draggedIndex === dropIndex) {
      setIsDragging(false);
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...navOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    
    setNavOrder(newOrder);
    setIsDragging(false);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] z-[10000] overflow-x-hidden" data-tour="navbar">
      <div className="w-full px-2 overflow-x-hidden">
        <div className="flex items-center justify-between h-16 w-full">
          {/* Logo a la izquierda */}
          <div className="flex items-center flex-shrink-0">
            {/* Mobile: Show "UT" with U in white and T in accent */}
            <span className="lg:hidden text-[var(--text-primary)] font-bold text-lg sm:text-xl">U</span>
            <span className="lg:hidden text-[var(--accent-primary)] font-bold text-lg sm:text-xl">T</span>
            {/* Desktop: Show full "UniTracker" */}
            <span className="hidden lg:inline text-[var(--text-primary)] font-bold text-lg lg:text-lg xl:text-2xl">Uni</span>
            <span className="hidden lg:inline text-[var(--accent-primary)] font-bold text-lg lg:text-lg xl:text-2xl">Tracker</span>
          </div>
          {/* Botones de páginas al centro */}
          <div className="flex-1 flex justify-center items-center">
            <div className="hidden lg:flex space-x-4 lg:space-x-4 items-center justify-center">
              {navOrder.map(({ page, label }, index) => {
                const Icon = iconMap[page as keyof typeof iconMap];
                return (
                  <div
                    key={page}
                    draggable
                    onDragStart={(e) => handleDragStart(e, { page, label })}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`relative ${dragOverIndex === index ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--accent-primary)]' : ''} ${isDragging ? 'cursor-move' : ''} hover:after:absolute hover:after:bottom-0 hover:after:left-0 hover:after:right-0 hover:after:h-0.5 hover:after:bg-[var(--accent-primary)] transition-all duration-200`}
                  >
                    <button
                      onClick={() => navigateTo(page as any)}
                      className={navLinkClass(page) + ' text-sm sm:text-sm md:text-base lg:text-base xl:text-lg flex items-center gap-1 cursor-grab active:cursor-grabbing'}
                      data-page={page}
                    >
                      <Icon className={`${page === 'habits' ? 'w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-5.5 md:h-5.5 lg:w-4.5 lg:h-4.5 xl:w-5.5 xl:h-5.5' : 'w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6'} mr-1`} />
                      <span className="hidden md:inline text-sm sm:text-sm md:text-base lg:text-base xl:text-lg">{label}</span>
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex lg:hidden space-x-0 sm:space-x-0.5 md:space-x-1 items-center justify-center">
              {navOrder.map(({ page, label }, index) => {
                const Icon = iconMap[page as keyof typeof iconMap];
                return (
                  <div
                    key={page}
                    draggable
                    onDragStart={(e) => handleDragStart(e, { page, label })}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`relative ${dragOverIndex === index ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--accent-primary)]' : ''} ${isDragging ? 'cursor-move' : ''} hover:after:absolute hover:after:bottom-0 hover:after:left-0 hover:after:right-0 hover:after:h-0.5 hover:after:bg-[var(--accent-primary)] transition-all duration-200`}
                  >
                    <button
                      onClick={() => navigateTo(page as any)}
                      className={`p-1 sm:p-1.5 rounded-md flex flex-col items-center justify-center transition-colors duration-150 cursor-grab active:cursor-grabbing ${isActive(page) ? 'text-[var(--accent-primary)] bg-[var(--bg-secondary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}
                      data-page={page}
                    >
                      <Icon className={`${page === 'habits' ? 'w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-5.5 md:h-5.5 lg:w-4.5 lg:h-4.5 xl:w-5.5 xl:h-5.5' : 'w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6'}`} />
                      <span className="text-[9px] sm:text-[10px] mt-0.5 font-medium hidden sm:inline md:hidden">{label}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Workspace, GitHub y Settings a la derecha */}
          <div className="flex items-center gap-0 sm:gap-0.5 md:gap-1 lg:gap-2 flex-shrink-0">
            {/* Workspace and GitHub only visible on desktop */}
            <div className="hidden lg:flex items-center gap-0 sm:gap-0.5 md:gap-1 lg:gap-2">
              <WorkspaceDropdown
                workspaces={workspacesWithTaskCount}
                activeWorkspace={activeWorkspace}
                onSelectWorkspace={handleSelectWorkspace}
                onCreateWorkspace={handleCreateWorkspace}
                onEditWorkspace={handleEditWorkspace}
                onDeleteWorkspace={handleDeleteWorkspace}
                onRefreshWorkspaces={refreshWorkspaces}
                data-tour="workspace-selector"
              />
              <a
                href="https://github.com/rickypcyt/unitracker"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                title="View on GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
            
            {/* Settings button - always visible */}
            <SettingsButton
              isLoggedIn={isLoggedIn}
              loginWithGoogle={loginWithGoogle}
              logout={logout}
              hasFriendRequests={receivedRequests.length > 0}
              receivedRequests={receivedRequests}
              sentRequests={sentRequests}
              onSendRequest={handleSendRequest}
              onAccept={handleAccept}
              onReject={handleReject}
              friends={friends}
              workspaces={workspacesWithTaskCount}
              activeWorkspace={activeWorkspace}
              onSelectWorkspace={handleSelectWorkspace}
              githubUrl="https://github.com/rickypcyt/unitracker"
            />
          </div>
        </div>
      </div>
      {showSettings && (
        <Settings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </nav>
  );
};

export default Navbar; 