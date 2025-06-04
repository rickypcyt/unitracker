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
    default-src 'self' blob: data:;
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://*.supabase.co blob:;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com blob:;
    img-src 'self' data: blob: https://*.supabase.co;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com https://*.vercel-analytics.com blob:;
    worker-src 'self' blob:;
    frame-src 'self' https://*.supabase.co blob:;
    font-src 'self' https://fonts.gstatic.com data: blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
    media-src 'self' blob: data:;
    child-src 'self' blob:;
  `.replace(/\s+/g, ' ').trim(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'Cross-Origin-Resource-Policy': 'cross-origin'
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
