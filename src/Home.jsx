// src/Home.jsx
import React from 'react';
import { Box, Text } from '@chakra-ui/react'; // Importamos los componentes de Chakra UI

const Home = () => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      bg="teal.500"
    >
      <Text fontSize="2xl" color="white">
        Hello World! Chakra UI is working!
      </Text>
    </Box>
  );
};

export default Home;
