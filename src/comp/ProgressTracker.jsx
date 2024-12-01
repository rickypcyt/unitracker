import React from "react";
import { Box, Text, Stack } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import "./ProgressTracker.css";  // Import the CSS file

const ProgressTracker = () => {
  const tasks = useSelector((state) => state.tasks.tasks);
  const completedTasks = tasks.filter((task) => task.completed).length;
  return (
    <Box className="progress-tracker-container">
      <Text className="progress-tracker-text" fontSize="xl">Progress Tracker</Text>
      <Stack spacing={4}>
        <Text className="progress-tracker-text">{completedTasks} tasks completed!</Text>
        {completedTasks >= 10 && <Text className="progress-tracker-milestone">🎉 You've completed 10 tasks!</Text>}
      </Stack>
    </Box>
  );
};

export default ProgressTracker;