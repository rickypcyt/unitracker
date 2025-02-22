import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const milestones = [5, 10, 15, 20, 25];

const ProgressTracker = () => {
  const tasks = useSelector((state) => state.tasks.tasks);
  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  // Estado para el toast
  const [toast, setToast] = useState({ visible: false, message: "" });

  // Mostrar toast si se cumple un milestone
  useEffect(() => {
    if (milestones.includes(completedTasks)) {
      setToast({ visible: true, message: `🎉 ¡Felicidades! Has completado ${completedTasks} tareas!` });
      const timer = setTimeout(() => {
        setToast({ visible: false, message: "" });
      }, 3000); // oculta el toast después de 3 segundos
      return () => clearTimeout(timer);
    }
  }, [completedTasks]);

  return (
    <div>
      {/* Tarjeta principal de progreso */}
      <div className="relative max-w-full mx-auto my-8 bg-secondary border border-border-primary rounded-2xl p-6 shadow-lg mr-2 ml-2">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Progress Tracker</h2>
        
        <div className="space-y-6">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-s font-semibold inline-block py-1 px-2 uppercase rounded-full text-accent-primary bg-accent-primary bg-opacity-20">
                  Progress
                </span>
              </div>
              <div className="text-right">
                <span className="text-s font-semibold inline-block text-accent-primary">
                  {progressPercentage.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-s flex rounded bg-bg-tertiary">
              <div style={{ width: `${progressPercentage}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-accent-primary transition-all duration-500 ease-in-out"></div>
            </div>
          </div>

          <p className="text-lg font-medium text-text-primary flex items-center justify-center gap-2">
            <span className="text-3xl font-bold text-accent-primary">{completedTasks}</span> 
            out of 
            <span className="text-3xl font-bold text-accent-tertiary">{totalTasks}</span> 
            tasks completed
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded shadow-lg animate-slideIn">
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
