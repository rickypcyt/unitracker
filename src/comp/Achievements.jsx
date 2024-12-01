import { Box, Text } from "@chakra-ui/react";
import { useSelector } from "react-redux";

const Achievements = () => {
  const tasks = useSelector((state) => state.tasks);
  const completed = tasks.filter((task) => task.completed).length;

  return (
    <Box
      bg="gray.700" // Background color for visibility
      color="white" // Text color for contrast
      p={4} // Padding for spacing
      borderRadius="md" // Rounded corners
      boxShadow="md" // Add shadow for emphasis
      textAlign="center" // Center align text
      width="100%" // Make it responsive
      maxWidth="400px" // Set a max width for proper sizing
    >
      {completed >= 10 && <Text fontSize="lg">🎉 10 Tasks Completed!</Text>}
      {completed >= 20 && <Text fontSize="lg">🔥 20 Tasks Completed!</Text>}
      {completed < 10 && <Text fontSize="lg">Keep going! Complete more tasks to earn achievements! 🚀</Text>}
    </Box>
  );
};

export default Achievements;
