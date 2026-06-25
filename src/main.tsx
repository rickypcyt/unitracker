import "@/index.css";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

import { Analytics } from "@vercel/analytics/react";
import App from "@/App";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "@/utils/ErrorBoundary";
import { HelmetProvider } from "react-helmet-async";
import ReactDOM from "react-dom/client";
import { SpeedInsights } from "@vercel/speed-insights/react";

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
