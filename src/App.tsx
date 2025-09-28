import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { NavigationProvider, useNavigation } from "@/navbar/NavigationContext";
import { clearUser, setUser } from "@/store/slices/authSlice";
import { useEffect, useRef, useState, FC, MutableRefObject } from "react";
import { useDispatch } from "react-redux";

import type { AppDispatch } from "@/store/store";
import { User } from "@supabase/supabase-js";

import CalendarPage from "@/pages/calendar/CalendarPage";
import Navbar from "@/navbar/Navbar";
import Notes from "@/pages/notes/Notes";
import SessionPage from "@/pages/session/SessionPage";
import StatsPage from "@/pages/stats/StatsPage";
import TasksPage from "@/pages/tasks/TasksPage";
import UserModal from "@/modals/UserModal";
import { Toaster } from "react-hot-toast";
import TourManager from "./components/TourManager";

import { supabase } from "@/utils/supabaseClient";
import { fetchWorkspaces } from "@/store/slices/workspaceSlice";
import { hydrateTasksFromLocalStorage } from "@/store/slices/TaskSlice";
import { NoiseProvider } from "@/utils/NoiseContext";
import useTheme from "@/hooks/useTheme";

// -------------------------
// Pages mapping
// -------------------------
const pagesMap: Record<string, FC> = {
  session: SessionPage,
  tasks: TasksPage,
  calendar: CalendarPage,
  stats: StatsPage,
  notes: Notes,
};

// -------------------------
// PageContent component
// -------------------------
const PageContent: FC = () => {
  const { activePage } = useNavigation();
  const ActiveComponent = pagesMap[activePage] || SessionPage;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] w-full">
      <Navbar />
      <div className="pt-16">
        <ActiveComponent />
      </div>
    </div>
  );
};

// -------------------------
// Supabase auth sync
// -------------------------
function useSupabaseAuthSync(): void {
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    // Inicializa usuario si hay sesión
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) dispatch(setUser(user));
      else dispatch(clearUser());
    });

    // Escucha cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) dispatch(setUser(session.user));
        else dispatch(clearUser());
      }
    );

    return () => listener?.subscription.unsubscribe();
  }, [dispatch]);
}

// -------------------------
// User modal gate
// -------------------------
const UserModalGate: FC = () => {
  const { user, isLoggedIn } = useAuth() as {
    user: User | null;
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
  const { currentTheme, toggleTheme } = useTheme();
  const dispatch: AppDispatch = useDispatch();

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useSupabaseAuthSync();

  // -------------------------
  // Notifications & keyboard
  // -------------------------
  useEffect(() => {
    const requestNotificationPermission = async (): Promise<void> => {
      if (typeof window === "undefined" || !("Notification" in window)) return;

      if (Notification.permission === "default") {
        if (!localStorage.getItem("notificationPermissionRequested")) {
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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && /^m$/i.test(e.key)) {
        e.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleTheme]);

  // -------------------------
  // Hydrate tasks & workspaces
  // -------------------------
  useEffect(() => {
    dispatch(hydrateTasksFromLocalStorage());
    dispatch(fetchWorkspaces());
  }, [dispatch]);

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
          },
        }}
      />
      <NoiseProvider>
        <AuthProvider>
          <TourManager>
            <UserModalGate />
            <NavigationProvider>
              <PageContent />
            </NavigationProvider>
          </TourManager>
        </AuthProvider>
      </NoiseProvider>
    </>
  );
};

// -------------------------
// Helpers
// -------------------------
const navPages = ["tasks", "calendar", "session", "notes", "stats"];

const swipeNavigate = (diff: number): void => {
  const currentPage =
    window.localStorage.getItem("lastVisitedPage") || "session";
  const currentIdx = navPages.indexOf(currentPage);

  if (diff < 0 && currentIdx < navPages.length - 1) {
    const nextPage = navPages[currentIdx + 1];
    window.localStorage.setItem("lastVisitedPage", nextPage);
    window.dispatchEvent(new Event("navigationchange"));
  } else if (diff > 0 && currentIdx > 0) {
    const prevPage = navPages[currentIdx - 1];
    window.localStorage.setItem("lastVisitedPage", prevPage);
    window.dispatchEvent(new Event("navigationchange"));
  }
};

export default App;
