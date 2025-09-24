import { ArrowLeft, BookOpen, Calendar, CheckCircle2, Clock, Info, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import DeleteSessionModal from '@/modals/DeleteSessionModal';
import SessionDetailsModal from '@/modals/SessionDetailsModal';
import { deleteLap } from '@/store/LapActions';
import { formatDateShort } from '@/utils/dateUtils';
import { getMonthYear } from '@/hooks/useTimers';
import { toast } from 'react-toastify';
import { useAuth } from '@/hooks/useAuth';
import useDemoMode from '@/utils/useDemoMode';

type AppDispatch = any; // Replace with your actual AppDispatch type
interface RootState {
  laps: {
    laps: Lap[];
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

const StudySessions: React.FC = () => {
    const { laps } = useSelector((state: RootState) => state.laps);
    const dispatch = useDispatch<AppDispatch>();
    const { isLoggedIn } = useAuth();
    const { isDemo } = useDemoMode();
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [selectedSession, setSelectedSession] = useState<Lap | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [sessionToDeleteId, setSessionToDeleteId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
    
    const groupSessionsByMonth = (lapsList: Lap[]): GroupedLaps => {
        return lapsList.reduce<Record<string, Lap[]>>((groups, lap) => {
            const monthYear = getMonthYear(lap.created_at);
            if (!groups[monthYear]) {
                groups[monthYear] = [];
            }
            groups[monthYear].push(lap);
            return groups;
        }, {});
    };

    const handleDeleteClick = (sessionId: string) => {
        setSessionToDeleteId(sessionId);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (sessionToDeleteId) {
            try {
                await dispatch(deleteLap(sessionToDeleteId) as any);
                toast.success("Session deleted successfully");
            } catch (error: any) {
                console.error("Error deleting session:", error);
                toast.error(error?.message || "Failed to delete session");
            }
        }
        setIsDeleteModalOpen(false);
        setSessionToDeleteId(null);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSessionToDeleteId(null);
    };

    // Demo data: build months up to current month with sample sessions
    const buildDemoGroupedLaps = (): GroupedLaps => {
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
    const groupedLaps: GroupedLaps = isDemo ? buildDemoGroupedLaps() : groupSessionsByMonth(laps);

    // Define types for grouped laps
    interface GroupedLaps {
        [key: string]: Lap[];
    }

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
    const handleSessionContextMenu = (e: React.MouseEvent, lap: Lap): void => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            lap,
        });
    };

    // Close context menu
    useEffect(() => {
        if (!contextMenu) return;
        
        const handleClick = (): void => setContextMenu(null);
        const handleEsc = (e: KeyboardEvent): void => { 
            if (e.key === 'Escape') setContextMenu(null); 
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
            <div className="maincard p-3">
                <div className="flex justify-center items-center">
                    <div className="section-title">
                        <BookOpen size={22} className="icon" />
                        <span>Study Sessions</span>
                    </div>
                </div>
                <div className="text-center text-[var(--text-secondary)] py-8">
                    No sessions yet. Please log in first to start tracking your study sessions.
                </div>
            </div>
        );
    }
    if (!isDemo && laps.length === 0) {
        return (
            <div className="maincard p-3">
                <div className="flex justify-center items-center">
                    <div className="section-title">
                        <BookOpen size={22} className="icon" />
                        <span>Study Sessions</span>
                    </div>
                </div>
                <div className="text-center text-[var(--text-secondary)] py-8">
                    Create your first Study Sessions first!
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-[var(--bg-primary)]/90 border border-[var(--border-primary)] py-3 px-6 rounded-lg sticky z-50 backdrop-blur-sm flex flex-col ">

            {selectedMonth ? (
                // Vista detallada del mes seleccionado
                <div className="space-y-4">
                    <div className="flex items-center justify-center mb-4 relative">
                        <button
                            onClick={() => setSelectedMonth(null)}
                            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2 absolute left-0"
                        >
                            <ArrowLeft size={20}/>Back to Months
                        </button>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mx-auto">{selectedMonth}</h3>
                    </div>

                    <div className="w-full h-full overflow-auto px-2">
                        <div className="grid gap-x-4 gap-y-3 md:gap-x-3 md:gap-y-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 justify-center items-center w-full">
                            {selectedMonth && groupedLaps[selectedMonth]?.map((lap) => (
                                <div
                                    key={lap.id}
                                    className="stat-card bg-[var(--bg-secondary)] rounded-lg p-3 border-2 border-[var(--border-primary)] hover:border-[#444] dark:hover:border-[#444] transition-all duration-200 cursor-pointer w-full h-40 flex flex-col"
                                    onDoubleClick={() => setSelectedSession(lap)}
                                    onContextMenu={(e) => handleSessionContextMenu(e, lap)}
                                >
                                    {/* Session number and title */}
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="text-lg font-bold text-[var(--accent-primary)]">#{lap.session_number}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick(lap.id);
                                            }}
                                            className="text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Session name */}
                                    <h4 className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 mb-2">
                                        {lap.name || `Session ${lap.session_number}`}
                                    </h4>

                                    {/* Session details */}
                                    <div className="mt-auto space-y-1">
                                        <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                                            <Calendar size={12} />
                                            <span>{formatDateShort(lap.created_at)}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                                            <Clock size={12} />
                                            <span>{lap.duration}</span>
                                        </div>
                                        {lap.tasks_completed > 0 && (
                                            <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                                                <CheckCircle2 size={12} />
                                                <span>{lap.tasks_completed} task{lap.tasks_completed !== 1 ? 's' : ''}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                // Vista de tarjetas de meses
                <React.Fragment>
                    {(() => {
                        // Group months by year
                        interface YearGroup {
                            [year: string]: Array<{
                                month: string;
                                monthYear: string;
                                lapsOfMonth: Lap[];
                            }>;
                        }
                        
                        const monthsByYear: YearGroup = {};
                        // Sort and group months by year
                        Object.entries(groupedLaps)
                            .sort((a: [string, Lap[]], b: [string, Lap[]]) => {
                                const [aMonth, aYear] = a[0].split(' ');
                                const [bMonth, bYear] = b[0].split(' ');
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
                        // Ordenar los años descendente y los meses por orden natural
                        const orderedYears = Object.keys(monthsByYear).sort((a, b) => b - a);
                        const monthOrder = [
                            'January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'
                        ];
                        return orderedYears.map(year => (
                            <div key={year} className="mb-1">
                                <div className="border-b border-[var(--border-primary)] mb-4 pb-1 pl-1 text-lg font-bold text-[var(--text-primary)]">{year}:</div>
                                <div className="max-w-6xl mx-auto px-2">
                                    <div className="grid gap-x-4 gap-y-3 md:gap-x-3 md:gap-y-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 justify-center items-center w-full">
                                        {monthsByYear[year]
                                            .sort((a, b) => monthOrder.indexOf(b.month) - monthOrder.indexOf(a.month))
                                            .map(({ month, monthYear, lapsOfMonth }) => {
                                                const stats = getMonthStats(lapsOfMonth);
                                                return (
                                                    <div
                                                        key={monthYear}
                                                        className="stat-card bg-[var(--bg-secondary)] rounded-lg p-3 md:p-4 border-2 border-[var(--border-primary)] flex flex-col items-center text-center w-full min-h-[90px] cursor-pointer hover:border-[#444] dark:hover:border-[#444] transition-all duration-200"
                                                        onClick={() => setSelectedMonth(monthYear)}
                                                    >
                                                        <div className="flex flex-col items-center gap-2 mb-1 align-middle text-center">
                                                            <Calendar size={20} className="text-[var(--accent-primary)]" />
                                                            <span className="text-base font-bold text-[var(--text-primary)] truncate align-middle text-center">{month}</span>
                                                        </div>
                                                        <div className="mb-1 text-center">
                                                            <span className="text-base font-semibold text-[var(--text-primary)] leading-none align-middle">{stats.totalSessions}</span>
                                                            <span className="text-base font-semibold text-[var(--text-primary)] ml-2 align-middle">session{stats.totalSessions !== 1 ? 's' : ''}</span>
                                                        </div>
                                                        <div className="flex items-center justify-center gap-1 text-[var(--text-secondary)] text-base sm:text-lg text-center leading-none">
                                                            <Clock size={18} />
                                                            <span className="font-semibold text-[var(--text-primary)]">{formatMinutesToHHMM(stats.totalMinutes)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>
                        ));
                    })()}
                </React.Fragment>
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

            {/* Context Menu para sesión */}
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
    );
};

export default StudySessions; 