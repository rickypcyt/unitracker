// src/Home.jsx
import React from 'react';
import { Box, Text } from '@chakra-ui/react'; // Import Chakra UI components
import FullCalendar from '@fullcalendar/react'; // Import FullCalendar component
import dayGridPlugin from '@fullcalendar/daygrid'; // Import dayGridPlugin for the calendar grid
import { useSelector } from 'react-redux'; // Import useSelector for accessing Redux state

const Home = () => {
  // Fetch tasks from Redux store
  const tasks = useSelector((state) => state.tasks);

  // Map tasks to events for the calendar
  const events = tasks.map((task) => ({
    title: task.title,
    date: task.deadline,
  }));

  return (
    <Box
      display="flex"
      flexDirection="column" // Stack children vertically
      alignItems="center"
      justifyContent="center"
      height="100vh"
      bg="teal.500"
    >
      <Text fontSize="2xl" color="white" mb={4}>
        Hello World! Chakra UI is working!
      </Text>
      
      {/* FullCalendar component */}
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events} // Pass mapped events
        height="70%" // Adjust the height as per your design
      />
    </Box>
  );
};

export default Home;
