import { BarChart3, BookOpen, Calendar, CircleCheckBig, LayoutDashboard, ListTodo, Timer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useFetchTasks, useTasksOnly, useWorkspace, useWorkspaceActions } from '@/store/appStore';

import SettingsButton from './SettingsButton';
import SettingsPanel from '@/modals/Settings';
import { supabase } from '@/utils/supabaseClient';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import useDemoMode from '@/utils/useDemoMode';
import { useFriendManagement } from '@/hooks/useFriendManagement';
import { useNavigation } from '@/navbar/NavigationContext';
import { preloadPage } from '@/App';

const Navbar = () => {
  const { isLoggedIn, user } = useAuth();
  const { activePage, navigateTo, navOrder, setNavOrder } = useNavigation();
  const { workspaces, currentWorkspace: activeWorkspace } = useWorkspace();
  const tasks = useTasksOnly();
  const { setCurrentWorkspace, setWorkspaces } = useWorkspaceActions();
  const fetchTasks = useFetchTasks();
  const { isDemo } = useDemoMode();
  const [showSettings, setShowSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const prevRequestCountRef = useRef<number | null>(null);

  const {
    friends,
    receivedRequests,
    handleRemoveFriend,
  } = useFriendManagement(user?.id);

  // Load workspaces from Supabase on mount
  useEffect(() => {
    const fetchWorkspaces = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Navbar: Error getting user:', userError);
      }

      if (!user) {
        setWorkspaces([]);
        setCurrentWorkspace(null);
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
        const isStale = activeWorkspace && !data.some((ws: any) => ws.id === activeWorkspace.id);
        if (savedId) {
          const found = data.find((ws: any) => ws.id === savedId);
          if (found) {
            setCurrentWorkspace(found);
          } else if (data.length > 0) {
            // Saved ID no longer exists, pick first workspace
            setCurrentWorkspace(data[0]);
            localStorage.setItem('activeWorkspaceId', data[0].id);
          }
        } else if (data.length > 0 && (!activeWorkspace || isStale)) {
          // Set first workspace as active if none selected or current one is stale
          setCurrentWorkspace(data[0]);
          localStorage.setItem('activeWorkspaceId', data[0].id);
        }
      } else {
        console.error('Navbar: Error fetching workspaces:', error);
      }
    };
    fetchWorkspaces();
  }, [setWorkspaces, setCurrentWorkspace, isLoggedIn]);

  // Fetch tasks for all workspaces to get accurate counts (includes shared workspaces via fetchTasks)
  useEffect(() => {
    const fetchAllTasks = async () => {
      try {
        await fetchTasks(undefined, true);
      } catch (error) {
        console.error('Error fetching all tasks for workspace counts:', error);
      }
    };

    if (workspaces.length > 0) {
      void fetchAllTasks();
    }
  }, [workspaces.length, fetchTasks]); // Re-fetch when workspaces change

  // Clear workspaces if not logged in (but not in demo mode)
  useEffect(() => {
    if (!isLoggedIn && !isDemo) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      localStorage.removeItem('activeWorkspaceId');
      localStorage.removeItem('workspacesHydrated');
    }
  }, [isLoggedIn, isDemo, setWorkspaces, setCurrentWorkspace]);

  useEffect(() => {
    const currentCount = receivedRequests.length;
    const prevCount = prevRequestCountRef.current;

    if (prevCount !== null && currentCount > prevCount) {
      const newCount = currentCount - prevCount;
      if (newCount === 1) {
        const senderName = receivedRequests[0]?.from_user?.username || 'Someone';
        toast.success(`New friend request from ${senderName}`);
      } else {
        toast.success(`${newCount} new friend requests`);
      }
    }

    prevRequestCountRef.current = currentCount;
  }, [receivedRequests]);


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
    admin: LayoutDashboard,
  };

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const isAdmin = !!user?.email && user.email === adminEmail;

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
                      onMouseEnter={() => preloadPage(page)}
                      className={navLinkClass(page) + ' text-sm sm:text-sm md:text-base lg:text-base xl:text-lg flex items-center gap-1 cursor-grab active:cursor-grabbing'}
                      data-page={page}
                    >
                      <Icon className={`${page === 'habits' ? 'w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-5.5 md:h-5.5 lg:w-4.5 lg:h-4.5 xl:w-5.5 xl:h-5.5' : 'w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6'} mr-1`} />
                      <span className="hidden md:inline text-sm sm:text-sm md:text-base lg:text-base xl:text-lg">{label}</span>
                    </button>
                  </div>
                );
              })}
              {isAdmin && (
                <div className="relative hover:after:absolute hover:after:bottom-0 hover:after:left-0 hover:after:right-0 hover:after:h-0.5 hover:after:bg-[var(--accent-primary)] transition-all duration-200">
                  <button
                    onClick={() => navigateTo('admin' as any)}
                    onMouseEnter={() => preloadPage('admin')}
                    className={navLinkClass('admin') + ' text-sm sm:text-sm md:text-base lg:text-base xl:text-lg flex items-center gap-1'}
                    data-page="admin"
                  >
                    <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6 mr-1" />
                    <span className="hidden md:inline text-sm sm:text-sm md:text-base lg:text-base xl:text-lg">Admin</span>
                  </button>
                </div>
              )}
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
                      onMouseEnter={() => preloadPage(page)}
                      className={`p-1 sm:p-1.5 rounded-md flex flex-col items-center justify-center transition-colors duration-150 cursor-grab active:cursor-grabbing ${isActive(page) ? 'text-[var(--accent-primary)] bg-[var(--bg-secondary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}
                      data-page={page}
                    >
                      <Icon className={`${page === 'habits' ? 'w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-5.5 md:h-5.5 lg:w-4.5 lg:h-4.5 xl:w-5.5 xl:h-5.5' : 'w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6'}`} />
                      <span className="text-[9px] sm:text-[10px] mt-0.5 font-medium hidden sm:inline md:hidden">{label}</span>
                    </button>
                  </div>
                );
              })}
              {isAdmin && (
                <div className="relative">
                  <button
                    onClick={() => navigateTo('admin' as any)}
                    onMouseEnter={() => preloadPage('admin')}
                    className={`p-1 sm:p-1.5 rounded-md flex flex-col items-center justify-center transition-colors duration-150 ${isActive('admin') ? 'text-[var(--accent-primary)] bg-[var(--bg-secondary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}
                    data-page="admin"
                  >
                    <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
                    <span className="text-[9px] sm:text-[10px] mt-0.5 font-medium hidden sm:inline md:hidden">Admin</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Settings a la derecha */}
          <div className="flex items-center gap-0 sm:gap-0.5 md:gap-1 lg:gap-2 flex-shrink-0">
            {/* Settings button - always visible */}
            <SettingsButton
              friends={friends}
              workspaces={workspacesWithTaskCount}
              onRemoveFriend={handleRemoveFriend}
            />
          </div>
        </div>
      </div>
      {showSettings && (
        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          friends={friends}
          workspaces={workspacesWithTaskCount}
          onRemoveFriend={handleRemoveFriend}
        />
      )}
    </nav>
  );
};

export default Navbar; 