// src/Home.jsx
import React, { useState, useEffect } from 'react';
import { Button, Input, Stack, Box, Heading, Text } from '@chakra-ui/react';

const Home = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: ''
  });

  // Cargar las tareas desde el backend cuando se monta el componente
  useEffect(() => {
    fetch('http://localhost:5000/api/tasks')
      .then((response) => response.json())
      .then((data) => setTasks(data))
      .catch((error) => console.error('Error al cargar tareas:', error));
  }, []);

  // Función para agregar una nueva tarea
  const addTask = (e) => {
    e.preventDefault();
  
    if (!newTask.title || !newTask.deadline) {
      alert('Title and deadline are required!');
      return;
    }
  
    // Establecer el estado `completed` como `false` por defecto si no está presente
    const taskToAdd = { ...newTask, completed: false };
  
    // Hacer la solicitud al servidor para agregar la tarea
    fetch('http://localhost:5000/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskToAdd),
    })
      .then((response) => response.json())
      .then((data) => {
        setTasks([...tasks, data]); // Agregar la nueva tarea a la lista
        setNewTask({ title: '', description: '', deadline: '' }); // Limpiar el formulario
      })
      .catch((error) => console.error('Error al agregar tarea:', error));
  };
  

  // Función para marcar una tarea como completada o incompleta
  const toggleTaskStatus = (id) => {
    fetch(`http://localhost:5000/api/tasks/${id}/toggle`, {
      method: 'PUT',
    })
      .then((response) => response.json())
      .then((data) => {
        setTasks(tasks.map((task) =>
          task.id === data.id ? { ...task, completed: data.completed } : task
        ));
      })
      .catch((error) => console.error('Error al cambiar el estado de la tarea:', error));
  };
  

  // Función para eliminar una tarea
  const deleteTask = (id) => {
    fetch(`http://localhost:5000/api/tasks/${id}`, {
      method: 'DELETE',
    })
      .then(() => {
        setTasks(tasks.filter((task) => task.id !== id)); // Eliminar la tarea de la lista
      })
      .catch((error) => console.error('Error al eliminar la tarea:', error));
  };

  return (
    <Box maxW="800px" mx="auto" mt={10} p={5}>
      <Heading mb={6} textAlign="center" size="lg">Task Tracker</Heading>

      {/* Formulario para agregar tareas */}
      <form onSubmit={addTask}>
        <Stack spacing={4}>
          <Input
            id="title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            placeholder="Enter task title"
            required
          />

          <Input
            id="description"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            placeholder="Enter task description (optional)"
          />

          <Input
            id="deadline"
            type="date"
            value={newTask.deadline}
            onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
            required
          />

          <Button colorScheme="teal" type="submit" width="full">Add Task</Button>
        </Stack>
      </form>

      {/* Lista de tareas */}
      <Box mt={10}>
        {tasks.length === 0 ? (
          <Text textAlign="center" color="gray.500">No tasks available</Text>
        ) : (
          <Stack spacing={4}>
            {tasks.map((task) => (
              <Box
                key={task.id}
                p={5}
                borderWidth={1}
                borderRadius="md"
                bg={task.completed ? 'green.50' : 'white'}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text
                  fontWeight="bold"
                  textDecoration={task.completed ? 'line-through' : 'none'}
                >
                  {task.title}
                </Text>
                <Box>
                  <Button
                    colorScheme={task.completed ? 'orange' : 'green'}
                    size="sm"
                    onClick={() => toggleTaskStatus(task.id)}
                    mr={2}
                  >
                    {task.completed ? 'Undo' : 'Complete'}
                  </Button>
                  <Button
                    colorScheme="red"
                    size="sm"
                    onClick={() => deleteTask(task.id)}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default Home;
