// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'; // Importamos defaultSystem
import Home from './Home'; // Componente Home
import './index.css'; // Importamos los estilos globales si los tienes

// Montamos el componente Home dentro del div con id 'root'
ReactDOM.createRoot(document.getElementById('root')).render(
  <ChakraProvider value={defaultSystem}> {/* Pasamos defaultSystem al ChakraProvider */}
    <Home />
  </ChakraProvider>
);
