import { Check, Circle, Clock, Play } from 'lucide-react';
import { deleteLap, updateLap, fetchLaps } from '@/store/LapActions';
import { deleteTask, toggleTaskStatus, updateTask, fetchTasks } from '@/store/TaskActions';
import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { AppDispatch } from '@/store/store';
import { TaskListMenu } from '@/modals/TaskListMenu';
import { motion } from 'framer-motion';
import { SYNC_EVENTS } from '../utils/constants';

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
    activetask?: boolean;
    assignment?: string;
  }

  interface Lap {
    id: string;
    created_at: string;
    started_at?: string;
    ended_at?: string | null;
    duration?: number; // seconds stored when completed
    name?: string;
    session_number?: number;
  }

  // Get laps/pomodoros from store
  const laps = useSelector((state: any) => (state.laps?.laps || []) as Lap[]);

  const dispatch = useDispatch<AppDispatch>();
  
  // Get tasks from store and memoize the calculation
  const tasks = useSelector((state: any) => (state.tasks?.tasks || []) as Task[]);
  
  // Function to refresh data
  const refreshData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchLaps() as any),
        dispatch(fetchTasks() as any)
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [dispatch]);
  
  // Listen for session completion events to refresh data
  useEffect(() => {
    const handleSessionCompleted = () => {
      // Force a refresh of the data when a session is completed
      refreshData();
    };

    // Listen for both the general finish event and the specific sessionCompleted event
    window.addEventListener('sessionCompleted', handleSessionCompleted);
    window.addEventListener(SYNC_EVENTS.FINISH_SESSION, handleSessionCompleted);
    
    return () => {
      window.removeEventListener('sessionCompleted', handleSessionCompleted);
      window.removeEventListener(SYNC_EVENTS.FINISH_SESSION, handleSessionCompleted);
    };
  }, [refreshData]);
  
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

  // Parse HH:MM:SS to seconds
  const parseHmsToSeconds = (hms?: string | number | null): number => {
    if (typeof hms === 'number') return hms;
    if (!hms || typeof hms !== 'string') return 0;
    const parts = hms.split(':');
    if (parts.length !== 3) return 0;
    const [hhRaw, mmRaw, ssRaw] = parts;
    const hh = Number.parseInt(hhRaw, 10) || 0;
    const mm = Number.parseInt(mmRaw, 10) || 0;
    const ss = Number.parseInt(ssRaw, 10) || 0;
    return hh * 3600 + mm * 60 + ss;
  };

  // Memoize all derived state to prevent unnecessary recalculations
  const TODAY_CACHE_KEY = 'today_stats_cache_v1';

  const [stableMetrics, setStableMetrics] = useState({
    todaysPomodoros: 0,
    totalStudyTimeFormatted: '0m',
    completedTasksCount: 0,
    upcomingDeadlinesCount: 0,
    activeTasks: [] as Task[],
  });

  // Initialize from cache on mount to avoid 0 flicker after hard refresh
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TODAY_CACHE_KEY);
      if (!raw) return;
      const cached = JSON.parse(raw);
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todayKey = startOfDay.toISOString().slice(0,10);
      if (cached?.date === todayKey && cached?.metrics) {
        setStableMetrics(cached.metrics);
      }
    } catch {}
  }, []);

  const { 
    todaysPomodoros, 
    totalStudyTimeFormatted,
    completedTasksCount, 
    upcomingDeadlinesCount, 
    activeTasks
  } = useMemo(() => {
    // Local day boundaries
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);

    const withinToday = (d?: string | null) => {
      if (!d) return false;
      const t = new Date(d).getTime();
      return !isNaN(t) && t >= startOfDay.getTime() && t < endOfDay.getTime();
    };

    // Calculate today's pomodoros and total study time based on created_at (fallback started_at)
    let totalStudyTime = 0;
    const todaysLaps = (laps as Lap[]).filter((lap) => {
      const created = lap.created_at || lap.started_at || null;
      return withinToday(created);
    });

    todaysLaps.forEach((lap) => {
      const dur = parseHmsToSeconds(lap.duration as any);
      if (dur > 0) {
        totalStudyTime += dur;
      } else {
        const startMs = new Date(lap.started_at || lap.created_at || '').getTime();
        if (!isNaN(startMs)) {
          const endMs = lap.ended_at ? new Date(lap.ended_at as string).getTime() : Date.now();
          if (!isNaN(endMs) && endMs > startMs) {
            totalStudyTime += Math.floor((endMs - startMs) / 1000);
          }
        }
      }
    });

    const todaysPomodoros = todaysLaps.length;
    const totalStudyTimeFormatted = formatStudyTime(totalStudyTime);

    // Get completed tasks today
    const completedTasksCount = tasks.filter((task: Task) => withinToday(task.completed_at || null)).length;

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
      activeTasks
    };
  }, [tasks, laps]); // Only recalculate when tasks or laps change

  // Preserve last valid metrics to avoid overwriting with zero-only data when partially loaded
  useEffect(() => {
    const lapsLen = laps?.length ?? 0;
    const tasksLen = tasks?.length ?? 0;
    const arraysEmpty = lapsLen === 0 && tasksLen === 0;
    if (arraysEmpty) return; // keep previous stable metrics

    const isZeroOnly = (todaysPomodoros === 0) && (totalStudyTimeFormatted === '0m');
    const prevIsZeroOnly = (stableMetrics.todaysPomodoros === 0) && (stableMetrics.totalStudyTimeFormatted === '0m');
    // If current calc is zero-only but previous had non-zero values, do not overwrite
    if (isZeroOnly && !prevIsZeroOnly) return;

    setStableMetrics({
      todaysPomodoros,
      totalStudyTimeFormatted,
      completedTasksCount,
      upcomingDeadlinesCount,
      activeTasks,
    });
  }, [laps, tasks, todaysPomodoros, totalStudyTimeFormatted, completedTasksCount, upcomingDeadlinesCount, activeTasks]);

  // Cache today's metrics locally whenever we compute valid non-zero data for the day
  useEffect(() => {
    const lapsLen = laps?.length ?? 0;
    const tasksLen = tasks?.length ?? 0;
    const arraysEmpty = lapsLen === 0 && tasksLen === 0;
    if (arraysEmpty) return;
    const isZeroOnly = (todaysPomodoros === 0) && (totalStudyTimeFormatted === '0m');
    // Only cache zero-only if there was no previous cache (first load of the day)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayKey = startOfDay.toISOString().slice(0,10);
    const raw = localStorage.getItem(TODAY_CACHE_KEY);
    const cached = raw ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : null;
    const hasPrevCacheForToday = cached?.date === todayKey && cached?.metrics;
    if (isZeroOnly && hasPrevCacheForToday) return;
    try {
      const payload = {
        date: todayKey,
        metrics: {
          todaysPomodoros,
          totalStudyTimeFormatted,
          completedTasksCount,
          upcomingDeadlinesCount,
          activeTasks,
        },
      };
      localStorage.setItem(TODAY_CACHE_KEY, JSON.stringify(payload));
    } catch {}
  }, [laps, tasks, todaysPomodoros, totalStudyTimeFormatted, completedTasksCount, upcomingDeadlinesCount, activeTasks]);

  // Unfinished sessions (no ended_at)
  const unfinishedLaps: Lap[] = useMemo(() => {
    return (laps || []).filter((lap: Lap) => !lap.ended_at);
  }, [laps]);

  const handleFinishLap = async (lap: Lap) => {
    try {
      const nowIso = new Date().toISOString();
      const startIso = lap.started_at || lap.created_at;
      const durationSec = Math.max(
        0,
        Math.floor((new Date(nowIso).getTime() - new Date(startIso).getTime()) / 1000)
      );
      await dispatch(updateLap(lap.id, { ended_at: nowIso, duration: durationSec, status: 'completed' }));
    } catch (e) {
      console.error('Error finishing session:', e);
    }
  };

  const handleDeleteLap = async (lapId: string) => {
    try {
      if (window.confirm('Delete this unfinished session?')) {
        await dispatch(deleteLap(lapId));
      }
    } catch (e) {
      console.error('Error deleting session:', e);
    }
  };

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

  // UI-safe values to prevent flicker during transient fetch states
  const displayStudyTime =
    (totalStudyTimeFormatted && totalStudyTimeFormatted !== '0m')
      ? totalStudyTimeFormatted
      : stableMetrics.totalStudyTimeFormatted;
  const displayPomodoros =
    (typeof todaysPomodoros === 'number' && todaysPomodoros > 0)
      ? todaysPomodoros
      : stableMetrics.todaysPomodoros;

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
          <div className="text-xl sm:text-2xl md:text-3xl lg:text-xl xl:text-3xl font-bold text-blue-500 mb-0.5 sm:mb-1">
            {displayStudyTime}
          </div>
          <div className="text-sm sm:text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
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
            {displayPomodoros}
          </div>
          <div className="text-sm sm:text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
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
          <div className="text-sm sm:text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
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
          <div className="text-sm sm:text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
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
                        <div className="flex-shrink-0 w-14 text-sm font-medium text-amber-500 mt-0.5">
                          {diffTime === 0 ? 'Today' : diffTime === 1 ? 'Tomorrow' : `${diffTime}d`}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{task.title}</div>
                          {task.assignment && (
                            <div className="text-sm text-[var(--text-secondary)] truncate">{task.assignment}</div>
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
            
          </motion.div>
        )}
      </motion.div>

      {/* Unfinished Sessions Section */}
      {unfinishedLaps.length > 0 && (
        <motion.div 
          variants={item}
          className="relative overflow-hidden p-4 rounded-xl border-[var(--border-primary)]"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-[var(--text-primary)] flex items-center gap-2">
              <div className="p-1 rounded-md">
                <Clock size={14} className="text-rose-500" />
              </div>
              <span>Unfinished Sessions</span>
              <span className="ml-2 text-sm font-normal bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full">
                {unfinishedLaps.length}
              </span>
            </h4>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {unfinishedLaps.map((lap: Lap) => {
              const startIso = lap.started_at || lap.created_at;
              const elapsedSec = Math.max(0, Math.floor((Date.now() - new Date(startIso).getTime()) / 1000));
              const title = lap.name || (lap.session_number ? `Session #${lap.session_number}` : 'Session');
              return (
                <div key={lap.id} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">{title}</div>
                    <div className="text-sm text-[var(--text-secondary)]">Created {formatStudyTime(elapsedSec)} ago</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFinishLap(lap)}
                      className="px-2 py-1 rounded-md bg-green-600 text-white text-sm hover:opacity-90"
                      title="Finish session"
                    >
                      Finish
                    </button>
                    <button
                      onClick={() => handleDeleteLap(lap.id)}
                      className="px-2 py-1 rounded-md bg-red-600 text-white text-sm hover:opacity-90"
                      title="Delete session"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default SessionStatsAndTasks;
