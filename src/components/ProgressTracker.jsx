import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FaTrophy, FaCheckCircle, FaChartLine } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";

const milestones = [5, 10, 15, 20, 25];
const accentPalette =
  typeof window !== "undefined"
    ? localStorage.getItem("accentPalette") || "blue"
    : "blue";

// Determinar el color del ícono según la paleta
const iconColor =
  accentPalette === "white"
    ? "#000000" // Negro para white
    : accentPalette === "gray"
      ? "#ffffff" // Blanco para gray
      : "#ffffff"; // Blanco para otras paletas (blue, green, etc.)
const ProgressTracker = () => {
  const reduxTasks = useSelector((state) => state.tasks.tasks);
  const { user } = useAuth();
  const [localTasks, setLocalTasks] = useState([]);

  // Load local tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem("localTasks");
    if (savedTasks) {
      setLocalTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Listen for changes in localStorage and custom events
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "localTasks") {
        const newTasks = e.newValue ? JSON.parse(e.newValue) : [];
        setLocalTasks(newTasks);
      }
    };

    const handleLocalUpdate = () => {
      const savedTasks = localStorage.getItem("localTasks");
      if (savedTasks) {
        setLocalTasks(JSON.parse(savedTasks));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("localTasksUpdated", handleLocalUpdate);
    window.addEventListener("taskCompleted", handleLocalUpdate);
    window.addEventListener("taskUncompleted", handleLocalUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("localTasksUpdated", handleLocalUpdate);
      window.removeEventListener("taskCompleted", handleLocalUpdate);
      window.removeEventListener("taskUncompleted", handleLocalUpdate);
    };
  }, []);

  // Get the appropriate tasks based on user status
  const tasks = user ? reduxTasks : localTasks;
  const userTasks = user
    ? tasks.filter((task) => task.user_id === user.id)
    : tasks;
  const completedTasks = userTasks.filter((task) => task.completed).length;
  const totalTasks = userTasks.length;
  const progressPercentage =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const [toast, setToast] = useState({ visible: false, message: "" });

  useEffect(() => {
    if (milestones.includes(completedTasks)) {
      setToast({
        visible: true,
        message: `🎉 ¡Felicidades! Has completado ${completedTasks} tareas!`,
      });
      const timer = setTimeout(() => {
        setToast({ visible: false, message: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [completedTasks]);

  const getNextMilestone = () => {
    return milestones.find((milestone) => milestone > completedTasks) || "All";
  };

  const getProductivity = () => {
    const today = new Date();
    const tasksCompletedToday = userTasks.filter(
      (task) =>
        task.completed &&
        new Date(task.completedAt).toDateString() === today.toDateString(),
    ).length;
    return tasksCompletedToday;
  };

  return (
    <div>
      <div className="maincard">
        <h2
          className="text-2xl font-bold mb-6 flex items-center"
          style={{ color: "var(--text-primary)" }}
        >
          <FaChartLine className="mr-2" style={{ color: iconColor }} /> Progress
          Tracker
        </h2>

        <div className="space-y-6">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between gap-4">
              <div
                className="flex-1 overflow-hidden h-2 rounded"
                style={{ backgroundColor: "var(--bg-tertiary)" }}
              >
                <div
                  style={{
                    width: `${progressPercentage}%`,
                    backgroundColor: "var(--accent-primary)",
                  }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap justify-center transition-all duration-500 ease-in-out h-2 rounded"
                ></div>
              </div>
              <span
                className="text-s font-semibold inline-block ml-2"
                style={{
                  color: "var(--accent-primary)",
                  minWidth: "32px",
                  textAlign: "right",
                }}
              >
                {progressPercentage.toFixed(0)}%
              </span>
            </div>
          </div>

          <p
            className="text-lg font-medium flex items-center justify-center gap-2"
            style={{ color: "var(--text-primary)" }}
          >
            <span
              className="text-3xl font-bold"
              style={{ color: "var(--accent-primary)" }}
            >
              {completedTasks}
            </span>
            out of
            <span
              className="text-3xl font-bold"
              style={{ color: "var(--accent-tertiary)" }}
            >
              {totalTasks}
            </span>
            tasks completed
          </p>

          <div className="flex justify-between items-center">
            <div style={{ color: "var(--text-secondary)" }}>
              <FaTrophy
                className="inline mr-2"
                style={{ color: "var(--accent-primary)" }}
              />
              Next milestone: {getNextMilestone()} tasks
            </div>
            <div style={{ color: "var(--text-secondary)" }}>
              <FaCheckCircle
                className="inline mr-2"
                style={{ color: "var(--accent-primary)" }}
              />
              Today's productivity: {getProductivity()} tasks
            </div>
          </div>
        </div>
      </div>

      {toast.visible && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg animate-slideIn"
          style={{
            backgroundColor: "var(--accent-primary)",
            color: "var(--text-primary)",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
