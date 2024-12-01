import React, { useMemo, useState, useCallback } from 'react';
import { 
  Box, 
  Text, 
  VStack, 
  Button, 
  HStack, 
  Checkbox, 
  Input,
  Alert
} from '@chakra-ui/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useSelector, useDispatch } from 'react-redux';
import { addTask, toggleTaskCompletion, deleteTask } from './redux/TasksSlice';
import Achievements from './comp/Achievements';

const Home = () => {
  const tasks = useSelector((state) => state.tasks);
  const dispatch = useDispatch();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [notification, setNotification] = useState(null);

  const events = useMemo(() => {
    return tasks?.map((task) => ({
      title: task.title,
      date: task.deadline || new Date().toISOString(),
      allDay: true,
      color: task.completed ? 'green' : 'blue',
    })) || [];
  }, [tasks]);

  const showNotification = useCallback((type, title, description) => {
    setNotification({ type, title, description });
    const timer = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleAddTask = useCallback(() => {
    if (!newTaskTitle || !newTaskDeadline) {
      showNotification('error', 'Task Creation Failed', 'Please provide both title and deadline');
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

    showNotification('success', 'Task Added', 'Your new task has been created successfully');
  }, [dispatch, newTaskTitle, newTaskDeadline, newTaskNotes, showNotification]);

  const handleTaskToggle = useCallback((taskId) => {
    dispatch(toggleTaskCompletion(taskId));
  }, [dispatch]);

  const handleTaskDelete = useCallback((taskId) => {
    dispatch(deleteTask(taskId));
    showNotification('info', 'Task Deleted', 'The task has been removed');
  }, [dispatch, showNotification]);

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
      {/* Notification Alert */}
      {notification && (
        <Alert 
          status={notification.type} 
          position="fixed" 
          top="4" 
          right="4" 
          zIndex="1000" 
          width="300px"
          textAlign="center"
          py={3}
        >
          <Box width="full">
            <Text fontWeight="bold" mb={1}>{notification.title}</Text>
            <Text fontSize="sm">{notification.description}</Text>
          </Box>
        </Alert>
      )}

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