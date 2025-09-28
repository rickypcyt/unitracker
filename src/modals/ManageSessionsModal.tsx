import { ArrowLeft, BookOpen, Calendar, CheckCircle2, Clock, Info, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import BaseModal from './BaseModal';
import DeleteSessionModal from '@/modals/DeleteSessionModal';
import SessionDetailsModal from '@/modals/SessionDetailsModal';
import { deleteLap, fetchLaps } from '@/store/LapActions';
import { formatDateShort } from '@/utils/dateUtils';
import { getMonthYear } from '@/hooks/useTimers';
import { toast } from 'react-toastify';
import { useAuth } from '@/hooks/useAuth';
import useDemoMode from '@/utils/useDemoMode';

type AppDispatch = any; // Replace with your actual AppDispatch type

interface GroupedLabs {
  [key: string]: Lap[];
}

interface RootState {
  laps: {
    laps: Lap[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
  };
}

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
  user_id: string;
  start_time: string;
  end_time: string;
  notes: string;
  created_at_ts: number;
  updated_at: string;
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
  const { laps, status } = useSelector((state: RootState) => state.laps);
  const dispatch = useDispatch<AppDispatch>();
  const { isLoggedIn } = useAuth();
  const { isDemo } = useDemoMode();

  // Fetch sessions when the modal opens
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      dispatch(fetchLaps());
    }
  }, [isOpen, isLoggedIn, dispatch]);

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Lap | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const groupSessionsByMonth = (lapsList: Lap[]): GroupedLabs => {
    return lapsList.reduce<Record<string, Lap[]>>((groups, lap) => {
      const monthYear = getMonthYear(lap.created_at);
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(lap);
      return groups;
    }, {});
  };

  const handleDeleteClick = useCallback((sessionId: string) => {
    setSessionToDelete(sessionId);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (sessionToDelete) {
      try {
        await dispatch(deleteLap(sessionToDelete));
        toast.success('Session deleted successfully');
      } catch (error) {
        toast.error('Failed to delete session');
        console.error('Error deleting session:', error);
      } finally {
        setIsDeleteModalOpen(false);
        setSessionToDelete(null);
      }
    }
  }, [dispatch, sessionToDelete]);

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
        } as Lap);
      }
    }
    return out;
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

  const formatMinutesToHHMM = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
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
      <BaseModal isOpen={isOpen} onClose={onClose} title="Manage Sessions" maxWidth="max-w-6xl">
        <div className="p-6 text-center text-[var(--text-secondary)]">
          No sessions yet. Please log in first to start tracking your study sessions.
        </div>
      </BaseModal>
    );
  }

  // If not in demo mode and no sessions, show empty state
  if (!isDemo && status === 'succeeded' && laps.length === 0) {
    return (
      <BaseModal isOpen={isOpen} onClose={onClose} title="Manage Sessions" maxWidth="max-w-6xl">
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
      </BaseModal>
    );
  }

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Manage Sessions"
        maxWidth="max-w-6xl"
        className="!p-0"
      >
        <div className="w-full h-full bg-[var(--bg-primary)] py-6 px-6 pt-0 flex flex-col max-h-[80vh] overflow-hidden">
          {selectedMonth ? (
            // Month detail view
            <div className="space-y-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setSelectedMonth(null)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={20} className="-ml-1" /> Back to All Sessions
                </button>
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">{selectedMonth}</h3>
                <div className="w-8"></div> {/* Spacer for alignment */}
              </div>

              <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                  {selectedMonth && groupedLaps[selectedMonth]?.map((lap) => (
                    <div
                      key={lap.id}
                      className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-all duration-200 cursor-pointer flex flex-col h-full"
                      onClick={() => setSelectedSession(lap)}
                      onContextMenu={(e) => handleSessionContextMenu(e, lap)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)/10] flex items-center justify-center">
                            <BookOpen size={16} className="text-[var(--accent-primary)]" />
                          </div>
                          <span className="text-sm font-medium text-[var(--accent-primary)] bg-[var(--accent-primary)/10] px-2 py-0.5 rounded-full">
                            Session #{lap.session_number}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(lap.id);
                          }}
                          className="text-[var(--text-secondary)] hover:text-red-500 transition-colors p-1 -m-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <h4 className="text-base font-semibold text-[var(--text-primary)] mb-3 line-clamp-2">
                        {lap.name || `Study Session ${lap.session_number}`}
                      </h4>

                      <div className="mt-auto space-y-2.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                            <Calendar size={14} className="text-[var(--text-secondary)] opacity-70" />
                            <span>{formatDateShort(lap.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                            <Clock size={14} className="text-[var(--text-secondary)] opacity-70" />
                            <span className="font-medium">{lap.duration}</span>
                          </div>
                        </div>
                        
                        {lap.tasks_completed > 0 && (
                          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-primary)] py-1.5 px-3 rounded-lg">
                            <CheckCircle2 size={14} className="text-green-500" />
                            <span>Completed {lap.tasks_completed} task{lap.tasks_completed !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Months overview
            <div className="space-y-8 overflow-y-auto max-h-[calc(80vh-2rem)] pr-2 -mr-2">
              {(() => {
                // Group months by year
                const monthsByYear: Record<string, Array<{
                  month: string;
                  monthYear: string;
                  lapsOfMonth: Lap[];
                }>> = {};

                // Sort and group months by year
                Object.entries(groupedLaps)
                  .sort(([aMonthYear], [bMonthYear]) => {
                    const [aMonth, aYear] = aMonthYear.split(' ');
                    const [bMonth, bYear] = bMonthYear.split(' ');
                    const aDate = new Date(`${aMonth} 1, ${aYear}`);
                    const bDate = new Date(`${bMonth} 1, ${bYear}`);
                    return bDate.getTime() - aDate.getTime();
                  })
                  .forEach(([monthYear, lapsOfMonth]) => {
                    const [month, year] = monthYear.split(' ');
                    if (!monthsByYear[year]) {
                      monthsByYear[year] = [];
                    }
                    monthsByYear[year].push({ month, monthYear, lapsOfMonth });
                  });

                const monthOrder = [
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ];

                return Object.entries(monthsByYear)
                  .sort(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA))
                  .map(([year, months]) => (
                    <div key={year} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-px bg-[var(--border-primary)] flex-1"></div>
                        <h2 className="text-lg font-semibold text-[var(--text-secondary)] whitespace-nowrap px-2">{year}</h2>
                        <div className="h-px bg-[var(--border-primary)] flex-1"></div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {months
                          .sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month))
                          .map(({ month, monthYear, lapsOfMonth }) => {
                            const stats = getMonthStats(lapsOfMonth);
                            const totalHours = Math.floor(stats.totalMinutes / 60);
                            const totalMins = stats.totalMinutes % 60;
                            
                            return (
                              <div
                                key={monthYear}
                                className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-all duration-200 cursor-pointer group"
                                onClick={() => setSelectedMonth(monthYear)}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">{month}</h3>
                                  <div className="flex items-center gap-1.5 bg-[var(--accent-primary)/10] text-[var(--accent-primary)] text-xs font-medium px-2 py-1 rounded-full">
                                    <BookOpen size={12} />
                                    <span>{lapsOfMonth.length} {lapsOfMonth.length === 1 ? 'session' : 'sessions'}</span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-[var(--text-secondary)]">Total Time</span>
                                    <div className="flex items-center gap-1">
                                      <Clock size={14} className="text-[var(--accent-primary)]" />
                                      <span className="font-mono font-medium">
                                        {totalHours > 0 ? `${totalHours}h ` : ''}{totalMins}m
                                      </span>
                                    </div>
                                  </div>
                                  <div className="h-px bg-[var(--border-primary)] my-2"></div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-[var(--text-secondary)]">Avg. Session</span>
                                    <span className="font-medium">{stats.avgDuration}m</span>
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-[var(--border-primary)]">
                                  <div className="text-xs text-[var(--text-secondary)] flex items-center justify-between">
                                    <span>View all sessions</span>
                                    <ArrowLeft size={14} className="transform rotate-180 group-hover:translate-x-0.5 transition-transform" />
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
          )}

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
      </BaseModal>
    </>
  );
};

export default ManageSessionsModal;
