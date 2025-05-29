// Import necessary dependencies
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Provider } from 'react-redux';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react"
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from 'react-helmet-async';

// Import local files
import { store } from './store/store';
import App from './App';
import './index.css';
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from './utils/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import { logger } from './utils/logger';

// Security headers
const securityHeaders = {
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob:;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com;
    worker-src 'self' blob:;
    frame-src 'self';
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
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
            <ThemeProvider>
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
            </ThemeProvider>
          </BrowserRouter>
        </HelmetProvider>
      </ChakraProvider>
    </Provider>
  </ErrorBoundary>
);
