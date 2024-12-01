// src/Home.jsx
import React, { useEffect } from 'react';
import { Box, Heading } from '@chakra-ui/react';
import { useDispatch } from 'react-redux';
import TaskForm from './redux/TaskForm';
import TaskList from './redux/TaskList';
import { fetchTasks } from './redux/TaskActions';
import Achievements from './comp/Achievements';
import Calendar from './comp/Calendar'; // Import the Calendar component

const Home = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  return (
    <Box maxW="800px" mx="auto" p={5}>
      <Heading mb={6} textAlign="center" size="lg" color="white">
        Task Tracker
      </Heading>
      <Achievements />
      <TaskForm />
      <TaskList />
      <Calendar /> {/* Add the Calendar component */}
    </Box>
  );
};

export default Home;
