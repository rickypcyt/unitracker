import { Progress, Box, Text } from "@chakra-ui/react";
import { useSelector } from "react-redux";

const ProgressTracker = () => {
  const tasks = useSelector((state) => state.tasks);
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const percentage = total ? (completed / total) * 100 : 0;

  return (
    <Box>
      <Text>Progress: {completed}/{total} tasks completed</Text>
      <Progress value={percentage} size="lg" colorScheme="green" />
    </Box>
  );
};

export default ProgressTracker;
