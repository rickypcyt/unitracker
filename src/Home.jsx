import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Box, Text, VStack, Button, HStack, Checkbox, Input } from '@chakra-ui/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import Achievements from './comp/Achievements';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks, addTask, toggleTaskCompletion, deleteTask } from './redux/TasksSlice'; // Import actions from your tasks slice

const Home = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.tasks); // Get tasks from Redux store

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');

  // Fetch tasks when the component mounts
  useEffect(() => {
    dispatch(fetchTasks()); // Dispatch the action to load tasks from the backend
  }, [dispatch]);

  const events = useMemo(() => {
    return tasks.map((task) => ({
      title: task.title,
      date: task.deadline || new Date().toISOString(),
      allDay: true,
      color: task.completed ? 'green' : 'blue',
    }));
  }, [tasks]);

  // Handle adding a new task
  const handleAddTask = useCallback(async () => {
    if (!newTaskTitle || !newTaskDeadline) {
      console.error("Task Creation Failed: Please provide both title and deadline");
      return;
    }
  
    try {
      const newTask = {
        title: newTaskTitle,
        deadline: newTaskDeadline,
        notes: newTaskNotes,
        completed: false,
      };
  
      // Llamar al action de Redux para agregar la tarea
      dispatch(addTask(newTask));
  
      // Limpiar los campos
      setNewTaskTitle('');
      setNewTaskDeadline('');
      setNewTaskNotes('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  }, [dispatch, newTaskTitle, newTaskDeadline, newTaskNotes]);
  

  // Handle task completion toggle
  const handleTaskToggle = useCallback(async (taskId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/toggle`, {
        method: 'PUT',
      });

      if (response.ok) {
        const updatedTask = await response.json();
        dispatch(toggleTaskCompletion(updatedTask)); // Update task in Redux state
      } else {
        console.error('Error toggling task completion');
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  }, [dispatch]);

  // Handle task deletion
  const handleTaskDelete = useCallback(async (taskId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        dispatch(deleteTask(taskId)); // Remove task from Redux state
      } else {
        console.error('Error deleting task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }, [dispatch]);

  // Handle date click for task creation
  const handleDateClick = useCallback((info) => {
    const clickedDate = info.dateStr;
    setNewTaskDeadline(clickedDate);
  }, []);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" bg="black" p={4} color="white" position="relative">
      <Text fontSize="3xl" color="white" mb={6} fontWeight="bold">
        Uni Tracker 2024/2025
      </Text>

      <Achievements />

      <Box display="flex" flexDirection="row" width="full" maxWidth="1400px" justifyContent="space-between" mb={6} gap={6}>
        {/* Task Management Section */}
        <Box width="45%" bg="gray.800" p={5} borderRadius="lg" boxShadow="xl">
          <Text fontSize="2xl" mb={4} fontWeight="bold">
            Task List
          </Text>
          <VStack align="stretch" spacing={4}>
            {/* Pending Tasks */}
            <Box>
              <Text fontSize="xl" mb={2} fontWeight="semibold">
                Pending Tasks
              </Text>
              {tasks.filter((task) => !task.completed).map((task) => (
                <HStack key={task.id} spacing={3} mb={2}>
                  <Checkbox colorScheme="blue" isChecked={false} onChange={() => handleTaskToggle(task.id)}>
                    {task.title}
                  </Checkbox>
                  <Button size="xs" colorScheme="red" onClick={() => handleTaskDelete(task.id)}>
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
              {tasks.filter((task) => task.completed).map((task) => (
                <HStack key={task.id} spacing={3} mb={2}>
                  <Checkbox colorScheme="green" isChecked onChange={() => handleTaskToggle(task.id)}>
                    {task.title}
                  </Checkbox>
                  <Button size="xs" colorScheme="red" onClick={() => handleTaskDelete(task.id)}>
                    Delete
                  </Button>
                </HStack>
              ))}
            </Box>
          </VStack>
        </Box>

        {/* Task Creation Section */}
        <Box width="45%" bg="gray.800" p={5} borderRadius="lg" boxShadow="xl">
          <Text fontSize="2xl" mb={4} fontWeight="bold">
            Create Task
          </Text>
          <VStack spacing={4} align="stretch">
            <Input placeholder="Task Title" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} bg="white" color="black" />
            <Input type="date" placeholder="Deadline" value={newTaskDeadline} onChange={(e) => setNewTaskDeadline(e.target.value)} bg="white" color="black" />
            <Input placeholder="Optional Notes" value={newTaskNotes} onChange={(e) => setNewTaskNotes(e.target.value)} bg="white" color="black" />
            <Button colorScheme="blue" onClick={handleAddTask} isDisabled={!newTaskTitle || !newTaskDeadline}>
              Add Task
            </Button>
          </VStack>
        </Box>
      </Box>

      <Box width="full" maxWidth="1200px" boxShadow="xl" borderRadius="lg" overflow="hidden">
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
