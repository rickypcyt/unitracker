import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { FC, Suspense, lazy, useEffect, useRef, useState } from "react";
import { NavigationProvider, useNavigation } from "@/navbar/NavigationContext";
import { useAuthActions, useFetchTasks, useTasks, useWorkspace, useWorkspaceActions } from "@/store/appStore";

import FloatingFooter from "@/components/FloatingFooter";
import Navbar from "@/navbar/Navbar";
import { NoiseProvider } from "@/utils/NoiseContext";
import { Toaster } from "react-hot-toast";
import TourManager from "./components/TourManager";
import UserModal from "@/modals/UserModal";
import { supabase } from "@/utils/supabaseClient";
import { useFriendManagement } from "@/hooks/useFriendManagement";

// Lazy load pages for better performance
const CalendarPage = lazy(() => import("@/pages/calendar/CalendarPage"));
const FocusWidgetPage = lazy(() => import("@/pages/FocusWidgetPage"));
const HabitsPage = lazy(() => import("@/pages/habits/HabitsPage"));
const Notes = lazy(() => import("@/pages/notes/Notes"));
const SessionPage = lazy(() => import("@/pages/session/SessionPage"));
const StatsPage = lazy(() => import("@/pages/stats/StatsPage"));
const TasksPage = lazy(() => import("@/pages/tasks/TasksPage"));

// -------------------------
// Pages mapping
// -------------------------
const pagesMap: Record<string, FC> = {
  session: SessionPage,
  tasks: TasksPage,
  calendar: CalendarPage,
  stats: StatsPage,
  habits: HabitsPage,
  notes: Notes,
  focusWidget: FocusWidgetPage,
};


// -------------------------
// PageContent component
// -------------------------
const PageContent: FC = () => {
  const { activePage } = useNavigation();
  const { workspaces, currentWorkspace: activeWorkspace } = useWorkspace();
  const { tasks } = useTasks();
  const { setCurrentWorkspace, setWorkspaces } = useWorkspaceActions();
  const fetchTasks = useFetchTasks();
  const { user } = useAuth();
  const { friends } = useFriendManagement(user?.id);
  
  const ActiveComponent = pagesMap[activePage] || SessionPage;

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
    fetchTasks(undefined, true);
  };

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

  // Focus widget page should occupy full screen without navbar
  if (activePage === 'focusWidget') {
    return (
      <Suspense fallback={null}>
        <ActiveComponent />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] w-full">
      <Navbar />
      <div className="pt-16">
        <Suspense fallback={null}>
          <ActiveComponent />
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
    </div>
  );
};

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

// -------------------------
// Main App component
// -------------------------
const App: FC = () => {
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
      }
    };

    requestNotificationPermission();

    window.addEventListener("keydown", () => {});
    return () => window.removeEventListener("keydown", () => {});
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
      if (Math.abs(diff) > 60) swipeNavigate(diff);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#333",
            color: "#fff",
            padding: "16px",
            borderRadius: "8px",
            border: "2px solid var(--border-primary)",
            marginTop: "64px", // Add top margin to avoid navbar
          },
        }}
      />
      <NoiseProvider>
        <AuthProvider>
          <UserModalGate />
            <NavigationProvider>
              <TourManager>
                <PageContent />
              </TourManager>
            </NavigationProvider>
        </AuthProvider>
      </NoiseProvider>
    </>
  );
};

// -------------------------
// Helpers
// -------------------------
const navPages = ["tasks", "calendar", "session", "notes", "stats", "habits"];

const swipeNavigate = (diff: number): void => {
  const currentPage =
    window.localStorage.getItem("lastVisitedPage") || "session";
  const currentIdx = navPages.indexOf(currentPage);

  if (diff < 0 && currentIdx < navPages.length - 1) {
    const nextPage = navPages[currentIdx + 1];
    window.localStorage.setItem("lastVisitedPage", nextPage || "");
    window.dispatchEvent(new Event("navigationchange"));
  } else if (diff > 0 && currentIdx > 0) {
    const prevPage = navPages[currentIdx - 1];
    window.localStorage.setItem("lastVisitedPage", prevPage || "");
    window.dispatchEvent(new Event("navigationchange"));
  }
};

export default App;
