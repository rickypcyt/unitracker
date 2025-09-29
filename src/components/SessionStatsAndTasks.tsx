import { Check, Circle, Clock, Play } from 'lucide-react';
import { useMemo, useState, useRef, useEffect } from 'react';

import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { TaskListMenu } from '@/modals/TaskListMenu';
import { toggleTaskStatus, updateTask, deleteTask } from '@/store/TaskActions';

interface ContextMenu {
  x: number;
  y: number;
  task: any;
}

const SessionStatsAndTasks = () => {
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
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

  const dispatch = useDispatch();
  
  // Get tasks from store and memoize the calculation
  const tasks = useSelector((state: any) => (state.tasks?.tasks || []) as Task[]);
  
  // Handle task completion toggle
  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      await dispatch(toggleTaskStatus(taskId, !currentStatus) as any);
    } catch (error) {
      console.error('Error toggling task status:', error);
    }
  };

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    setContextMenu(
      contextMenu === null
        ? { x: e.clientX, y: e.clientY, task }
        : null
    );
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle task actions
  const handleSetActiveTask = async (task: Task) => {
    try {
      await dispatch(updateTask({ ...task, activetask: !task.activetask }) as any);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      if (window.confirm('Are you sure you want to delete this task?')) {
        await dispatch(deleteTask(taskId) as any);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleEditTask = (task: Task) => {
    // You can implement edit functionality here or navigate to edit page
    console.log('Edit task:', task);
  };
  
  // Format seconds to "Xh Ym" format
  const formatStudyTime = (seconds: number): string => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Memoize all derived state to prevent unnecessary recalculations
  const { 
    todaysPomodoros, 
    totalStudyTimeFormatted,
    completedTasksCount, 
    upcomingDeadlinesCount, 
    activeTasks,
    today
  } = useMemo(() => {
    const today = new Date().toDateString();
    
    // Calculate today's pomodoros completed and total study time
    let totalStudyTime = 0;
    const todaysLaps = laps.filter((lap: Lap) => {
      const lapDate = new Date(lap.created_at || '').toDateString();
      if (lapDate === today && lap.end_time) {
        // Calculate duration in seconds if not already set
        if (lap.duration) {
          totalStudyTime += lap.duration;
        } else if (lap.created_at && lap.end_time) {
          const start = new Date(lap.created_at).getTime();
          const end = new Date(lap.end_time).getTime();
          if (!isNaN(start) && !isNaN(end) && end > start) {
            const duration = Math.floor((end - start) / 1000);
            totalStudyTime += duration;
          }
        }
        return true;
      }
      return false;
    });
    
    const todaysPomodoros = todaysLaps.length;
    const totalStudyTimeFormatted = formatStudyTime(totalStudyTime);

    // Get completed tasks today
    const completedTasksCount = tasks.filter((task: Task) => {
      if (!task.completed_at) return false;
      const completedDate = new Date(task.completed_at).toDateString();
      return completedDate === today;
    }).length;

    // Get upcoming deadlines (next 3 days)
    const upcomingDeadlinesCount = tasks.filter((task: Task) => {
      if (task.completed || !task.deadline) return false;
      const deadline = new Date(task.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(today.getDate() + 3);
      return deadline >= today && deadline <= threeDaysFromNow;
    }).length;

    // Get active tasks (tasks with activetask flag set to true and not completed)
    const activeTasks = tasks
      .filter((task: Task) => task.activetask === true && task.completed !== true)
      .slice(0, 5); // Limit to 5 tasks for the widget
      
    return {
      todaysPomodoros,
      totalStudyTime,
      totalStudyTimeFormatted,
      completedTasksCount,
      upcomingDeadlinesCount,
      activeTasks,
      today // Return today value
    };
  }, [tasks, laps]); // Only recalculate when tasks or laps change

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
    <div className="w-full space-y-4 md:space-y-5 relative">
      {/* Context Menu */}
      {contextMenu && (
        <div ref={menuRef}>
          <TaskListMenu
            contextMenu={contextMenu}
            onClose={() => setContextMenu(null)}
            onSetActiveTask={handleSetActiveTask}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
          />
        </div>
      )}
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between pb-2 border-b border-[var(--border-primary)]"
      >
        <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <div className="p-1 sm:p-1.5 bg-[var(--accent-primary)]/10 rounded-lg">
            <Clock size={16} className="sm:w-[18px] sm:h-[18px] w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <span className="text-sm sm:text-base md:text-lg">Today's Session</span>
        </h3>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4"
      >
        {/* Total Study Time */}
        <motion.div 
          variants={item}
          className="relative overflow-hidden bg-gradient-to-br from-blue-500/5 to-indigo-500/5 p-2 sm:p-3 md:p-4 rounded-lg border-[var(--border-primary)] hover:shadow-md transition-all duration-300 w-full flex flex-col items-center text-center"
        >
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-500 mb-0.5 sm:mb-1">
            {totalStudyTimeFormatted}
          </div>
          <div className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
            Study Time
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        </motion.div>

        {/* Pomodoros Completed */}
        <motion.div 
          variants={item}
          className="relative overflow-hidden bg-gradient-to-br from-purple-500/5 to-pink-500/5 p-2 sm:p-3 md:p-4 rounded-lg border-[var(--border-primary)] hover:shadow-md transition-all duration-300 w-full flex flex-col items-center text-center"
        >
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-500 mb-0.5 sm:mb-1">
            {todaysPomodoros}
          </div>
          <div className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
            Pomodoros
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
        </motion.div>

        {/* Tasks Completed Today */}
        <motion.div 
          variants={item}
          className="relative overflow-hidden bg-gradient-to-br from-green-500/5 to-emerald-500/5 p-2 sm:p-3 md:p-4 rounded-lg border-[var(--border-primary)] hover:shadow-md transition-all duration-300 w-full flex flex-col items-center text-center"
        >
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-500 mb-0.5 sm:mb-1">
            {completedTasksCount}
          </div>
          <div className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
            Tasks Done
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
        </motion.div>

        <motion.div 
          variants={item}
          className="relative overflow-hidden bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-2 sm:p-3 md:p-4 rounded-lg border-[var(--border-primary)] hover:shadow-md transition-all duration-300 w-full flex flex-col items-center text-center group"
        >
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-500 mb-0.5 sm:mb-1">
            {upcomingDeadlinesCount}
          </div>
          <div className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
            Due Soon
          </div>
          {upcomingDeadlinesCount > 0 && (
            <div className="absolute z-50 min-w-[240px] p-3 rounded-lg bg-[var(--bg-primary)] shadow-xl border-2 border-amber-500 transform -translate-x-1/2 -translate-y-2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-0 transition-all duration-200 pointer-events-none"
              style={{
                top: 'calc(100% + 8px)',
                left: '50%',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              }}
            >
              <div className="absolute -top-2 left-1/2 w-3 h-3 -translate-x-1/2 rotate-45 bg-[var(--bg-primary)]"
                style={{
                  borderTop: '2px solid var(--accent-primary)',
                  borderLeft: '2px solid var(--accent-primary)',
                  zIndex: 1,
                }}
              />
              <h4 className="font-semibold text-sm text-amber-500 mb-2 text-center">Due in Next 3 Days</h4>
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {tasks
                  .filter((task: Task) => {
                    if (task.completed || !task.deadline) return false;
                    const deadline = new Date(task.deadline);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const threeDaysFromNow = new Date(today);
                    threeDaysFromNow.setDate(today.getDate() + 3);
                    return deadline >= today && deadline <= threeDaysFromNow;
                  })
                  .sort((a: Task, b: Task) => {
                    return new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime();
                  })
                  .map((task: Task, index: number) => {
                    const deadline = new Date(task.deadline || '');
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const diffTime = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <li key={index} className="text-sm text-[var(--text-primary)] flex items-start gap-2">
                        <div className="flex-shrink-0 w-14 text-xs font-medium text-amber-500 mt-0.5">
                          {diffTime === 0 ? 'Today' : diffTime === 1 ? 'Tomorrow' : `${diffTime}d`}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{task.title}</div>
                          {task.assignment && (
                            <div className="text-xs text-[var(--text-secondary)] truncate">{task.assignment}</div>
                          )}
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
        </motion.div>
      </motion.div>

      {/* Active Tasks Section */}
      <motion.div 
        variants={item}
        className="relative overflow-hidden bg-gradient-to-br from-[var(--accent-secondary)/5] to-[var(--accent-primary)/5] p-4 rounded-xl border-[var(--border-primary)] pt-0 pb-0"
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-md font-medium text-[var(--text-primary)] flex items-center gap-2">
            <div className="p-1 bg-[var(--accent-primary)]/10 rounded-md">
              <Play size={14} className="text-[var(--accent-primary)]" />
            </div>
            <span>Active Tasks</span>
            <span className="ml-auto text-sm font-normal bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-2 py-0.5 rounded-full">
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
                onContextMenu={(e) => handleContextMenu(e, task)}
                className="group flex items-start gap-3 p-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-primary)] transition-all duration-200 cursor-context-menu"
              >
                <button
                  className="flex-shrink-0 mt-0.5 transition-all duration-200 hover:scale-110"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleTask(task.id, task.completed);
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
                    <div className="text-sm text-[var(--text-secondary)] mt-0.5">
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
            className="flex flex-col items-center justify-center py-3 px-2 text-center"
          >
            <div className="p-1 mb-1 rounded-full bg-[var(--accent-primary)]/10">
              <Clock size={20} className="text-[var(--accent-primary)]" />
            </div>
            <h4 className="text-sm lg:text-base font-medium text-[var(--text-primary)] mb-1">No active tasks</h4>
            <p className="text-sm lg:text-base text-[var(--text-secondary)] max-w-xs">
              You haven't activated any tasks for today yet
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default SessionStatsAndTasks;
