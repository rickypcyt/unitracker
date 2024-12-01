import React, { useEffect } from 'react';
import { Box, Heading } from '@chakra-ui/react';
import { useDispatch } from 'react-redux';
import TaskForm from './redux/TaskForm';
import TaskList from './redux/TaskList';
import { fetchTasks } from './redux/TaskActions';
import Achievements from './comp/Achievements';
import Calendar from './comp/Calendar';
import ProgressTracker from './comp/ProgressTracker'; // Importa el componente ProgressTracker

const Home = () => {
  const dispatch = useDispatch();

  // Cargar las tareas desde el servidor al cargar el componente
  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  return (
    <Box maxW="800px" mx="auto" p={5}>
      {/* Título principal */}
      <Heading mb={6} textAlign="center" size="lg" color="white">
        Task Tracker
      </Heading>

      {/* Mostrar los logros */}
      <Achievements />

      {/* Barra de progreso de tareas */}
      <Box mb={6}>
        <ProgressTracker /> {/* Componente de barra de progreso */}
      </Box>

      {/* Formulario para añadir nuevas tareas */}
      <TaskForm />

      {/* Lista de tareas */}
      <TaskList />

      {/* Calendario */}
      <Calendar />
    </Box>
  );
};

export default Home;
