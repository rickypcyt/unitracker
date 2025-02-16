import React from "react";
import { useSelector } from "react-redux";

const ProgressTracker = () => {
  const tasks = useSelector((state) => state.tasks.tasks);
  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="w-full max-w-md mx-auto my-8 bg-bg-secondary p-6 rounded-2xl shadow-lg text-center transition-all duration-300 hover:shadow-xl border border-border-primary">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Progress Tracker</h2>
      
      <div className="space-y-6">
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-accent-primary bg-accent-primary bg-opacity-20">
                Progress
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-accent-primary">
                {progressPercentage.toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-bg-tertiary">
            <div style={{ width: `${progressPercentage}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-accent-primary transition-all duration-500 ease-in-out"></div>
          </div>
        </div>

        <p className="text-lg font-medium text-text-primary flex items-center justify-center gap-2">
          <span className="text-3xl font-bold text-accent-primary">{completedTasks}</span> out of <span className="text-3xl font-bold text-accent-tertiary">{totalTasks}</span> tasks completed
        </p>

        {completedTasks >= 10 && (
          <div className="mt-6">
            <p className="inline-flex items-center text-text-primary bg-accent-deep bg-opacity-20 px-4 py-3 rounded-lg transition-all duration-300 hover:bg-opacity-30 shadow-md hover:shadow-lg">
              🎉 Congratulations! You've completed 10 tasks!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressTracker;
