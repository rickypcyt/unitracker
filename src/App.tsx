import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { FC, Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { NavigationProvider, PAGE_PATHS, useNavigation } from "@/navbar/NavigationContext";
import { useAuthActions, useFetchTasks, useTasksOnly, useWorkspace, useWorkspaceActions } from "@/store/appStore";
import type { Workspace } from "@/types/workspace";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import FloatingFooter from "@/components/FloatingFooter";
import LandingPage from "@/pages/landing/LandingPage";
import PageLoader from "@/components/PageLoader";
import { NoiseProvider } from "@/utils/NoiseContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TourManager from "./components/TourManager";
import Settings from "@/modals/Settings";

// Lazy load landing pages for better initial bundle
const PricingPage = lazy(() => import("@/pages/landing/PricingPage"));
const ComparePage = lazy(() => import("@/pages/landing/ComparePage"));
const BlogListPage = lazy(() => import("@/pages/landing/BlogListPage"));
const BlogPostPage = lazy(() => import("@/pages/landing/BlogPostPage"));
import UserModal from "@/modals/UserModal";
import { supabase } from "@/utils/supabaseClient";
import { warnNotificationsBlocked } from "@/utils/desktopNotifications";
import { useFriendManagement } from "@/hooks/useFriendManagement";
import { useWorkspaceLoader } from "@/hooks/useWorkspaceLoader";

// Direct imports for stacked pages
import CalendarPage from "@/pages/calendar/CalendarPage";
import FocusWidgetPage from "@/pages/FocusWidgetPage";
import HabitsPage from "@/pages/habits/HabitsPage";
import Notes from "@/pages/notes/Notes";
import SessionPage from "@/pages/session/SessionPage";
import StatsPage from "@/pages/stats/StatsPage";
import TasksPage from "@/pages/tasks/TasksPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import Sidebar from "@/components/Sidebar";

// Preload map: import functions for each page to enable hover-based preloading
const preloadMap: Record<string, () => Promise<unknown>> = {
  session: () => import("@/pages/session/SessionPage"),
  tasks: () => import("@/pages/tasks/TasksPage"),
  calendar: () => import("@/pages/calendar/CalendarPage"),
  analytics: () => import("@/pages/stats/StatsPage"),
  habits: () => import("@/pages/habits/HabitsPage"),
  notes: () => import("@/pages/notes/Notes"),
  focusWidget: () => import("@/pages/FocusWidgetPage"),
  admin: () => import("@/pages/admin/AdminDashboard"),
};

const preloadedPages = new Set<string>();

export const preloadPage = (page: string) => {
  if (preloadedPages.has(page)) return;
  const loader = preloadMap[page];
  if (loader) {
    preloadedPages.add(page);
    loader();
  }
};

// -------------------------
// Pages mapping
// -------------------------
const pagesMap: Record<string, FC> = {
  session: SessionPage,
  tasks: TasksPage,
  calendar: CalendarPage,
  analytics: StatsPage,
  habits: HabitsPage,
  notes: Notes,
  focusWidget: FocusWidgetPage,
  admin: AdminDashboard,
};


// -------------------------
// PageContent component
// -------------------------
const PageContent: FC = () => {
  const { activePage, isSettingsOpen, closeSettings } = useNavigation();
  const { workspaces, currentWorkspace: activeWorkspace } = useWorkspace();
  const tasks = useTasksOnly();
  const { setCurrentWorkspace, setWorkspaces } = useWorkspaceActions();
  const fetchTasks = useFetchTasks();
  const { user } = useAuth();
  const { friends, handleRemoveFriend } = useFriendManagement(user?.id);
  useWorkspaceLoader();
  
  const ActiveComponent = pagesMap[activePage] || SessionPage;

  // Workspace handlers
  const handleSelectWorkspace = (ws: Workspace) => {
    setCurrentWorkspace(ws);
    localStorage.setItem('activeWorkspaceId', String(ws.id));
  };
  
  const handleCreateWorkspace = (newWorkspace: Workspace) => {
    setWorkspaces([...workspaces, newWorkspace]);
  };
  
  const handleEditWorkspace = (updatedWorkspace: Workspace) => {
    setWorkspaces(workspaces.map((ws: Workspace) => ws.id === updatedWorkspace.id ? updatedWorkspace : ws));
    if (activeWorkspace?.id === updatedWorkspace.id) {
      setCurrentWorkspace(updatedWorkspace);
    }
  };
  
  const handleDeleteWorkspace = (workspaceId: Workspace['id']) => {
    const updatedWorkspaces = workspaces.filter((ws: Workspace) => ws.id !== workspaceId);
    setWorkspaces(updatedWorkspaces);
    if (activeWorkspace?.id === workspaceId) {
      const newActiveWorkspace = updatedWorkspaces.length > 0 ? updatedWorkspaces[0] ?? null : null;
      setCurrentWorkspace(newActiveWorkspace);
    }
  };

  const refreshWorkspaces = () => {
    fetchTasks(undefined, true);
  };

  // Calcula el número de tasks por workspace (solo incompletas)
  const workspacesWithTaskCount = useMemo(() => (Array.isArray(workspaces) ? workspaces : []).map(ws => {
    const taskCount = tasks.filter(task => {
      return task.workspace_id === ws.id && !task.completed;
    }).length;
    return {
      ...ws,
      taskCount
    };
  }), [workspaces, tasks]);

  // Focus widget page should occupy full screen without navbar
  if (activePage === 'focusWidget') {
    return (
      <>
        <Suspense fallback={<PageLoader fullScreen />}>
          <ActiveComponent />
        </Suspense>
        <Settings
          isOpen={isSettingsOpen}
          onClose={closeSettings}
          friends={friends}
          workspaces={workspaces}
          {...(handleRemoveFriend && { onRemoveFriend: handleRemoveFriend })}
          {...(user?.id && { currentUserId: user.id })}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] w-full overflow-x-hidden flex flex-row">
      <Sidebar />
      <div className="min-w-0 flex-1 relative lg:pl-16">
        <Suspense fallback={<PageLoader />}>
          <div className="px-4 pb-4 pt-[4.5rem] lg:pt-4 sm:px-6 lg:px-8 2xl:px-12 overflow-x-hidden">
            {activePage === 'session' && <SessionPage />}

            {activePage === 'tasks' && (
              <TasksPage />
            )}

            {activePage === 'calendar' && <CalendarPage />}

            {activePage === 'analytics' && <StatsPage />}

            {activePage === 'habits' && <HabitsPage />}

            {activePage === 'notes' && <Notes />}

            {activePage === 'admin' && <AdminDashboard />}
          </div>
        </Suspense>
      </div>
      <FloatingFooter
        workspaces={workspacesWithTaskCount}
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspace={handleCreateWorkspace}
        onEditWorkspace={handleEditWorkspace}
        onDeleteWorkspace={handleDeleteWorkspace}
        onRefreshWorkspaces={refreshWorkspaces}
        friends={friends}
        {...(user?.id && { currentUserId: user.id })}
      />
      <Settings
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        friends={friends}
        workspaces={workspaces}
        {...(handleRemoveFriend && { onRemoveFriend: handleRemoveFriend })}
        {...(user?.id && { currentUserId: user.id })}
      />
    </div>
  );
};

const AppRoute: FC = () => (
  <NavigationProvider>
    <TourManager>
      <PageContent />
    </TourManager>
  </NavigationProvider>
);

// -------------------------
// Supabase auth sync
// -------------------------
function useSupabaseAuthSync(): void {
  const { setUser, clearUser } = useAuthActions();

  useEffect(() => {
    // Inicializa usuario si hay sesión
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user);
      else clearUser();
    });

    // Escucha cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) setUser(session.user);
        else clearUser();
      }
    );

    return () => listener?.subscription.unsubscribe();
  }, [setUser, clearUser]);
}

// -------------------------
// User modal gate
// -------------------------
const UserModalGate: FC = () => {
  const { user, isLoggedIn } = useAuth() as {
    user: any;
    isLoggedIn: boolean;
  };
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      setShowUserModal(false);
      return;
    }

    const checkUsername = async (): Promise<void> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      setShowUserModal(!error && (!data || !data.username));
    };

    checkUsername();
  }, [isLoggedIn, user]);

  return (
    <UserModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} />
  );
};

const RootRoute: FC = () => {
  const { isLoggedIn, isAuthLoading } = useAuth();

  if (isAuthLoading) return <PageLoader fullScreen />;
  return isLoggedIn ? <Navigate to={PAGE_PATHS.session} replace /> : <LandingPage />;
};

// -------------------------
// Main App component
// -------------------------
const App: FC = () => {
  const navigate = useNavigate();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useSupabaseAuthSync();

  // -------------------------
  // Notifications & keyboard
  // -------------------------
  useEffect(() => {
    const requestNotificationPermission = async (): Promise<void> => {
      if (typeof window === "undefined") {
        return;
      }

      if (!("Notification" in window)) {
        return;
      }

      if (Notification.permission === "default") {
        const permissionRequested = localStorage.getItem("notificationPermissionRequested");

        if (!permissionRequested) {
          try {
            await Notification.requestPermission();
            localStorage.setItem("notificationPermissionRequested", "true");
          } catch (error) {
            console.error("Notification permission request failed:", error);
          }
        }
      } else if (Notification.permission === "denied") {
        // Warn once per session that desktop notifications won't fire
        if (!sessionStorage.getItem("notificationsBlockedWarned")) {
          sessionStorage.setItem("notificationsBlockedWarned", "true");
          warnNotificationsBlocked();
        }
      }
    };

    requestNotificationPermission();

    return () => {};
  }, []);

  // -------------------------
  // Swipe navigation
  // -------------------------
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.changedTouches[0]?.screenX || 0;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX.current = e.changedTouches[0]?.screenX || 0;
      const diff = touchEndX.current - touchStartX.current;
      if (Math.abs(diff) > 60) swipeNavigate(diff, navigate);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [navigate]);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        toastStyle={{
          background: "var(--bg-secondary)",
          color: "var(--text-primary)",
          padding: "12px 16px",
          borderRadius: "8px",
          border: "2px solid var(--border-primary)",
        }}
      />
      <NoiseProvider>
        <AuthProvider>
          <UserModalGate />
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/pricing" element={<Suspense fallback={<PageLoader fullScreen />}><PricingPage /></Suspense>} />
            <Route path="/compare" element={<Suspense fallback={<PageLoader fullScreen />}><ComparePage /></Suspense>} />
            <Route path="/blog" element={<Suspense fallback={<PageLoader fullScreen />}><BlogListPage /></Suspense>} />
            <Route path="/blog/:slug" element={<Suspense fallback={<PageLoader fullScreen />}><BlogPostPage /></Suspense>} />
            <Route path="/app" element={<Navigate to={PAGE_PATHS.session} replace />} />
            <Route path={PAGE_PATHS.session} element={<AppRoute />} />
            <Route path={PAGE_PATHS.tasks} element={<AppRoute />} />
            <Route path={PAGE_PATHS.calendar} element={<AppRoute />} />
            <Route path={PAGE_PATHS.analytics} element={<AppRoute />} />
            <Route path={PAGE_PATHS.habits} element={<AppRoute />} />
            <Route path={PAGE_PATHS.notes} element={<AppRoute />} />
            <Route path={PAGE_PATHS.focusWidget} element={<AppRoute />} />
            <Route path={PAGE_PATHS.admin} element={<AppRoute />} />
            {/* Legacy route aliases */}
            <Route path="/stats" element={<Navigate to={PAGE_PATHS.analytics} replace />} />
            <Route path="/focusWidget" element={<Navigate to={PAGE_PATHS.focusWidget} replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </NoiseProvider>
    </>
  );
};

// -------------------------
// Helpers
// -------------------------
const navPages = ["tasks", "calendar", "session", "notes", "analytics", "habits"] as const;

const swipeNavigate = (diff: number, navigate: (path: string) => void): void => {
  const currentPage = window.localStorage.getItem("lastVisitedPage") || "session";
  const currentIdx = navPages.indexOf(currentPage as typeof navPages[number]);

  if (diff < 0 && currentIdx < navPages.length - 1) {
    const nextPage = navPages[currentIdx + 1];
    if (nextPage) navigate(PAGE_PATHS[nextPage]);
  } else if (diff > 0 && currentIdx > 0) {
    const prevPage = navPages[currentIdx - 1];
    if (prevPage) navigate(PAGE_PATHS[prevPage]);
  }
};

export default App;
