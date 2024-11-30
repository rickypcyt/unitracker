import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'; // Import ChakraProvider and defaultSystem
import { Provider } from 'react-redux'; // Redux Provider
import { store } from './comp/store'; // Import Redux store
import Home from './Home'; // Import your Home component
import './index.css'; // Import global styles

// Mount the Home component within the div with id 'root'
ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}> {/* Wrap the app with Redux Provider */}
    <ChakraProvider value={defaultSystem}> {/* Pass defaultSystem to ChakraProvider */}
      <Home /> {/* Your main component */}
    </ChakraProvider>
  </Provider>
);
