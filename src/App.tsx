import { AuthProvider, useAuth } from "@/hooks/auth/useAuth";
import { FC, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { NavigationProvider, PAGE_PATHS, useNavigation } from "@/navigation/NavigationContext";
import { useAuthActions, useFetchTasks, useTasksOnly, useWorkspace, useWorkspaceActions } from "@/store/appStore";
import type { Workspace } from "@/types/workspace";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import FloatingFooter from "@/components/layout/FloatingFooter";
import LandingPage from "@/pages/landing/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
import LegalPage from "@/pages/legal/LegalPage";
import IndiaLandingPage from "@/pages/landing/IndiaLandingPage";
import SeoLandingPage from "@/pages/landing/SeoLandingPage";
import { SEO_PAGES } from "@/pages/landing/seoPages";
import i18n from "@/i18n";
import PageLoader from "@/components/ui/PageLoader";
import { NoiseProvider } from "@/utils/NoiseContext";
import { Toaster } from "sonner";
import TourManager from "@/components/onboarding/TourManager";
import Settings from "@/modals/settings/Settings";

import UserModal from "@/modals/auth/UserModal";
import NotificationPromptModal from "@/modals/NotificationPromptModal";
import { supabase } from "@/utils/supabaseClient";
import { User } from "@supabase/supabase-js";
import { warnNotificationsBlocked } from "@/utils/desktopNotifications";
import { initCrossTabSync } from "@/utils/crossTabSync";
import { captureReferralParams } from "@/utils/referral";
import { track } from "@vercel/analytics";
import posthog from "posthog-js";
import { useFriendManagement } from "@/hooks/friends/useFriendManagement";
import { useWorkspaceLoader } from "@/hooks/workspaces/useWorkspaceLoader";

// Direct imports for stacked pages
import FocusWidgetPage from "@/pages/FocusWidgetPage";
import HabitsPage from "@/pages/habits/HabitsPage";
import Notes from "@/pages/notes/Notes";
import SessionPage from "@/pages/session/SessionPage";
import StatsPage from "@/pages/stats/StatsPage";
import TasksPage from "@/pages/tasks/TasksPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";import FloatingTimerPlayer from "@/pages/session/components/FloatingTimerPlayer";
import DemoBanner from "@/components/layout/DemoBanner";
import Navbar from "@/components/layout/Sidebar";

// Preload map: import functions for each page to enable hover-based preloading
const preloadMap: Record<string, () => Promise<unknown>> = {
  session: () => import("@/pages/session/SessionPage"),
  tasks: () => import("@/pages/tasks/TasksPage"),
  analytics: () => import("@/pages/stats/StatsPage"),
  habits: () => import("@/pages/habits/HabitsPage"),
  notes: () => import("@/pages/notes/Notes"),
  focusWidget: () => import("@/pages/FocusWidgetPage"),
  admin: () => import("@/pages/admin/AdminDashboard"),};

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
  analytics: StatsPage,
  habits: HabitsPage,
  notes: Notes,
  focusWidget: FocusWidgetPage,
  admin: AdminDashboard,};


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
    <div className="min-h-screen bg-[var(--bg-primary)] w-full overflow-x-clip flex flex-col">
      <DemoBanner />
      <Navbar />
      <main className="min-w-0 flex-1 relative">
        <Suspense fallback={<PageLoader />}>
          {/* Navbar is in normal flow, so no top offset is needed to clear it.
              Pages get one uniform top gap here; full-bleed pages (notes) opt out. */}
          <div className={`overflow-x-hidden ${activePage === 'notes' ? '' : 'page-gutter pt-6 pb-4'}`}>
            {activePage === 'session' && <SessionPage />}

            {activePage === 'tasks' && (
              <TasksPage />
            )}

            {activePage === 'analytics' && <StatsPage />}

            {activePage === 'habits' && <HabitsPage />}

            {activePage === 'notes' && <Notes />}

            {activePage === 'admin' && <AdminDashboard />}          </div>
        </Suspense>
      </main>
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

const AppRoute: FC = () => {
  // Bridge timer sync events across open tabs/windows (BroadcastChannel)
  useEffect(() => {
    initCrossTabSync();
  }, []);

  // Ask for notification permission only inside the app — never on landing pages
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
  }, []);

  return (
    <NavigationProvider>
      <TourManager>
        <PageContent />
        <FloatingTimerPlayer />
      </TourManager>
    </NavigationProvider>
  );
};

// -------------------------
// Supabase auth sync
// -------------------------
function useSupabaseAuthSync(): void {
  const { setUser, clearUser } = useAuthActions();
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    const syncUser = (user: User | null): void => {
      if (user) {
        setUser(user);

        if (!posthog.__loaded || identifiedUserId.current === user.id) return;

        if (identifiedUserId.current) posthog.reset();

        posthog.identify(user.id, user.email ? { email: user.email } : {});
        identifiedUserId.current = user.id;
        return;
      }

      clearUser();

      if (!posthog.__loaded || !identifiedUserId.current) return;

      posthog.reset();
      identifiedUserId.current = null;
    };

    // Inicializa usuario si hay sesión
    supabase.auth.getUser().then(({ data: { user } }) => {
      syncUser(user);
    });

    // Escucha cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        syncUser(session?.user ?? null);
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
    <UserModal
      isOpen={showUserModal}
      onClose={() => {
        setShowUserModal(false);
        window.dispatchEvent(new Event('userModalClosed'));
      }}
    />
  );
};

// Cheap synchronous hint (no network): an OAuth redirect in progress or a stored Supabase session
const likelySignedIn = (): boolean => {
  try {
    if (window.location.hash.includes("access_token") || window.location.search.includes("code=")) return true;
    return Object.keys(localStorage).some((key) => key.startsWith("sb-") && key.endsWith("-auth-token"));
  } catch {
    return false;
  }
};

const RootRoute: FC = () => {
  const { isLoggedIn, isAuthLoading } = useAuth();

  // Coming back from an OAuth login (tokens in the URL): load the app while the session is processed
  useEffect(() => {
    if (window.location.hash.includes("access_token") || window.location.search.includes("code=")) {
      preloadPage("session");
    }
  }, []);

  // The landing page never shows a spinner: render it while auth resolves. The only time we wait
  // behind a loader is when someone is clearly already signed in (stored session) or is returning
  // from an OAuth redirect, so they don't see the landing flash before the app opens.
  if (isAuthLoading && likelySignedIn()) return <PageLoader fullScreen />;
  return isLoggedIn ? <Navigate to={PAGE_PATHS.session} replace /> : <LandingPage />;
};

const LoginRoute: FC = () => {
  const { isLoggedIn, isAuthLoading } = useAuth();

  // Warm up the app chunk while the user signs in, so the redirect back doesn't wait on it
  useEffect(() => {
    preloadPage("session");
  }, []);

  if (isAuthLoading) return <PageLoader fullScreen />;
  return isLoggedIn ? <Navigate to={PAGE_PATHS.session} replace /> : <LoginPage />;
};

// Dedicated language URLs (/es, /hi) — forces the locale so each version
// is indexable by search engines with its own canonical + hreflang
const LocalizedLanding: FC<{ lang: "es" | "hi" }> = ({ lang }) => {
  useEffect(() => {
    void i18n.changeLanguage(lang);
  }, [lang]);
  return <LandingPage />;
};

// -------------------------
// Main App component
// -------------------------
const App: FC = () => {
  const navigate = useNavigate();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useSupabaseAuthSync();

  // Capture ?ref= / utm_* params once per session-load and report to Vercel Analytics
  useEffect(() => {
    const referral = captureReferralParams();
    if (referral) {
      track("referral_landing", {
        ref: referral.ref ?? "",
        utm_source: referral.utm_source ?? "",
        utm_campaign: referral.utm_campaign ?? "",
      });
    }
  }, []);

  // -------------------------
  // Swipe navigation
  // -------------------------
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.matchMedia('(max-width: 1023px), (pointer: coarse)').matches) return;
      touchStartX.current = e.changedTouches[0]?.screenX || 0;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (window.matchMedia('(max-width: 1023px), (pointer: coarse)').matches) return;
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
      <Toaster
        position="top-right"
        duration={3000}
        toastOptions={{
          style: {
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            padding: "12px 16px",
            borderRadius: "8px",
            border: "2px solid var(--border-primary)",
          },
        }}
      />
      <NoiseProvider>
        <AuthProvider>
          <UserModalGate />
          <NotificationPromptModal />
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/terms" element={<LegalPage doc="terms" />} />
            <Route path="/privacy" element={<LegalPage doc="privacy" />} />
            <Route path="/es" element={<LocalizedLanding lang="es" />} />
            <Route path="/hi" element={<LocalizedLanding lang="hi" />} />
            <Route path="/india" element={<IndiaLandingPage />} />
            {SEO_PAGES.map((p) => (
              <Route key={p.slug} path={`/${p.slug}`} element={<SeoLandingPage slug={p.slug} />} />
            ))}
            <Route path="/app" element={<Navigate to={PAGE_PATHS.session} replace />} />
            <Route path={PAGE_PATHS.session} element={<AppRoute />} />
            <Route path={PAGE_PATHS.tasks} element={<AppRoute />} />
            <Route path={PAGE_PATHS.analytics} element={<AppRoute />} />
            <Route path={PAGE_PATHS.habits} element={<AppRoute />} />
            <Route path={PAGE_PATHS.notes} element={<AppRoute />} />
            <Route path={PAGE_PATHS.focusWidget} element={<AppRoute />} />
            <Route path={PAGE_PATHS.admin} element={<AppRoute />} />            {/* Legacy route aliases */}
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
const navPages = ["tasks", "habits", "session", "notes", "analytics"] as const;

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
