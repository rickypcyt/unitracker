import '@/index.css';
import 'react-toastify/dist/ReactToastify.css';

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

import { Analytics } from '@vercel/analytics/react';
import App from '@/App';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '@/utils/ErrorBoundary';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom/client';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Toaster } from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { logger } from '@/utils/logger';
import { store } from '@/store/store';

// Polyfill para Notification en browsers que no la soportan (ej: iOS Safari)
if (typeof window !== 'undefined' && typeof window.Notification === 'undefined') {
  class FakeNotificationClass {
    // Match static members of Notification
    static permission: NotificationPermission = 'denied'
    static requestPermission(): Promise<NotificationPermission> {
      return Promise.resolve('denied')
    }

    // Instance members used by the app
    onclick: ((this: Notification, ev: Event) => unknown) | null = null
    constructor(_title: string, _options?: NotificationOptions) {
      // no-op
    }
    close(): void {
      // no-op
    }
  }
  // Cast to align with the DOM Notification constructor type
  window.Notification = FakeNotificationClass as unknown as typeof Notification;
}

logger.info('Application starting', { environment: import.meta.env.MODE });

// Render Toaster at the very top level, outside all app wrappers, for maximum visibility
createPortal(
  <Toaster
    position="top-right"
    toastOptions={{
      duration: 3000,
      style: {
        background: '#333',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        border: '2px solid var(--border-primary)',
      },
    }}
  />, document.body
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ErrorBoundary>
    <Provider store={store}>
      <ChakraProvider value={defaultSystem}>
        <HelmetProvider>
          <BrowserRouter>
            <App />
            <Analytics />
            <SpeedInsights />
          </BrowserRouter>
        </HelmetProvider>
      </ChakraProvider>
    </Provider>
  </ErrorBoundary>
); 