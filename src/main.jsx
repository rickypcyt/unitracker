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

// Initialize logging
logger.info('Application starting', { environment: process.env.NODE_ENV });

if (import.meta.env.DEV) {
  // Cargar Eruda solo en desarrollo
  import('eruda').then(({ default: eruda }) => {
    eruda.init();
    console.log('Eruda mobile console initialized');
  });
}

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
