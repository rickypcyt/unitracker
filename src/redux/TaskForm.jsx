// src/components/TaskForm.jsx
import React, { useState } from 'react';
import { Button, Input, Stack } from '@chakra-ui/react';
import { useDispatch } from 'react-redux';
import { addTask } from './TaskActions';

const TaskForm = () => {
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: '',
  });

  const dispatch = useDispatch();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newTask.title || !newTask.deadline) {
      alert('Title and deadline are required!');
      return;
    }

    const taskToAdd = { ...newTask, completed: false };
    dispatch(addTask(taskToAdd));
    setNewTask({ title: '', description: '', deadline: '' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={4}>
        <Input
          id="title"
          mt={5}
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
        <Button colorScheme="teal" type="submit" width="full" mt={5}>
          Add Task
        </Button>
      </Stack>
    </form>
  );
};

export default TaskForm;
