import { Check, Circle, Clock, Play } from 'lucide-react';
import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';

const SessionStatsAndTasks = () => {
  // Define types for our data
  interface Task {
    id: string;
    title: string;
    completed: boolean;
    completed_at?: string;
    deadline?: string;
    status?: string;
    isActive?: boolean;
    assignment?: string;
  }

  interface Lap {
    id: string;
    created_at: string;
    end_time: string;
    duration?: number;
  }

  // Get laps/pomodoros from store
  const laps = useSelector((state: any) => (state.laps?.laps || []) as Lap[]);

  // Get tasks from store
  const tasks = useSelector((state: any) => (state.tasks?.tasks || []) as Task[]);

  // Calculate today's pomodoros completed
  const today = new Date().toDateString();
  const todaysLaps = laps.filter((lap: Lap) => {
    const lapDate = new Date(lap.created_at || '').toDateString();
    return lapDate === today && lap.end_time;
  });
  const todaysPomodoros = todaysLaps.length;
  
  // Calculate total study time today (in minutes)
  const totalStudyTime = todaysLaps.reduce((total: number, lap: Lap) => {
    if (lap.duration) {
      // Assuming duration is stored in seconds
      return total + (lap.duration / 60);
    }
    return total;
  }, 0);

  // Get completed tasks today
  const completedTasksToday = tasks.filter((task: Task) => {
    if (!task.completed_at) return false;
    const completedDate = new Date(task.completed_at).toDateString();
    return completedDate === today;
  }).length;

  // Get upcoming deadlines (next 3 days)
  const upcomingDeadlines = tasks.filter((task: Task) => {
    if (task.completed || !task.deadline) return false;
    const deadline = new Date(task.deadline);
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    return deadline >= today && deadline <= threeDaysFromNow;
  }).length;

  // Focus level calculation removed as it's not being used

  // Get active tasks (explicitly marked as active or with deadline for today)
  const activeTasks = tasks
    .filter((task: Task) => {
      // Check if task is explicitly marked as active
      const isActive = task.status === 'active' || task.isActive === true;
      
      // If no deadline and not explicitly active, don't show
      if (!task.deadline) return isActive;
      
      // Check if deadline is today
      const taskDate = new Date(task.deadline).toDateString();
      const todayDate = new Date().toDateString();
      const isDueToday = taskDate === todayDate;
      
      return isActive || isDueToday;
    })
    .slice(0, 5); // Limit to 5 tasks for the widget

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="maincard p-4 sm:p-5 w-full space-y-5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] shadow-sm">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between pb-2 border-b border-[var(--border-primary)]"
      >
        <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <div className="p-1.5 bg-[var(--accent-primary)]/10 rounded-lg">
            <Clock size={18} className="text-[var(--accent-primary)]" />
          </div>
          <span>Today's Session</span>
        </h3>
      </motion.div>

      {/* Stats Row */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {/* Total Study Time */}
        <motion.div 
          variants={item}
          className="relative overflow-hidden bg-gradient-to-br from-blue-500/5 to-indigo-500/5 p-4 rounded-xl border border-[var(--border-primary)] hover:shadow-md transition-all duration-300"
        >
          <div className="text-3xl font-bold text-blue-500 mb-1">
            {Math.floor(totalStudyTime)}m
          </div>
          <div className="text-sm font-medium text-[var(--text-secondary)]">
            Study Time
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        </motion.div>

        {/* Pomodoros Completed */}
        <motion.div 
          variants={item}
          className="relative overflow-hidden bg-gradient-to-br from-purple-500/5 to-pink-500/5 p-4 rounded-xl border border-[var(--border-primary)] hover:shadow-md transition-all duration-300"
        >
          <div className="text-3xl font-bold text-purple-500 mb-1">
            {todaysPomodoros}
          </div>
          <div className="text-sm font-medium text-[var(--text-secondary)]">
            Pomodoros
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
        </motion.div>

        {/* Tasks Completed Today */}
        <motion.div 
          variants={item}
          className="relative overflow-hidden bg-gradient-to-br from-green-500/5 to-emerald-500/5 p-4 rounded-xl border border-[var(--border-primary)] hover:shadow-md transition-all duration-300"
        >
          <div className="text-3xl font-bold text-green-500 mb-1">
            {completedTasksToday}
          </div>
          <div className="text-sm font-medium text-[var(--text-secondary)]">
            Tasks Done
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div 
          variants={item}
          className="relative overflow-hidden bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-4 rounded-xl border border-[var(--border-primary)] hover:shadow-md transition-all duration-300"
        >
          <div className="text-3xl font-bold text-amber-500 mb-1">
            {upcomingDeadlines}
          </div>
          <div className="text-sm font-medium text-[var(--text-secondary)]">
            Due Soon
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
        </motion.div>
      </motion.div>

      {/* Active Tasks Section */}
      <motion.div 
        variants={item}
        className="relative overflow-hidden bg-gradient-to-br from-[var(--accent-secondary)/5] to-[var(--accent-primary)/5] p-4 rounded-xl border-[var(--border-primary)] hover:shadow-md transition-all duration-300 mt-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-md font-medium text-[var(--text-primary)] flex items-center gap-2">
            <div className="p-1 bg-[var(--accent-primary)]/10 rounded-md">
              <Play size={14} className="text-[var(--accent-primary)]" />
            </div>
            <span>Active Tasks</span>
            <span className="ml-auto text-xs font-normal bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-2 py-0.5 rounded-full">
              {activeTasks.length} active
            </span>
          </h4>
        </div>

        {/* Active Tasks List */}
        {activeTasks.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {activeTasks.map((task: Task, index: number) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
                className="group flex items-start gap-3 p-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-primary)] transition-all duration-200"
              >
                <button
                  className="flex-shrink-0 mt-0.5 transition-all duration-200 hover:scale-110"
                  onClick={() => {
                    console.log('Toggle task completion:', task.id);
                  }}
                >
                  <div className="relative">
                    <Circle 
                      size={18} 
                      className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors duration-200" 
                      strokeWidth={1.5}
                    />
                    <Check 
                      size={10} 
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-transparent group-hover:text-white transition-colors duration-200"
                      strokeWidth={3}
                    />
                  </div>
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors duration-200">
                    {task.title}
                  </div>
                  {task.assignment && (
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                        {task.assignment}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-6 px-4 text-center"
          >
            <div className="p-3 mb-2 rounded-full bg-[var(--accent-primary)]/10">
              <Clock size={20} className="text-[var(--accent-primary)]" />
            </div>
            <h4 className="text-sm font-medium text-[var(--text-primary)] mb-1">No active tasks</h4>
            <p className="text-xs text-[var(--text-secondary)] max-w-xs">
              You haven't activated any tasks for today yet
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default SessionStatsAndTasks;
