import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "@/index.css";
import "@/i18n";

import * as Sentry from "@sentry/react";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

import { Analytics } from "@vercel/analytics/react";
import App from "@/App";
import { BrowserRouter } from "react-router-dom";
import { ErrorFallback } from "@/utils/ErrorBoundary";
import { HelmetProvider } from "react-helmet-async";
import ReactDOM from "react-dom/client";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { PostHogErrorBoundary, PostHogProvider } from "@posthog/react";
import posthog from "posthog-js";
import { registerSW } from "virtual:pwa-register";

// -------------------------
// Sentry initialization
// -------------------------
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
  });
}

// -------------------------
// PostHog initialization
// -------------------------
const posthogToken = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

if (posthogToken && posthogHost) {
  posthog.init(posthogToken, {
    api_host: posthogHost,
    logs: {
      serviceName: "unitracker-web",
      environment: import.meta.env.MODE,
    },
  });
} else if (import.meta.env.DEV) {
  const missingVariable = posthogToken
    ? "VITE_PUBLIC_POSTHOG_HOST"
    : "VITE_PUBLIC_POSTHOG_PROJECT_TOKEN";
  throw new Error(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
  );
}

// -------------------------
// Polyfill Notification
// -------------------------
if (
  typeof window !== "undefined" &&
  typeof window.Notification === "undefined"
) {
  class FakeNotification {
    static permission: NotificationPermission = "denied";
    static requestPermission(): Promise<NotificationPermission> {
      return Promise.resolve("denied");
    }

    onclick: ((this: Notification, ev: Event) => unknown) | null = null;

    constructor(_title: string, _options?: NotificationOptions) {
      // no-op
    }

    close(): void {
      // no-op
    }
  }

  window.Notification = FakeNotification as unknown as typeof Notification;
}

// -------------------------
// PWA Service Worker Registration
// -------------------------
registerSW({
  onNeedRefresh() {
    console.info('[PWA] A new version is available, refreshing...');
  },
  onOfflineReady() {
    console.info('[PWA] App is ready to work offline');
  },
});

// -------------------------
// Main App render
// -------------------------
const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <PostHogProvider client={posthog}>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />} showDialog>
      <PostHogErrorBoundary fallback={<ErrorFallback />}>
        <ChakraProvider value={defaultSystem}>
          <HelmetProvider>
            <BrowserRouter>
              <App />
              <Analytics />
              <SpeedInsights />
            </BrowserRouter>
          </HelmetProvider>
        </ChakraProvider>
      </PostHogErrorBoundary>
    </Sentry.ErrorBoundary>
  </PostHogProvider>
);
