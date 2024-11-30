// src/Home.jsx
import React from 'react';
import { Box, Heading, Text, Grid, Flex, Divider } from '@chakra-ui/react'; // Chakra UI components
import Calendar from './comp/Calendar';
import Goals from './comp/Goals';
import ProgressTracker from './comp/ProgressTracker';
import TaskDetails from './comp/TaskDetails';
import TaskSlicer from './comp/taskSlicer';

const Home = () => {
  return (
    <Box bg="gray.100" minHeight="100vh" padding={6}>
      {/* Main Header */}
      <Heading as="h1" size="2xl" color="teal.600" textAlign="center" mb={6}>
        Uni Tracker 2024
      </Heading>

      {/* Overview Text */}
      <Text fontSize="xl" color="gray.700" textAlign="center" mb={8}>
        Organize your assignments, goals, and tasks in one place.
      </Text>

      {/* Layout with Grid for various components */}
      <Grid templateColumns="repeat(3, 1fr)" gap={6}>
        <Box borderRadius="md" boxShadow="md" p={4} bg="white">
          <Heading size="md" mb={4} textAlign="center">Progress Tracker</Heading>
          <ProgressTracker />
        </Box>

        <Box borderRadius="md" boxShadow="md" p={4} bg="white">
          <Heading size="md" mb={4} textAlign="center">Goals</Heading>
          <Goals />
        </Box>

        <Box borderRadius="md" boxShadow="md" p={4} bg="white">
          <Heading size="md" mb={4} textAlign="center">Calendar</Heading>
          <Calendar />
        </Box>
      </Grid>

      <Divider my={8} />

      {/* Task details and task slicer section */}
      <Flex direction="column" gap={6}>
        <Box borderRadius="md" boxShadow="md" p={4} bg="white">
          <Heading size="md" mb={4} textAlign="center">Task Details</Heading>
          <TaskDetails />
        </Box>

        <Box borderRadius="md" boxShadow="md" p={4} bg="white">
          <Heading size="md" mb={4} textAlign="center">Task Slicer</Heading>
          <TaskSlicer />
        </Box>
      </Flex>
    </Box>
  );
};

export default Home;
