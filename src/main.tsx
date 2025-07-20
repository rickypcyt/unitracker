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
  function FakeNotification() { /* noop */ }
  Object.defineProperty(FakeNotification, 'permission', {
    get: () => 'denied',
  });
  FakeNotification.requestPermission = () => Promise.resolve('denied');
  // @ts-ignore
  window.Notification = FakeNotification;
}

logger.info('Application starting', { environment: import.meta.env.MODE });

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ErrorBoundary>
    <Provider store={store}>
      <ChakraProvider value={defaultSystem}>
        <HelmetProvider>
          <BrowserRouter>
            <App />
            {createPortal(
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#333',
                    color: '#fff',
                    padding: '16px',
                    borderRadius: '8px',
                  },
                }}
              />, document.body)}
            <Analytics />
            <SpeedInsights />
          </BrowserRouter>
        </HelmetProvider>
      </ChakraProvider>
    </Provider>
  </ErrorBoundary>
); 