// src/components/Achievements.jsx
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const AchievementToast = ({ emoji, text, bgColor }) => (
  <div
    className={`inline-flex items-center text-lg font-medium text-text-primary ${bgColor} py-3 px-5 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105`}
  >
    <span className="text-3xl mr-3">{emoji}</span>
    {text}
  </div>
);

const Achievements = () => {
  const tasks = useSelector((state) => state.tasks.tasks);
  const completed = tasks.filter((task) => task.completed).length;
  const previousCompleted = useRef(completed);

  useEffect(() => {
    const checkMilestones = () => {
      const milestones = [
        { threshold: 20, emoji: "🔥", text: "20 Tasks Completed!", bgColor: "bg-accent-deep" },
        { threshold: 10, emoji: "🎉", text: "10 Tasks Completed!", bgColor: "bg-accent-tertiary" }
      ];

      for (const milestone of milestones) {
        if (
          previousCompleted.current < milestone.threshold &&
          completed >= milestone.threshold
        ) {
          toast(
            <AchievementToast
              emoji={milestone.emoji}
              text={milestone.text}
              bgColor={`${milestone.bgColor} bg-opacity-80 hover:bg-opacity-100`}
            />,
            {
              position: "bottom-right",
              autoClose: 5000,
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            }
          );
          break; // Solo muestra el hito más alto alcanzado
        }
      }
    };

    checkMilestones();
    previousCompleted.current = completed;
  }, [completed]);

  return null; // Este componente no renderiza nada en la UI
};

export default Achievements;