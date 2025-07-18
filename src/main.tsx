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
import { logger } from '@/utils/logger';
import { store } from '@/store/store';

logger.info('Application starting', { environment: import.meta.env.MODE });

// Solo activa eruda en desarrollo, nunca en producción
if (import.meta.env.DEV) {
  import('eruda').then(({ default: eruda }) => {
    eruda.init();
    console.log('Eruda mobile console initialized');
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ErrorBoundary>
    <Provider store={store}>
      <ChakraProvider value={defaultSystem}>
        <HelmetProvider>
          <BrowserRouter>
            <App />
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
            />
            <Analytics />
            <SpeedInsights />
          </BrowserRouter>
        </HelmetProvider>
      </ChakraProvider>
    </Provider>
  </ErrorBoundary>
); 