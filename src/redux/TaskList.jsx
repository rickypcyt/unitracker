import React, { useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Trash2, CheckCircle2, Circle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { markTaskAsCompleted, markTaskAsNotCompleted, deleteTask } from './TaskActions'; // Import actions
import './TaskList.css';

// TaskList component to display and manage tasks
const TaskList = () => {
  // Get the dispatch function from the Redux store
  const dispatch = useDispatch();

  // Select the tasks from the Redux state
  const tasks = useSelector((state) => state.tasks.tasks);

  // State to manage the hovered task ID
  const [hoveredTaskId, setHoveredTaskId] = useState(null);

  return (
    // Container for the task list
    <Box className="task-list-container">
      {tasks.length === 0 ? (
        // Display a message if there are no tasks
        <Box className="task-list-empty">No tasks available</Box>
      ) : (
        // Container for the task items
        <Box>
          {tasks.map((task) => (
            // Individual task item
            <Flex
              key={task.id}
              className="task-item"
              alignItems="center"
              mb={2}
              p={3}
              borderRadius="md"
              bg="var(--dark-bg-secondary)"
              _hover={{ bg: 'var(--dark-bg-tertiary)' }}
              onMouseEnter={() => setHoveredTaskId(task.id)} // Set the hovered task ID on mouse enter
              onMouseLeave={() => setHoveredTaskId(null)} // Reset the hovered task ID on mouse leave
            >
              {/* Button to toggle task completion status */}
              <Flex alignItems="center" mr={4}>
                <button
                  onClick={() => {
                    if (task.completed) {
                      // If the task is completed, mark it as not completed
                      dispatch(markTaskAsNotCompleted(task.id));
                    } else {
                      // If the task is not completed, mark it as completed
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
                    // Display a check circle if the task is completed
                    <CheckCircle2 color="#4CAF50" size={24} />
                  ) : (
                    // Display a circle if the task is not completed
                    <Circle color="#888" size={24} />
                  )}
                </button>
              </Flex>

              {/* Task text with completion status styling */}
              <Text
                flex={1}
                className={`task-text ${task.completed ? 'task-text-completed' : ''}`}
              >
                {task.title}
              </Text>

              {/* Show task description tooltip on hover */}
              {hoveredTaskId === task.id && (
                <Box className="task-description-tooltip">
                  <Text fontSize="sm" color="white">
                    {task.description}
                  </Text>
                </Box>
              )}

              {/* Button to delete the task */}
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

// Export the TaskList component as the default export
export default TaskList;
