// Import necessary dependencies
import React, { Component } from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Provider } from 'react-redux';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react"
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from "react-hot-toast";

// Import local files
import { store } from './redux/store';
import App from './App';
import './index.css';
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from './utils/ThemeContext';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // Update state if an error occurs
  static getDerivedStateFromError(error) {
    console.log(error);  
    return { hasError: true };
  }

  // Log error details
  componentDidCatch(error, info) {
    console.log(error, info);  
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI if an error occurred
      return <h1>Something went wrong.</h1>;
    }
    // Otherwise, render children components
    return this.props.children;
  }
}

// Render the React application
ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <Provider store={store}> 
      <ChakraProvider value={defaultSystem}> 
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
      </ChakraProvider>
    </Provider>
  </ErrorBoundary>
);
