import React, { useEffect } from 'react';
import { Box, Heading } from '@chakra-ui/react'; // Import components from Chakra UI
import { useDispatch } from 'react-redux'; // Import the useDispatch hook from Redux
import TaskForm from './redux/TaskForm'; // Import the TaskForm component
import TaskList from './redux/TaskList'; // Import the TaskList component
import { fetchTasks } from './redux/TaskActions'; // Import the fetchTasks action creator
import Achievements from './comp/Achievements'; // Import the Achievements component
import Calendar from './comp/Calendar'; // Import the Calendar component
import ProgressTracker from './comp/ProgressTracker'; // Import the ProgressTracker component

/**
 * Home component: The main entry point for the task tracking application.
 */
const Home = () => {
  // Get the dispatch function from the Redux store using the useDispatch hook.
  const dispatch = useDispatch();

  // Use the useEffect hook to fetch tasks from the server when the component mounts.
  useEffect(() => {
    // Dispatch the fetchTasks action to load tasks from the server.
    dispatch(fetchTasks());
  }, [dispatch]); // The effect depends on the dispatch function.

  return (
    <Box mx="80px" p={5}>
      <Heading mb={6} textAlign="center" size="lg" color="white">
        Study Tracker 2025
      </Heading>
      <Box mb={6}>
        <Achievements />
        <ProgressTracker /> 
      </Box>
      <TaskForm />
      <TaskList />
      <Calendar />
    </Box>
  );
};

// Export the Home component as the default export.
export default Home;
