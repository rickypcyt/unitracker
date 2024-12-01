// src/components/Achievements.jsx
import { Box, Text } from "@chakra-ui/react";
import { useSelector } from "react-redux";

const Achievements = () => {
  // Acceder al estado global de tareas (es importante asegurar que 'tasks' esté en el estado)
  const tasks = useSelector((state) => state.tasks.tasks); // `tasks.tasks` porque el reducer lo guarda ahí
  const completed = tasks.filter((task) => task.completed).length; // Contar las tareas completadas

  return (
    <Box 
      bg="gray.700" // Fondo oscuro para visibilidad
      color="white" // Color de texto para contraste
      p={5} // Relleno para mayor espacio
      borderRadius="md" // Bordes redondeados
      boxShadow="md" // Agregar sombra para énfasis
      textAlign="center" // Centrar el texto
      width="100%" // Hacerlo completamente ancho
      mt={5}

      
    >
      {completed >= 20 && <Text fontSize="lg">🔥 20 Tasks Completed!</Text>}
      {completed >= 10 && completed < 20 && <Text fontSize="lg">🎉 10 Tasks Completed!</Text>}
      {completed < 10 && (
        <Text fontSize="lg">
          Keep going! Complete more tasks to earn achievements! 🚀
        </Text>
      )}
    </Box>
  );
};

export default Achievements;
