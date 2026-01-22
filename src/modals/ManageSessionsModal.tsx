import { ArrowLeft, BookOpen, Calendar, CheckCircle2, Clock, Info, Trash2, X, Zap } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { deleteLap, forceLapRefresh } from '@/store/LapActions';

import BaseModal from './BaseModal';
import DeleteSessionModal from '@/modals/DeleteSessionModal';
import SessionDetailsModal from '@/modals/SessionDetailsModal';
import { getMonthYear } from '@/hooks/useTimers';
import { toast } from 'react-toastify';
import { useAuth } from '@/hooks/useAuth';
import useDemoMode from '@/utils/useDemoMode';
import { useLaps } from '@/store/appStore';

// Lap interface defined locally until we create a types file
interface Lap {
  id: string;
  created_at: string;
  duration: string;
  session_number: number;
  name: string;
  tasks_completed: number;
  type: string;
  subject_id: string;
  subject_name: string;
  subject_color: string;
};

interface GroupedLabs {
  [key: string]: Lap[];
}

interface MonthData {
  month: string;
  monthYear: string;
  lapsOfMonth: Lap[];
  timestamp: number;
}

interface ContextMenu {
  x: number;
  y: number;
  lap: Lap;
}

interface ManageSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageSessionsModal: React.FC<ManageSessionsModalProps> = ({ isOpen, onClose }) => {
  const { laps: lapsData, loading: status, isCached } = useLaps();
  const { isLoggedIn } = useAuth();
  const { isDemo } = useDemoMode();

  // Fetch sessions when the modal opens (only if needed)
  useEffect(() => {
    if (isOpen && isLoggedIn && !isCached) {
      forceLapRefresh();
    }
  }, [isOpen, isLoggedIn, isCached]);

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Lap | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const groupSessionsByMonth = (lapsList: Lap[]): GroupedLabs => {
    // Ordenar por fecha (más recientes primero) - usar created_at como en StudySessions
    const sortedLaps = [...lapsList].sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB.getTime() - dateA.getTime();
    });

    // Agrupar por mes y año - misma lógica que StudySessions
    const grouped = sortedLaps.reduce<Record<string, Lap[]>>((groups, lap) => {
      const monthYear = getMonthYear(lap.created_at);
      
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(lap);
      return groups;
    }, {});

    // Ordenar los meses (más recientes primero)
    return Object.entries(grouped)
      .sort(([aMonthYear], [bMonthYear]) => {
        const aDate = new Date(aMonthYear);
        const bDate = new Date(bMonthYear);
        return bDate.getTime() - aDate.getTime();
      })
      .reduce((acc, [monthYear, sessions]) => {
        acc[monthYear] = sessions;
        return acc;
      }, {} as Record<string, Lap[]>);
  };

  const handleDeleteClick = useCallback((sessionId: string) => {
    setSessionToDelete(sessionId);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (sessionToDelete) {
      console.log('[DEBUG] Confirmando eliminación de sesión, ID:', sessionToDelete);
      try {
        console.log('[DEBUG] Llamando a deleteLap...');
        const result = await deleteLap(sessionToDelete);
        console.log('[DEBUG] Resultado de deleteLap:', result);
        
        // Force a refresh of the laps data
        console.log('[DEBUG] Actualizando lista de sesiones...');
        const refreshResult = await forceLapRefresh();
        console.log('[DEBUG] Resultado de forceLapRefresh:', refreshResult);
        
        toast.success('Session deleted successfully');
      } catch (error) {
        toast.error('Failed to delete session');
        console.error('Error deleting session:', error);
      } finally {
        setIsDeleteModalOpen(false);
        setSessionToDelete(null);
      }
    }
  }, [sessionToDelete]);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setSessionToDelete(null);
  }, []);

  // Demo data: build months up to current month with sample sessions
  const buildDemoGroupedLaps = (): GroupedLabs => {
    const months = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ];
    const now = new Date();
    const year = now.getFullYear();
    const currentMonthIdx = now.getMonth();
    const out: Record<string, Lap[]> = {};
    let sessionCounter = 1;
    for (let m = 0; m <= currentMonthIdx; m++) {
      const monthName = months[m];
      const key = `${monthName} ${year}`;
      const sessionsThisMonth = 6 + ((m * 3) % 5); // 6..10 aprox
      out[key] = [];
      for (let i = 0; i < sessionsThisMonth; i++) {
        const day = 1 + ((i * 3) % 26);
        const date = new Date(year, m, day, 12, 0, 0);
        const durMin = 30 + ((i * 15 + m * 10) % 90); // 30..120
        const h = Math.floor(durMin / 60).toString().padStart(2, '0');
        const mm = (durMin % 60).toString().padStart(2, '0');
        out[key].push({
          id: `demo-${year}-${m + 1}-${i + 1}`,
          created_at: date.toISOString(),
          duration: `${h}:${mm}`,
          session_number: sessionCounter++,
          name: `Demo Study Session ${i + 1}`,
          tasks_completed: (i % 3) + 1,
          type: 'study',
          subject_id: '',
          subject_name: '',
          subject_color: '',
          user_id: '',
          start_time: date.toISOString(),
          end_time: new Date(date.getTime() + durMin * 60000).toISOString(),
          notes: '',
          created_at_ts: date.getTime(),
          updated_at: date.toISOString(),
        } as unknown as Lap);
      }
    }
    return out;
  };

  // Weekly grouping with days
interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  sessions: Lap[];
  isToday?: boolean;
}

interface WeekData {
  weekNumber: number;
  weekName: string;
  days: WeekDay[];
  totalSessions: number;
}

const sortDaysByCurrentFirst = (days: WeekDay[]): WeekDay[] => {
  return days
    .filter(day => day.sessions.length > 0)
    .sort((a, b) => {
      // Current day first
      if (a.isToday) return -1;
      if (b.isToday) return 1;
      // Then by date (newest first)
      return b.date.getTime() - a.date.getTime();
    });
};

const groupSessionsByWeeks = (lapsList: Lap[], referenceMonthYear?: string): WeekData[] => {
  // Determine reference month and year
  let refDate = new Date();
  if (referenceMonthYear) {
    try {
      const parts = referenceMonthYear.split(' ');
      const refMonthName = parts[0];
      const refYearStr = parts[1];
      if (!refMonthName || !refYearStr) throw new Error('Invalid monthYear format');
      const refYear = parseInt(refYearStr, 10);
      if (Number.isNaN(refYear)) throw new Error('Invalid year');
      const parsed = Date.parse(`${refMonthName} 1, ${refYear}`);
      if (Number.isNaN(parsed)) throw new Error('Invalid month name');
      const refMonthIndex = new Date(parsed).getMonth();
      refDate = new Date(refYear, refMonthIndex, 1);
    } catch (e) {
      refDate = new Date();
    }
  }

  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  
  // Get first day of month
  const firstDay = new Date(year, month, 1);
  
  // Get the first Sunday of the month (start of first week)
  const firstSunday = new Date(firstDay);
  firstSunday.setDate(firstDay.getDate() - firstDay.getDay());
  
  const weeks: WeekData[] = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  
  // Generate 4 weeks
  for (let weekNum = 1; weekNum <= 4; weekNum++) {
    const weekStart = new Date(firstSunday);
    weekStart.setDate(firstSunday.getDate() + (weekNum - 1) * 7);
    
    const days: WeekDay[] = [];
    let weekSessionCount = 0;
    
    // Generate 7 days for each week
    for (let dayNum = 0; dayNum < 7; dayNum++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + dayNum);
      
      // Only include days that are within the current month
      if (currentDate.getMonth() === month && currentDate.getFullYear() === year) {
        const daySessions = lapsList.filter(lap => {
          const lapDate = new Date(lap.created_at);
          return lapDate.toDateString() === currentDate.toDateString();
        }).reverse();
        
        const isToday = currentDate.toDateString() === today.toDateString();
        
        days.push({
          date: currentDate,
          dayName: dayNames[dayNum] || 'Unknown',
          dayNumber: currentDate.getDate(),
          sessions: daySessions,
          isToday,
        });
        
        weekSessionCount += daySessions.length;
      }
    }
    
    if (days.length > 0 && weekSessionCount > 0) {
      weeks.push({
        weekNumber: weekNum,
        weekName: `Week ${weekNum}`,
        days,
        totalSessions: weekSessionCount
      });
    }
  }
  
  return weeks.reverse();
};

  // Group laps by month with proper type - memoized for performance
const groupedLaps: GroupedLabs = useMemo(() => {
  return isDemo ? buildDemoGroupedLaps() : groupSessionsByMonth(lapsData);
}, [isDemo, lapsData]);

// Calculate statistics for a month
interface MonthStats {
  totalSessions: number;
  totalMinutes: number;
  avgDuration: number;
}

const getMonthStats = (lapsOfMonth: Lap[]): MonthStats => {
  const getTotalMinutes = (duration: string): number => {
    const [h, m] = duration.split(':');
    return (parseInt(h || '0', 10) * 60) + parseInt(m || '0', 10);
  };

  const totalSessions = lapsOfMonth.length;
  const totalMinutes = lapsOfMonth.reduce((acc: number, lap: Lap) => {
    return acc + getTotalMinutes(lap.duration);
  }, 0);
  const avgDuration = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

  return {
    totalSessions,
    totalMinutes,
    avgDuration
  };
};

  
  // Right-click handler for session
  const handleSessionContextMenu = useCallback((e: React.MouseEvent, lap: Lap): void => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX - 2,
      y: e.clientY - 4,
      lap,
    });
  }, []);

  // Close context menu
  useEffect(() => {
    if (!contextMenu) return;

    const handleClick = (): void => {
      setContextMenu(null);
    };

    const handleEsc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);

    return (): void => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [contextMenu]);

  if (!isLoggedIn && !isDemo) {
    return (
      <BaseModal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="" 
        maxWidth="max-w-6xl" 
        className="!p-0"
        showHeader={false}
      >
        <div className="p-4">
          <div className="relative flex items-center justify-center mb-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Manage Sessions
            </h2>
            <button
              onClick={onClose}
              className="absolute right-0 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
          <div className="p-6 text-center text-[var(--text-secondary)]">
            No sessions yet. Please log in first to start tracking your study sessions.
          </div>
        </div>
      </BaseModal>
    );
  }

  // If not in demo mode and no sessions, show empty state
  if (!isDemo && !status && lapsData.length === 0) {
    return (
      <BaseModal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="" 
        maxWidth="max-w-6xl" 
        className="!p-0"
        showHeader={false}
      >
        <div className="p-4">
          <div className="relative flex items-center justify-center mb-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Manage Sessions
            </h2>
            <button
              onClick={onClose}
              className="absolute right-0 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-[var(--accent-primary)/10] rounded-full flex items-center justify-center mb-4">
              <BookOpen size={24} className="text-[var(--accent-primary)]" />
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No study sessions yet</h3>
            <p className="text-[var(--text-secondary)] mb-6">
              Start a new study session to see your progress here.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary-hover)] transition-colors"
            >
              Start Studying
            </button>
          </div>
        </div>
      </BaseModal>
    );
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="max-w-6xl"
      className="!p-0"
      showHeader={false}
    >
      <div className="w-full h-full bg-[var(--bg-primary)] flex flex-col">
        <div className="p-4 flex-shrink-0">
          <div className="relative flex items-center justify-center mb-6">
            {selectedMonth ? (
              <button
                onClick={() => setSelectedMonth(null)}
                className="absolute left-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={20} className="-ml-1" /> Back to All Sessions
              </button>
            ) : null}
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {selectedMonth ? selectedMonth : 'Manage Sessions'}
            </h2>
            <button
              onClick={onClose}
              className="absolute right-0 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 min-h-0">
            {selectedMonth ? (
              // Month detail view
              <div className="flex-1 overflow-y-auto px-6">
                {(() => {
                  const monthLaps = selectedMonth && groupedLaps[selectedMonth] ? groupedLaps[selectedMonth] : [];
                  const monthStats = getMonthStats(monthLaps);
                  const weeksData = groupSessionsByWeeks(monthLaps, selectedMonth || undefined);
                  
                  const totalHours = Math.floor(monthStats.totalMinutes / 60);
                  const totalMins = monthStats.totalMinutes % 60;
                  
                  return (
                    <div className="space-y-6 pb-6">
                      {/* Month Statistics Header */}
                      <div className="bg-gradient-to-r from-[var(--accent-primary)/10] to-[var(--accent-primary)/5]  rounded-2xl mb-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-[var(--bg-primary)] rounded-xl p-4 border border-[var(--border-primary)]">
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen size={16} className="text-[var(--accent-primary)]" />
                              <span className="text-sm text-[var(--text-secondary)] font-medium">Sessions</span>
                            </div>
                            <p className="text-2xl font-bold text-[var(--text-primary)]">{monthStats.totalSessions}</p>
                          </div>
                          
                          <div className="bg-[var(--bg-primary)] rounded-xl p-4 border border-[var(--border-primary)]">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock size={16} className="text-[var(--accent-primary)]" />
                              <span className="text-sm text-[var(--text-secondary)] font-medium">Total Time</span>
                            </div>
                            <p className="text-2xl font-bold text-[var(--text-primary)]">
                              {totalHours > 0 ? `${totalHours}h ` : ''}{totalMins}m
                            </p>
                          </div>
                          
                          <div className="bg-[var(--bg-primary)] rounded-xl p-4 border border-[var(--border-primary)]">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap size={16} className="text-[var(--accent-primary)]" />
                              <span className="text-sm text-[var(--text-secondary)] font-medium">Avg Duration</span>
                            </div>
                            <p className="text-2xl font-bold text-[var(--text-primary)]">{monthStats.avgDuration}m</p>
                          </div>
                          
                          <div className="bg-[var(--bg-primary)] rounded-xl p-4 border border-[var(--border-primary)]">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar size={16} className="text-[var(--accent-primary)]" />
                              <span className="text-sm text-[var(--text-secondary)] font-medium">Days Active</span>
                            </div>
                            <p className="text-2xl font-bold text-[var(--text-primary)]">
                              {new Set(monthLaps.map(lap => new Date(lap.created_at).toDateString())).size}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Weeks View */}
                      {weeksData.length > 0 ? (
                        <div className="space-y-6">
                          {weeksData.map((week) => (
                            <div key={week.weekNumber} className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-primary)]">
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-8 bg-[var(--accent-primary)] rounded-full"></div>
                                  <h3 className="text-xl font-bold text-[var(--text-primary)]">
                                    {week.weekName}
                                  </h3>
                                </div>
                                <span className="text-sm text-[var(--text-secondary)] bg-[var(--bg-primary)] px-3 py-1.5 rounded-full border border-[var(--border-primary)] font-medium">
                                  {week.totalSessions} {week.totalSessions === 1 ? 'session' : 'sessions'}
                                </span>
                              </div>
                              
                              <div className="space-y-4">
                                {sortDaysByCurrentFirst(week.days).map((day, dayIndex) => (
                                  <div key={dayIndex} className={`bg-[var(--bg-primary)] rounded-lg p-3 border ${day.isToday ? 'border-[var(--accent-primary)] border-2' : 'border-[var(--border-primary)]'}`}>
                                    <div className="flex items-center gap-3">
                                      <div className="text-center min-w-[60px]">
                                        <div className="text-xs text-[var(--text-secondary)] font-medium mb-1">
                                          {day.dayName.substring(0, 3).toUpperCase()}
                                        </div>
                                        <div className="text-base font-bold text-[var(--text-primary)]">
                                          {day.dayNumber}
                                        </div>
                                      </div>
                                      
                                      <div className="flex-1 space-y-2">
                                        {day.sessions.map((lap, sessionIndex) => (
                                          <div
                                            key={lap.id}
                                            className="bg-[var(--accent-primary)/10] border border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:shadow-md transition-all duration-0 cursor-pointer rounded-lg p-2 group relative overflow-hidden"
                                            onClick={() => setSelectedSession(lap)}
                                            onContextMenu={(e) => handleSessionContextMenu(e, lap)}
                                            style={{
                                              animationDelay: `${dayIndex * 50 + sessionIndex * 25}ms`
                                            }}
                                          >
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-[var(--accent-primary)]">
                                                  #{lap.session_number}
                                                </span>
                                                <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                                                  {lap.name || `Session ${lap.session_number}`}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm text-[var(--text-secondary)] font-mono">
                                                  {lap.duration}
                                                </span>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(lap.id);
                                                  }}
                                                  className="text-[var(--text-secondary)] hover:text-red-500 transition-colors p-1 rounded opacity-0 group-hover:opacity-100"
                                                >
                                                  <Trash2 size={12} />
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)]">
                          <div className="mx-auto w-20 h-20 bg-[var(--accent-primary)/10] rounded-full flex items-center justify-center mb-6">
                            <BookOpen size={32} className="text-[var(--accent-primary)]" />
                          </div>
                          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">No sessions this month</h3>
                          <p className="text-[var(--text-secondary)] max-w-md mx-auto">
                            Start a new study session to see your progress here. Keep tracking your study habits to build your learning streak!
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Months overview with scrollable content */
              <div className="h-full overflow-y-auto px-6 py-4">
                <div className="space-y-8">
                {(() => {
                  // Group months by year
                  const monthsByYear: Record<string, MonthData[]> = {};

                  // First, convert the groupedLaps entries to an array and sort them by date
                  const sortedEntries = Object.entries(groupedLaps).sort(([aMonthYear], [bMonthYear]) => {
                    // Parse the month and year from the formatted string
                    const parseDate = (monthYear: string) => {
                      const [month, year] = monthYear.split(' ');
                      return new Date(Date.parse(`${month} 1, ${year}`));
                    };
                    
                    try {
                      const aDate = parseDate(aMonthYear);
                      const bDate = parseDate(bMonthYear);
                      return bDate.getTime() - aDate.getTime();
                    } catch (error) {
                      console.error('Error parsing dates for sorting:', { aMonthYear, bMonthYear, error });
                      return 0;
                    }
                  });

                  // Group the sorted entries by year
                  sortedEntries.forEach(([monthYear, lapsOfMonth]) => {
                    const yearParts = monthYear.split(' ')[1];
                    const monthParts = monthYear.split(' ')[0];
                    const year = yearParts || '2024'; // Default fallback
                    const month = monthParts || 'January'; // Default fallback
                    
                    if (!monthsByYear[year]) {
                      monthsByYear[year] = [];
                    }
                    
                    monthsByYear[year].push({ 
                      month, 
                      monthYear, 
                      lapsOfMonth,
                      // Add a timestamp for consistent sorting
                      timestamp: new Date(Date.parse(`${month} 1, ${year}`)).getTime()
                    });
                  });

                  // Define the order of months for display
                  const monthOrder = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ] as const;

                  return Object.entries(monthsByYear)
                    .sort(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA))
                    .map(([year, months]) => (
                      <div key={year} className="space-y-4">
                        <div className="w-full flex justify-center mb-4">
                          <h2 className="text-xl font-bold text-[var(--text-primary)] bg-[var(--bg-secondary)] px-6 py-2 rounded-full border border-[var(--border-primary)]">
                            {year}
                          </h2>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {months
                            .sort((a, b) => monthOrder.indexOf(b.month as any) - monthOrder.indexOf(a.month as any))
                            .map(({ month, monthYear, lapsOfMonth }) => {
                              const stats = getMonthStats(lapsOfMonth);
                              const totalHours = Math.floor(stats.totalMinutes / 60);
                              const totalMins = stats.totalMinutes % 60;
                              
                              return (
                                <div
                                  key={monthYear}
                                  className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)] rounded-xl p-5 border border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden"
                                  onClick={() => setSelectedMonth(monthYear)}
                                >
                                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[var(--accent-primary)/20] to-transparent rounded-bl-full opacity-50"></div>
                                  <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                      <h3 className="text-lg font-bold text-[var(--text-primary)]">{month}</h3>
                                      <div className="flex items-center gap-2 bg-[var(--accent-primary)/10] text-[var(--accent-primary)] text-sm font-semibold px-3 py-1.5 rounded-full  ">
                                        <BookOpen size={16} />
                                        <span>{lapsOfMonth.length} {lapsOfMonth.length === 1 ? 'session' : 'sessions'}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-[var(--text-secondary)] font-medium">Total Time</span>
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 bg-[var(--accent-primary)/10] rounded-lg flex items-center justify-center">
                                            <Clock size={16} className="text-[var(--accent-primary)]" />
                                          </div>
                                          <span className="font-mono font-bold text-[var(--text-primary)]">
                                            {totalHours > 0 ? `${totalHours}h ` : ''}{totalMins}m
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-[var(--text-secondary)] font-medium">Avg. Session</span>
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 bg-[var(--bg-primary)] rounded flex items-center justify-center">
                                            <Zap size={14} className="text-[var(--accent-primary)]" />
                                          </div>
                                          <span className="font-bold text-[var(--text-primary)]">{stats.avgDuration}m</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ));
                })()}
                </div>
              </div>
            )}
          </div>

          {selectedSession && (
            <SessionDetailsModal
              session={selectedSession}
              onClose={() => setSelectedSession(null)}
            />
          )}

          <DeleteSessionModal
            isOpen={isDeleteModalOpen}
            onClose={handleCloseDeleteModal}
            onConfirm={handleConfirmDelete}
          />

          {contextMenu && (
            <div
              className="fixed bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-lg shadow-lg p-2 flex flex-col min-w-[160px]"
              style={{
                position: 'fixed',
                left: contextMenu.x,
                top: contextMenu.y,
                zIndex: 9999,
                backgroundColor: 'var(--bg-primary)',
                border: '2px solid var(--border-primary)',
                borderRadius: '0.75rem',
                padding: '0.75rem 0.5rem',
                boxShadow: '0 8px 32px 0 rgba(0,0,0,0.25), 0 1.5px 6px 0 rgba(30,144,255,0.10)',
                minWidth: '220px',
                color: 'var(--text-primary)',
              }}
            >
              <button
                onClick={() => {
                  setSelectedSession(contextMenu.lap);
                  setContextMenu(null);
                }}
                className="w-full px-2 py-2 text-center text-base text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md flex items-center gap-2 transition-colors"
              >
                <Info size={16} /> Edit Session
              </button>
              <button
                onClick={() => {
                  handleDeleteClick(contextMenu.lap.id);
                  setContextMenu(null);
                }}
                className="w-full px-2 py-2 text-center text-base text-red-500 hover:bg-[var(--bg-secondary)] rounded-md flex items-center gap-2 transition-colors"
              >
                <Trash2 size={16} /> Delete Session
              </button>
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
};

export default ManageSessionsModal;
