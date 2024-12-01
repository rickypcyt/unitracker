import React, { useMemo, useState, useCallback } from 'react';
import { 
  Box, 
  Text, 
  VStack, 
  Button, 
  HStack, 
  Checkbox, 
  Input
} from '@chakra-ui/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useSelector, useDispatch } from 'react-redux';
import { addTask, toggleTaskCompletion, deleteTask } from './redux/TasksSlice';
import Achievements from './comp/Achievements';

const Home = () => {
  const tasks = useSelector((state) => state.tasks);
  console.log(tasks);

  const dispatch = useDispatch();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');

  const events = useMemo(() => {
    return Array.isArray(tasks)
      ? tasks.map((task) => ({
          title: task.title,
          date: task.deadline || new Date().toISOString(),
          allDay: true,
          color: task.completed ? 'green' : 'blue',
        }))
      : [];  // If tasks is not an array, return an empty array
  }, [tasks]);
  

  const handleAddTask = useCallback(() => {
    if (!newTaskTitle || !newTaskDeadline) {
      // No notification alert, but you can handle the error however you want here
      console.error("Task Creation Failed: Please provide both title and deadline");
      return;
    }

    dispatch(
      addTask({
        title: newTaskTitle,
        deadline: newTaskDeadline,
        notes: newTaskNotes,
        completed: false,
      })
    );

    // Reset form
    setNewTaskTitle('');
    setNewTaskDeadline('');
    setNewTaskNotes('');
  }, [dispatch, newTaskTitle, newTaskDeadline, newTaskNotes]);

  const handleTaskToggle = useCallback((taskId) => {
    dispatch(toggleTaskCompletion(taskId));
  }, [dispatch]);

  const handleTaskDelete = useCallback((taskId) => {
    dispatch(deleteTask(taskId));
  }, [dispatch]);

  const handleDateClick = useCallback((info) => {
    const clickedDate = info.dateStr;
    setNewTaskDeadline(clickedDate);
  }, []);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bg="black"
      p={4}
      color="white"
      position="relative"
    >
      <Text fontSize="3xl" color="white" mb={6} fontWeight="bold">
        Uni Tracker 2024/2025
      </Text>

      <Achievements />

      <Box
        display="flex"
        flexDirection="row"
        width="full"
        maxWidth="1400px"
        justifyContent="space-between"
        mb={6}
        gap={6}
      >
        {/* Task Management Section */}
        <Box
          width="45%"
          bg="gray.800"
          p={5}
          borderRadius="lg"
          boxShadow="xl"
        >
          <Text fontSize="2xl" mb={4} fontWeight="bold">
            Task List
          </Text>
          <VStack align="stretch" spacing={4}>
            {/* Pending Tasks */}
            <Box>
              <Text fontSize="xl" mb={2} fontWeight="semibold">
                Pending Tasks
              </Text>
              {tasks
                ?.filter((task) => !task.completed)
                .map((task) => (
                  <HStack key={task.id} spacing={3} mb={2}>
                    <Checkbox
                      colorScheme="blue"
                      isChecked={false}
                      onChange={() => handleTaskToggle(task.id)}
                    >
                      {task.title}
                    </Checkbox>
                    <Button 
                      size="xs" 
                      colorScheme="red" 
                      onClick={() => handleTaskDelete(task.id)}
                    >
                      Delete
                    </Button>
                  </HStack>
                ))}
            </Box>

            {/* Completed Tasks */}
            <Box>
              <Text fontSize="xl" mb={2} fontWeight="semibold">
                Completed Tasks
              </Text>
              {tasks
                ?.filter((task) => task.completed)
                .map((task) => (
                  <HStack key={task.id} spacing={3} mb={2}>
                    <Checkbox
                      colorScheme="green"
                      isChecked
                      onChange={() => handleTaskToggle(task.id)}
                    >
                      {task.title}
                    </Checkbox>
                    <Button 
                      size="xs" 
                      colorScheme="red" 
                      onClick={() => handleTaskDelete(task.id)}
                    >
                      Delete
                    </Button>
                  </HStack>
                ))}
            </Box>
          </VStack>
        </Box>

        {/* Task Creation Section */}
        <Box
          width="45%"
          bg="gray.800"
          p={5}
          borderRadius="lg"
          boxShadow="xl"
        >
          <Text fontSize="2xl" mb={4} fontWeight="bold">
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
            <Input
              placeholder="Optional Notes"
              value={newTaskNotes}
              onChange={(e) => setNewTaskNotes(e.target.value)}
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
        width="full"
        maxWidth="1200px"
        boxShadow="xl"
        borderRadius="lg"
        overflow="hidden"
      >
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,dayGridDay',
          }}
          dateClick={handleDateClick}
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
