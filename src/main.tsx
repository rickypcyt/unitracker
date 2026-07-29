import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@/index.css";

import * as Sentry from "@sentry/react";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

import { Analytics } from "@vercel/analytics/react";
import App from "@/App";
import { BrowserRouter } from "react-router-dom";
import { ErrorFallback } from "@/utils/ErrorBoundary";
import { HelmetProvider } from "react-helmet-async";
import ReactDOM from "react-dom/client";
import { SpeedInsights } from "@vercel/speed-insights/react";
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
  <Sentry.ErrorBoundary fallback={<ErrorFallback />} showDialog>
    <ChakraProvider value={defaultSystem}>
      <HelmetProvider>
        <BrowserRouter>
          <App />
          <Analytics />
          <SpeedInsights />
        </BrowserRouter>
      </HelmetProvider>
    </ChakraProvider>
  </Sentry.ErrorBoundary>
);
