import React from "react";
import { Box, Text, Stack } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import "./ProgressTracker.css"; // Import the CSS file for styling

// ProgressTracker component to display the progress of completed tasks
const ProgressTracker = () => {
  // Use the useSelector hook to select the tasks from the Redux state
  const tasks = useSelector((state) => state.tasks.tasks);

  // Calculate the number of completed tasks
  const completedTasks = tasks.filter((task) => task.completed).length;

  return (
    // Container for the progress tracker
    <Box className="progress-tracker-container">
      <Text className="progress-tracker-text" fontSize="xl">
        Progress Tracker
      </Text>

      {/* Stack component to manage vertical spacing between elements */}
      <Stack spacing={4}>
        {/* Display the number of completed tasks */}
        <Text className="progress-tracker-text">
          {completedTasks} tasks completed!
        </Text>

        {/* Conditional rendering for a milestone message */}
        {completedTasks >= 10 && (
          <Text className="progress-tracker-milestone">
            🎉 You&apos;ve completed 10 tasks!
          </Text>
        )}
      </Stack>
    </Box>
  );
};

// Export the ProgressTracker component as the default export
export default ProgressTracker;
