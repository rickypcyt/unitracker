import "@/index.css";
import "react-toastify/dist/ReactToastify.css";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

import { Analytics } from "@vercel/analytics/react";
import App from "@/App";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "@/utils/ErrorBoundary";
import { HelmetProvider } from "react-helmet-async";
import ReactDOM from "react-dom/client";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Toaster } from "react-hot-toast";
import { createPortal } from "react-dom";
import { logger } from "@/utils/logger";

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
// Logging app start
// -------------------------
logger.info("Application starting", { environment: import.meta.env.MODE });

// -------------------------
// Render Toaster
// -------------------------
createPortal(
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
  />,
  document.body
);

// -------------------------
// Main App render
// -------------------------
const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <ErrorBoundary>
    <ChakraProvider value={defaultSystem}>
      <HelmetProvider>
        <BrowserRouter>
            <App />
            <Analytics />
            <SpeedInsights />
          </BrowserRouter>
        </HelmetProvider>
      </ChakraProvider>
  </ErrorBoundary>
);
