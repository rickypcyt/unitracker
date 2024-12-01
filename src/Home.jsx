// src/Home.jsx
import React, { useEffect } from 'react';
import { Box, Heading } from '@chakra-ui/react';
import { useDispatch } from 'react-redux';
import TaskForm from './redux/TaskForm';
import TaskList from './redux/TaskList';
import { fetchTasks } from './redux/TaskActions';

const Home = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  return (
    <Box maxW="800px" mx="auto" mt={10} p={5}>
      <Heading mb={6} textAlign="center" size="lg">
        Task Tracker
      </Heading>
      <TaskForm />
      <TaskList />
    </Box>
  );
};

export default Home;
