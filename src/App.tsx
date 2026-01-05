import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { FC, Suspense, lazy, useEffect, useRef, useState } from "react";
import { NavigationProvider, useNavigation } from "@/navbar/NavigationContext";

import Navbar from "@/navbar/Navbar";
import NewFeaturesModal from "@/modals/NewFeaturesModal";
import { NoiseProvider } from "@/utils/NoiseContext";
import { Toaster } from "react-hot-toast";
import TourManager from "./components/TourManager";
import UserModal from "@/modals/UserModal";
import { supabase } from "@/utils/supabaseClient";
import { useAuthActions } from "@/store/appStore";

// Lazy load pages for better performance
const CalendarPage = lazy(() => import("@/pages/calendar/CalendarPage"));
const Notes = lazy(() => import("@/pages/notes/Notes"));
const SessionPage = lazy(() => import("@/pages/session/SessionPage"));
const StatsPage = lazy(() => import("@/pages/stats/StatsPage"));
const TasksPage = lazy(() => import("@/pages/tasks/TasksPage"));

// -------------------------
// Types
// -------------------------
interface ChangelogEntry {
  version: string;
  date: string;
  time: string;
  type: 'major' | 'minor' | 'patch';
  changes: {
    added?: string[];
    improved?: string[];
    fixed?: string[];
    removed?: string[];
    soon?: string[];
  };
}

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
        <Suspense fallback={null}>
          <ActiveComponent />
        </Suspense>
      </div>
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
// Changelog utilities
// -------------------------

// Generate hash from changelog content to detect changes
const generateChangelogHash = (changelog: ChangelogEntry[]): string => {
  const content = JSON.stringify(changelog);
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

// -------------------------
// New Features modal gate
// -------------------------
const NewFeaturesGate: FC = () => {
  const { user, isLoggedIn } = useAuth() as {
    user: any;
    isLoggedIn: boolean;
  };
  const [showNewFeaturesModal, setShowNewFeaturesModal] = useState(false);

  // Current changelog data (this should match the data in NewFeaturesModal)
  const currentChangelog: ChangelogEntry[] = [
    {
      version: "1.1.2",
      date: "December 21, 2025",
      time: "5:17 PM",
      type: "patch",
      changes: {
        fixed: [
          "Fixed Pomodoro timer synchronization issues"
        ],
        improved: [
          "New workspace switching mode with sideways scroll",
          "Share workspace with friends feature is now fully functional",
          "Task status system for better task organization"
        ],
        soon: [
          "Timeblocks page - Assign time blocks to tasks",
          "Leaderboard system - Compete with friends"
        ]
      }
    },
    {
      version: "1.1.1",
      date: "December 21, 2025",
      time: "5:00 PM",
      type: "patch",
      changes: {
        added: [
          "Hello world!",
          "First use of the Uni Tracker changelog system"
        ],
        improved: [
          "Here you will see the upcoming changes and improvements we will be implementing in the application"
        ],
        fixed: [],
        removed: []
      }
    }
  ];

  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      setShowNewFeaturesModal(false);
      return;
    }

    // Generate hash for current changelog content
    const currentHash = generateChangelogHash(currentChangelog);
    const lastSeenHash = localStorage.getItem('newFeaturesSeenHash');
    
    // Show modal if content has changed or hasn't been shown
    if (lastSeenHash !== currentHash) {
      // Add a small delay to show after login
      const timer = setTimeout(() => {
        setShowNewFeaturesModal(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    // Explicit return for the case where modal should not be shown
    return;
  }, [isLoggedIn, user, currentChangelog]);

  const handleClose = () => {
    setShowNewFeaturesModal(false);
    // Mark current changelog content as seen
    const currentHash = generateChangelogHash(currentChangelog);
    localStorage.setItem('newFeaturesSeenHash', currentHash);
  };

  return (
    <NewFeaturesModal isOpen={showNewFeaturesModal} onClose={handleClose} />
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
      console.log('Checking notification support...');
      if (typeof window === "undefined") {
        console.log('Not in browser environment');
        return;
      }
      
      if (!("Notification" in window)) {
        console.log('This browser does not support notifications');
        return;
      }

      console.log('Current notification permission:', Notification.permission);
      
      if (Notification.permission === "default") {
        console.log('Notification permission not set, checking localStorage...');
        const permissionRequested = localStorage.getItem("notificationPermissionRequested");
        console.log('Previously requested:', permissionRequested);
        
        if (!permissionRequested) {
          try {
            console.log('Requesting notification permission...');
            const permission = await Notification.requestPermission();
            console.log('User responded with permission:', permission);
            localStorage.setItem("notificationPermissionRequested", "true");
          } catch (error) {
            console.error("Notification permission request failed:", error);
          }
        } else {
          console.log('Notification permission was already requested before');
        }
      } else {
        console.log('Notification permission already set to:', Notification.permission);
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
          },
        }}
      />
      <NoiseProvider>
        <AuthProvider>
          <TourManager>
            <UserModalGate />
            <NewFeaturesGate />
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
    window.localStorage.setItem("lastVisitedPage", nextPage || "");
    window.dispatchEvent(new Event("navigationchange"));
  } else if (diff > 0 && currentIdx > 0) {
    const prevPage = navPages[currentIdx - 1];
    window.localStorage.setItem("lastVisitedPage", prevPage || "");
    window.dispatchEvent(new Event("navigationchange"));
  }
};

export default App;
