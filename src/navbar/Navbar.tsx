import { BarChart3, BookOpen, Calendar, CircleCheckBig, LayoutDashboard, ListTodo, Menu, Timer, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useFetchTasks, useTasksOnly, useWorkspace, useWorkspaceActions } from '@/store/appStore';

import SettingsButton from './SettingsButton';
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
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const handleNavigate = (page: any) => {
    navigateTo(page);
    setMobileOpen(false);
  };

  const allNavItems = [...navOrder];
  if (isAdmin) {
    allNavItems.push({ page: 'admin' as any, icon: null, label: 'Admin' });
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-[10001] p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[10000]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed top-0 left-0 bottom-0 w-16 lg:w-20 bg-[var(--bg-primary)] border-r border-[var(--border-primary)] z-[10000] flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        data-tour="navbar"
      >
        {/* Logo + mobile close */}
        <div className="h-16 flex items-center justify-center border-b border-[var(--border-primary)] flex-shrink-0">
          <span className="text-[var(--text-primary)] font-bold text-lg">U</span>
          <span className="text-[var(--accent-primary)] font-bold text-lg">T</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden absolute top-3 right-3 p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          <div className="flex flex-col items-center gap-1">
            {allNavItems.map(({ page, label }, index) => {
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
                  className="w-full flex justify-center"
                >
                  <button
                    onClick={() => handleNavigate(page)}
                    onMouseEnter={() => preloadPage(page)}
                    className={`group relative w-12 lg:w-16 h-12 lg:h-14 rounded-xl flex flex-col items-center justify-center transition-all duration-150 cursor-grab active:cursor-grabbing ${
                      isActive(page)
                        ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                    } ${dragOverIndex === index ? 'ring-2 ring-[var(--accent-primary)]/40' : ''}`}
                    data-page={page}
                    title={label}
                  >
                    <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
                    <span className="text-[9px] lg:text-[10px] mt-0.5 font-medium leading-none hidden lg:block">{label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Settings at bottom */}
        <div className="flex justify-center py-3 border-t border-[var(--border-primary)] flex-shrink-0">
          <SettingsButton />
        </div>
      </nav>
    </>
  );
};

export default Navbar;