// src/Home.jsx
import React, { useMemo } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react'; // Import Chakra UI components
import FullCalendar from '@fullcalendar/react'; // Import FullCalendar component
import dayGridPlugin from '@fullcalendar/daygrid'; // Import dayGridPlugin for the calendar grid
import { useSelector } from 'react-redux'; // Import useSelector for accessing Redux state

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
      height="100vh"
      bg="black"
      p={4} // Add padding for better spacing
      color="white"
    >
      <Text fontSize="30px" color="white" mb={4} fontStyle="bold">
        Uni Tracker 2024/2025
      </Text>
      
      {/* FullCalendar component container */}
      <Box width="50%" maxWidth="1200px" boxShadow="lg" borderRadius="md" overflow="hidden">
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

      {/* Spacer for additional layout */}
      <VStack spacing={8}>
        {/* Add any other UI components you may want here */}
      </VStack>
    </Box>
  );
};

export default Home;
