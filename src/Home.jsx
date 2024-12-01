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
    // Use a Box component from Chakra UI to wrap the content with a maximum width and padding.
    <Box maxW="800px" mx="auto" p={5}>
      {/* Display the main title of the application */}
      <Heading mb={6} textAlign="center" size="lg" color="white">
        Study Tracker 2025
      </Heading>

      {/* Display user achievements */}
      <Achievements />

      {/* Display the task progress bar */}
      <Box mb={6}>
        <ProgressTracker /> {/* Render the ProgressTracker component */}
      </Box>

      {/* Form to add new tasks */}
      <TaskForm />

      {/* List of existing tasks */}
      <TaskList />

      {/* Calendar component */}
      <Calendar />
    </Box>
  );
};

// Export the Home component as the default export.
export default Home;
