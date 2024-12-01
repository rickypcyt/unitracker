import React, { Component } from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'; // Import ChakraProvider and defaultSystem
import { Provider } from 'react-redux'; // Redux Provider
import { store } from './redux/store'; // Import Redux store
import Home from './Home'; // Import your Home component
import './index.css'; // Import global styles

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    console.log(error);  // Log the error to help trace it
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.log(error, info);  // Log detailed error information
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}


// Mount the Home component within the div with id 'root'
ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}> {/* Wrap the app with Redux Provider */}
    <ChakraProvider value={defaultSystem}> {/* Pass defaultSystem to ChakraProvider */}
    <ErrorBoundary>
    <Home />
  </ErrorBoundary>
    </ChakraProvider>
  </Provider>
);
