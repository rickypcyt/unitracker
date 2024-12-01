// src/components/TaskList.js
import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Trash2, CheckCircle2, Circle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { markTaskAsCompleted, markTaskAsNotCompleted, deleteTask } from './TaskActions'; // Importar acciones
import './TaskList.css';

const TaskList = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.tasks);

  return (
    <Box className="task-list-container">
      {tasks.length === 0 ? (
        <Box className="task-list-empty">No tasks available</Box>
      ) : (
        <Box>
          {tasks.map((task) => (
            <Flex
              key={task.id}
              className="task-item"
              alignItems="center"
              mb={2}
              p={3}
              borderRadius="md"
              bg="var(--dark-bg-secondary)"
              _hover={{ bg: 'var(--dark-bg-tertiary)' }}
            >
              {/* Botón para alternar entre completado e incompleto */}
              <Flex alignItems="center" mr={4}>
                <button
                  onClick={() => {
                    if (task.completed) {
                      // Si la tarea está completa, marcarla como incompleta
                      dispatch(markTaskAsNotCompleted(task.id));
                    } else {
                      // Si la tarea está incompleta, marcarla como completa
                      dispatch(markTaskAsCompleted(task.id));
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {task.completed ? (
                    <CheckCircle2 color="#4CAF50" size={24} />
                  ) : (
                    <Circle color="#888" size={24} />
                  )}
                </button>
              </Flex>

              <Text
                flex={1}
                className={`task-text ${task.completed ? 'task-text-completed' : ''}`}
              >
                {task.title}
              </Text>

              <Box
                as="button"
                onClick={() => dispatch(deleteTask(task.id))}
                ml={2}
                color="red.400"
                transition="0.2s"
                _hover={{
                  color: 'red.500',
                  transform: 'scale(1.1)',
                }}
              >
                <Trash2 size={20} />
              </Box>
            </Flex>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default TaskList;
