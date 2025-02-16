// src/components/Achievements.jsx

import { useSelector } from "react-redux";

const Achievement = ({ emoji, text, bgColor }) => (
  <div className={`inline-flex items-center text-lg font-medium text-text-primary ${bgColor} py-3 px-5 rounded-xl mt-3 transition-all duration-300 hover:shadow-lg hover:scale-105`}>
    <span className="text-3xl mr-3">{emoji}</span>
    {text}
  </div>
);

const Achievements = () => {
  const tasks = useSelector((state) => state.tasks.tasks);
  const completed = tasks.filter((task) => task.completed).length;

  return (
    <div className="w-full max-w-md mx-auto my-8 bg-bg-secondary p-6 rounded-2xl shadow-lg text-center transition-all duration-300 hover:shadow-xl border border-border-primary">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Achievements</h2>

      {completed >= 20 && (
        <Achievement 
          emoji="🔥" 
          text="20 Tasks Completed!" 
          bgColor="bg-accent-deep bg-opacity-80 hover:bg-opacity-100"
        />
      )}

      {completed >= 10 && completed < 20 && (
        <Achievement 
          emoji="🎉" 
          text="10 Tasks Completed!" 
          bgColor="bg-accent-tertiary bg-opacity-80 hover:bg-opacity-100"
        />
      )}

      {completed < 10 && (
        <div className="flex flex-col items-center justify-center text-base text-text-secondary bg-bg-tertiary p-4 rounded-xl">
          <span className="text-4xl mb-3">🚀</span>
          <p>Complete more tasks to unlock achievements.</p>
          <p className="mt-2 text-sm text-text-tertiary">Next achievement: 10 tasks</p>
        </div>
      )}

      <div className="mt-6 text-text-secondary">
        <p>Total completed tasks: <span className="font-bold text-accent-primary">{completed}</span></p>
      </div>
    </div>
  );
};

export default Achievements;
