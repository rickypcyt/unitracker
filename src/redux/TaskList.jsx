import React, { useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Trash2, CheckCircle2, Circle, Calendar } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { markTaskAsCompleted, markTaskAsNotCompleted, deleteTask } from './TaskActions';
import './TaskList.css';

const TaskList = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.tasks);
  const [hoveredTaskId, setHoveredTaskId] = useState(null);

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
              justifyContent="space-between"
              p={3}
              mb={2}
              borderRadius="md"
              bg="var(--dark-bg-secondary)"
              _hover={{ bg: 'var(--dark-bg-tertiary)' }}
            >
              {/* Left Section: Checkbox + Title */}
              <Flex alignItems="center" flex={1}>
                <button
                  onClick={() => {
                    if (task.completed) {
                      dispatch(markTaskAsNotCompleted(task.id));
                    } else {
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

                <Text
                  ml={3}
                  className={`task-text ${task.completed ? 'task-text-completed' : ''}`}
                  fontSize="md"
                >
                  {task.title}
                </Text>
              </Flex>

              {/* Middle Section: Description */}
              {task.description && (
                <Text
                  flex={2}
                  mx={4}
                  fontSize="sm"
                  color="var(--text-secondary)"
                  noOfLines={1}
                  title={task.description}
                >
                  {task.description}
                </Text>
              )}

              {/* Right Section: Date + Delete */}
              <Flex alignItems="center" flexShrink={0}>
                <Flex alignItems="center" mr={4}>
                  <Calendar size={16} color="var(--text-secondary)" />
                  <Text ml={1} fontSize="sm" color="var(--text-secondary)">
                    {new Date(task.deadline).toLocaleDateString()}
                  </Text>
                </Flex>
                <Box
                  as="button"
                  onClick={() => dispatch(deleteTask(task.id))}
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
            </Flex>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default TaskList;