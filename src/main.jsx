import './index.css';
import "react-toastify/dist/ReactToastify.css";

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

import { Analytics } from "@vercel/analytics/react";
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
// Import necessary dependencies
import React from 'react';
import ReactDOM from 'react-dom/client';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Toaster } from "react-hot-toast";
import { logger } from './utils/logger';
// Import local files
import { store } from './store/store';

// Security headers
const securityHeaders = {
  'Content-Security-Policy': `
    default-src 'self' * blob: data:;
    script-src 'self' 'unsafe-inline' 'unsafe-eval' * blob:;
    style-src 'self' 'unsafe-inline' * blob:;
    img-src 'self' data: blob: *;
    connect-src 'self' * blob:;
    worker-src 'self' blob:;
    frame-src 'self' * blob:;
    font-src 'self' * data: blob:;
    media-src 'self' blob: data: *;
    child-src 'self' blob:;
  `.replace(/\s+/g, ' ').trim(),
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer-when-downgrade'
};

// Apply security headers
Object.entries(securityHeaders).forEach(([key, value]) => {
  document.head.appendChild(
    Object.assign(document.createElement('meta'), {
      httpEquiv: key,
      content: value,
    })
  );
});

// Initialize logging
logger.info('Application starting', { environment: process.env.NODE_ENV });

// Render the React application
ReactDOM.createRoot(document.getElementById('root')).render(
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
