// src/components/TaskList.jsx
import React from 'react';
import { Box, Button, Stack, Text } from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTaskStatus, deleteTask } from './TaskActions';

const TaskList = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.tasks);

  return (
    <Box mt={10}>
      {tasks.length === 0 ? (
        <Text textAlign="center" color="gray.500">
          No tasks available
        </Text>
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
                  onClick={() => dispatch(toggleTaskStatus(task.id))}
                  mr={2}
                >
                  {task.completed ? 'Undo' : 'Complete'}
                </Button>
                <Button
                  colorScheme="red"
                  size="sm"
                  onClick={() => dispatch(deleteTask(task.id))}
                >
                  Delete
                </Button>
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default TaskList;
