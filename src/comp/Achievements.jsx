// src/components/Achievements.jsx

// Import necessary components from Chakra UI
import { Box, Text } from "@chakra-ui/react";

// Import the useSelector hook from react-redux to access the Redux state
import { useSelector } from "react-redux";

// Import the CSS file for styling
import "./Achievements.css";

// Achievements component to display user achievements based on completed tasks
const Achievements = () => {
  // Use the useSelector hook to select the tasks from the Redux state
  const tasks = useSelector((state) => state.tasks.tasks);

  // Calculate the number of completed tasks
  const completed = tasks.filter((task) => task.completed).length;

  return (
    // Container for the achievements
    <div className="achievements-container">
      {/*
        Conditional rendering for achievements based on the number of completed tasks.
        Display a milestone achievement if 20 or more tasks are completed.
      */}
      {completed >= 20 && (
        <div className="achievement-text achievement-milestone">
          <span className="achievement-icon">🔥</span>
          20 Tasks Completed!
        </div>
      )}

      {/*
        Conditional rendering for achievements based on the number of completed tasks.
        Display a milestone achievement if 10 to 19 tasks are completed.
      */}
      {completed >= 10 && completed < 20 && (
        <div className="achievement-text achievement-milestone">
          <span className="achievement-icon">🎉</span>
          10 Tasks Completed!
        </div>
      )}

      {/*
        Conditional rendering for a motivational message if fewer than 10 tasks are completed.
      */}
      {completed < 10 && (
        <div className="achievement-text achievement-motivational">
          <span className="achievement-icon">🚀</span>
          Keep going! Complete more tasks to earn achievements!
        </div>
      )}
    </div>
  );
};

// Export the Achievements component as the default export
export default Achievements;
