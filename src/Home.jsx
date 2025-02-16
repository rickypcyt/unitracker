// Home.js
import React, { useEffect } from 'react';
import { Box, Heading } from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux'; // Importa useSelector para obtener datos de Redux
import TaskForm from './redux/TaskForm';
import TaskList from './redux/TaskList';
import { fetchTasks } from './redux/TaskActions';
import Achievements from './comp/Achievements';
import Calendar from './comp/Calendar';
import ProgressTracker from './comp/ProgressTracker';

const Home = () => {
  const dispatch = useDispatch();
  const { tasks, loading, error } = useSelector(state => state.tasks); // Accede al estado de tasks

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  return (
    <Box mx="120px" p={5}>
      <Box mx="40px">
        <Heading mb={6} textAlign="center" size="lg" color="white">
          Study Tracker 2025
        </Heading>
        <Box mb={6}>
          <Achievements />
          <ProgressTracker />
        </Box>
        <TaskForm />
        <TaskList tasks={tasks} /> {/* Pasa las tasks al componente TaskList */}
        {loading && <p>Loading tasks...</p>}
        {error && <p>Error: {error}</p>}
        <Calendar />
      </Box>
    </Box>
  );
};

export default Home;
