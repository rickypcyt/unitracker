import React, { useMemo, useState } from 'react';
import { Box, Text, VStack, Button, HStack, Checkbox, Input } from '@chakra-ui/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useSelector, useDispatch } from 'react-redux';
import { addTask, toggleTaskCompletion } from './redux/TasksSlice';
import Achievements from './comp/Achievements';

const Home = () => {
  const tasks = useSelector((state) => state.tasks);
  const dispatch = useDispatch();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');

  const events = useMemo(() => {
    return (
      tasks?.map((task) => ({
        title: task.title,
        date: task.deadline || new Date().toISOString(),
      })) || []
    );
  }, [tasks]);

  const handleAddTask = () => {
    if (newTaskTitle && newTaskDeadline) {
      dispatch(
        addTask({
          title: newTaskTitle,
          deadline: newTaskDeadline,
          notes: '',
        })
      );
      setNewTaskTitle('');
      setNewTaskDeadline('');
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      bg="black"
      p={4}
      color="white"
    >
      <Text fontSize="30px" color="white" mb={4} fontWeight="bold">
        Uni Tracker 2024/2025
      </Text>

      <Box mb={6}>
        <Achievements />
      </Box>

      <Box
        display="flex"
        flexDirection="row"
        width="90%"
        justifyContent="space-between"
        mb={6}
      >
        {/* Task Management Section */}
        <Box
          width="45%"
          bg="gray.800"
          p={4}
          borderRadius="md"
          boxShadow="lg"
          overflow="hidden"
        >
          <Text fontSize="20px" mb={4} fontWeight="bold">
            Task List
          </Text>
          <VStack align="stretch" spacing={4}>
            {/* Pending Tasks */}
            <Box>
              <Text fontSize="18px" mb={2} fontWeight="semibold">
                Pending Tasks
              </Text>
              {tasks
                ?.filter((task) => !task.completed)
                .map((task) => (
                  <HStack key={task.id} spacing={3}>
                    <Checkbox
                      colorScheme="blue"
                      onChange={() => dispatch(toggleTaskCompletion(task.id))}
                    >
                      {task.title}
                    </Checkbox>
                  </HStack>
                ))}
            </Box>

            {/* Completed Tasks */}
            <Box>
              <Text fontSize="18px" mb={2} fontWeight="semibold">
                Completed Tasks
              </Text>
              {tasks
                ?.filter((task) => task.completed)
                .map((task) => (
                  <HStack key={task.id} spacing={3}>
                    <Checkbox
                      colorScheme="green"
                      isChecked
                      onChange={() => dispatch(toggleTaskCompletion(task.id))}
                    >
                      {task.title}
                    </Checkbox>
                  </HStack>
                ))}
            </Box>
          </VStack>
        </Box>

        {/* Task Creation Section */}
        <Box
          width="45%"
          bg="gray.800"
          p={4}
          borderRadius="md"
          boxShadow="lg"
          overflow="hidden"
        >
          <Text fontSize="20px" mb={4} fontWeight="bold">
            Create Task
          </Text>
          <VStack spacing={4} align="stretch">
            <Input
              placeholder="Task Title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              bg="white"
              color="black"
            />
            <Input
              type="date"
              placeholder="Deadline"
              value={newTaskDeadline}
              onChange={(e) => setNewTaskDeadline(e.target.value)}
              bg="white"
              color="black"
            />
            <Button
              colorScheme="blue"
              onClick={handleAddTask}
              isDisabled={!newTaskTitle || !newTaskDeadline}
            >
              Add Task
            </Button>
          </VStack>
        </Box>
      </Box>

      <Box
        width="50%"
        maxWidth="1200px"
        boxShadow="lg"
        borderRadius="md"
        overflow="hidden"
      >
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={events}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,dayGridDay',
          }}
          eventColor="#3182CE"
          contentHeight="auto"
          eventTextColor="white"
          height="600px"
        />
      </Box>
    </Box>
  );
};

export default Home;
