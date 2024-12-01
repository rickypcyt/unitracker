import React, { useMemo } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react'; // Import Chakra UI components
import FullCalendar from '@fullcalendar/react'; // Import FullCalendar component
import dayGridPlugin from '@fullcalendar/daygrid'; // Import dayGridPlugin for the calendar grid
import { useSelector } from 'react-redux'; // Import useSelector for accessing Redux state
import Achievements from './comp/Achievements'; // Import the Achievements component
import TaskDetails from './comp/TaskDetails'; // Import TaskDetails component

const Home = () => {
  // Fetch tasks from Redux store
  const tasks = useSelector((state) => state.tasks);

  // Use useMemo to optimize events data processing
  const events = useMemo(() => {
    return tasks?.map((task) => ({
      title: task.title,
      date: task.deadline || new Date().toISOString(), // Provide fallback for deadline if it's missing
    })) || [];
  }, [tasks]);

  return (
    <Box
      display="flex"
      flexDirection="column" // Stack children vertically
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bg="black"
      p={4} // Add padding for better spacing
      color="white"
    >
      <Text fontSize="30px" color="white" mb={4} fontStyle="bold">
        Uni Tracker 2024/2025
      </Text>

      {/* Achievements Component */}
      <Box mb={6} width="100%" display="flex" justifyContent="center">
        <Achievements />
      </Box>
      
      {/* FullCalendar component container */}
      <Box width="50%" maxWidth="1200px" boxShadow="lg" borderRadius="md" overflow="hidden" mb={6}>
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={events} // Pass mapped events
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,dayGridDay',
          }}
          eventColor="#3182CE" // Set event color for better visibility
          contentHeight="auto" // Make content height adjust dynamically
          eventTextColor="white" // Make event text white for better contrast
          height="600px" // Set fixed height for the calendar
        />
      </Box>

      {/* Task Details */}
      <Box width="100%" maxWidth="800px">
        <VStack spacing={4} align="stretch">
          {tasks.map((task) => (
            <TaskDetails key={task.id} task={task} />
          ))}
        </VStack>
      </Box>
    </Box>
  );
};

export default Home;
