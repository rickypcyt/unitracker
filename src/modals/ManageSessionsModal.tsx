import { ArrowLeft, BookOpen, Calendar, CheckCircle2, Clock, Info, Trash2, X, Zap } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { deleteLap, forceLapRefresh } from '@/store/LapActions';

import BaseModal from './BaseModal';
import DeleteSessionModal from '@/modals/DeleteSessionModal';
import SessionDetailsModal from '@/modals/SessionDetailsModal';
import { formatDateShort } from '@/utils/dateUtils';
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
  const { laps, loading: status } = useLaps();
  const { isLoggedIn } = useAuth();
  const { isDemo } = useDemoMode();

  // Fetch sessions when the modal opens
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      forceLapRefresh();
    }
  }, [isOpen, isLoggedIn]);

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

  // Grouped sessions by time period
interface GroupedSessions {
  today: Lap[];
  thisWeek: Lap[];
  lastWeek: Lap[];
  olderThisMonth: Lap[];
}

const groupSessionsByTimePeriod = (lapsList: Lap[], referenceMonthYear?: string): GroupedSessions => {
  // Determine the reference date (end of the selected month) to build the buckets
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
      // Set to last day of the reference month
      refDate = new Date(refYear, refMonthIndex + 1, 0);
    } catch (e) {
      // Fallback to current date if parsing fails
      refDate = new Date();
    }
  }

  const today = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());

  // Start of the reference week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  // Start and end of last week relative to reference week
  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfWeek.getDate() - 7);

  const endOfLastWeek = new Date(startOfWeek);
  endOfLastWeek.setDate(startOfWeek.getDate() - 1);

  // Start of the reference month
  const startOfMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1);

  const grouped: GroupedSessions = {
    today: [],
    thisWeek: [],
    lastWeek: [],
    olderThisMonth: []
  };
  
  // Sort sessions by date (most recent first)
  const sortedLaps = [...lapsList].sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return dateB.getTime() - dateA.getTime();
  });
  
  sortedLaps.forEach(lap => {
    const lapDate = new Date(lap.created_at);
    const lapDateOnly = new Date(lapDate.getFullYear(), lapDate.getMonth(), lapDate.getDate());
    
    if (lapDateOnly.getTime() === today.getTime()) {
      grouped.today.push(lap);
    } else if (lapDateOnly >= startOfWeek && lapDateOnly < today) {
      grouped.thisWeek.push(lap);
    } else if (lapDateOnly >= startOfLastWeek && lapDateOnly <= endOfLastWeek) {
      grouped.lastWeek.push(lap);
    } else if (lapDateOnly >= startOfMonth && lapDateOnly < startOfLastWeek) {
      grouped.olderThisMonth.push(lap);
    }
  });
  
  return grouped;
};

  // Group laps by month with proper type
  const groupedLaps: GroupedLabs = isDemo ? buildDemoGroupedLaps() : groupSessionsByMonth(laps);


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
  if (!isDemo && !status && laps.length === 0) {
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
                  const timeGroupedSessions = groupSessionsByTimePeriod(
                    selectedMonth && groupedLaps[selectedMonth] ? groupedLaps[selectedMonth] : [],
                    selectedMonth || undefined
                  );
                  
                  const sections = [
                    { key: 'today', title: 'Today', sessions: timeGroupedSessions.today },
                    { key: 'thisWeek', title: 'This Week', sessions: timeGroupedSessions.thisWeek },
                    { key: 'lastWeek', title: 'Last Week', sessions: timeGroupedSessions.lastWeek },
                    { key: 'olderThisMonth', title: 'Earlier This Month', sessions: timeGroupedSessions.olderThisMonth }
                  ];
                  
                  return (
                    <div className="space-y-8 pb-6">
                      {sections.map(section => (
                        section.sessions.length > 0 && (
                          <div key={section.key}>
                            <div className="flex items-center gap-3 mb-4">
                              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                                {section.title}
                              </h3>
                              <span className="text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-1 rounded-full">
                                {section.sessions.length} {section.sessions.length === 1 ? 'session' : 'sessions'}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {section.sessions.map((lap) => (
                                <div
                                  key={lap.id}
                                  className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:shadow-md transition-all duration-300 cursor-pointer rounded-lg p-4 flex items-center gap-4"
                                  onClick={() => setSelectedSession(lap)}
                                  onContextMenu={(e) => handleSessionContextMenu(e, lap)}
                                >
                                  <span className="text-sm font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)/10] px-3 py-2 rounded-full whitespace-nowrap">
                                    #{lap.session_number}
                                  </span>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="text-lg font-bold text-[var(--text-primary)] truncate">
                                        {lap.name || `Study Session ${lap.session_number}`}
                                      </h4>
                                      {lap.subject_name && (
                                        <div className="flex items-center gap-1">
                                          <div 
                                            className="w-3 h-3 rounded-full border border-white/50"
                                            style={{ backgroundColor: lap.subject_color || '#9CA3AF' }}
                                          />
                                          <span className="text-xs text-[var(--text-secondary)] font-medium">
                                            {lap.subject_name || 'No assignment'}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-6 text-sm">
                                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                        <Calendar size={16} className="text-[var(--accent-primary)]" />
                                        <span className="font-medium">{formatDateShort(lap.created_at)}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Clock size={16} className="text-[var(--accent-primary)]" />
                                        <span className="font-bold text-[var(--text-primary)] font-mono">{lap.duration}</span>
                                      </div>
                                      {'pomodoros_completed' in lap && typeof lap.pomodoros_completed === 'number' && lap.pomodoros_completed > 0 && (
                                        <div className="flex items-center gap-2 text-orange-600">

                                          <span className="font-semibold text-orange-600 dark:text-orange-400">
                                            {lap.pomodoros_completed} pomodoro{lap.pomodoros_completed !== 1 ? 's' : ''}
                                          </span>
                                        </div>
                                      )}
                                      {lap.tasks_completed > 0 && (
                                        <div className="flex items-center gap-2 text-green-600">
                                          <CheckCircle2 size={16} className="text-green-500" />
                                          <span className="font-semibold text-green-600 dark:text-green-400">
                                            {lap.tasks_completed} task{lap.tasks_completed !== 1 ? 's' : ''}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClick(lap.id);
                                    }}
                                    className="text-[var(--text-secondary)] hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                      
                      {sections.every(section => section.sessions.length === 0) && (
                        <div className="text-center py-12">
                          <div className="mx-auto w-16 h-16 bg-[var(--accent-primary)/10] rounded-full flex items-center justify-center mb-4">
                            <BookOpen size={24} className="text-[var(--accent-primary)]" />
                          </div>
                          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No sessions this month</h3>
                          <p className="text-[var(--text-secondary)]">
                            Start a new study session to see your progress here.
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
