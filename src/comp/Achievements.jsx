// src/components/Achievements.jsx
import { Box, Text } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import "./Achievements.css"

const Achievements = () => {
  const tasks = useSelector((state) => state.tasks.tasks);
  const completed = tasks.filter((task) => task.completed).length;
  
  return (
    <div className="achievements-container">
      {completed >= 20 && (
        <div className="achievement-text achievement-milestone">
          <span className="achievement-icon">🔥</span>
          20 Tasks Completed!
        </div>
      )}
      {completed >= 10 && completed < 20 && (
        <div className="achievement-text achievement-milestone">
          <span className="achievement-icon">🎉</span>
          10 Tasks Completed!
        </div>
      )}
      {completed < 10 && (
        <div className="achievement-text achievement-motivational">
          <span className="achievement-icon">🚀</span>
          Keep going! Complete more tasks to earn achievements!
        </div>
      )}
    </div>
  );
};

export default Achievements;
