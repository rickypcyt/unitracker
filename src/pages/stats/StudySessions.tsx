import { ArrowLeft, BookOpen, Calendar, Clock, Info, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { formatDateShort } from '@/utils/dateUtils';
import { useDispatch, useSelector } from 'react-redux';

import DeleteSessionModal from '@/modals/DeleteSessionModal';
import SessionDetailsModal from '@/modals/SessionDetailsModal';
import { deleteLap } from '@/store/LapActions';
import { getMonthYear } from '@/hooks/useTimers';
import { toast } from 'react-toastify';
import { useAuth } from '@/hooks/useAuth';
import useDemoMode from '@/utils/useDemoMode';

const StudySessions = () => {
    const { laps } = useSelector((state) => state.laps);
    const dispatch = useDispatch();
    const { isLoggedIn } = useAuth();
    const { isDemo } = useDemoMode();
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [sessionToDeleteId, setSessionToDeleteId] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    const groupSessionsByMonth = () => {
        return laps.reduce((groups, lap) => {
            const monthYear = getMonthYear(lap.created_at);
            if (!groups[monthYear]) {
                groups[monthYear] = [];
            }
            groups[monthYear].push(lap);
            return groups;
        }, {});
    };

    const handleDeleteClick = (sessionId) => {
        setSessionToDeleteId(sessionId);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (sessionToDeleteId) {
            try {
                await dispatch(deleteLap(sessionToDeleteId));
                toast.success("Session deleted successfully");
            } catch (error) {
                console.error("Error deleting session:", error);
                toast.error(error.message || "Failed to delete session");
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
    const buildDemoGroupedLaps = () => {
        const months = [
            'January','February','March','April','May','June','July','August','September','October','November','December'
        ];
        const now = new Date();
        const year = now.getFullYear();
        const currentMonthIdx = now.getMonth();
        const out: Record<string, any[]> = {};
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
                });
            }
        }
        return out;
    };

    const groupedLaps = isDemo ? buildDemoGroupedLaps() : groupSessionsByMonth();

    // Calcular estadísticas por mes
    const getMonthStats = (lapsOfMonth) => {
        const totalSessions = lapsOfMonth.length;
        const totalMinutes = lapsOfMonth.reduce((acc, lap) => {
            const [h, m] = lap.duration.split(':');
            return acc + (parseInt(h) * 60 + parseInt(m));
        }, 0);
        const avgDuration = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

        return {
            totalSessions,
            totalMinutes,
            avgDuration
        };
    };

    const formatMinutesToHHMM = (minutes) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}:${m.toString().padStart(2, '0')}`;
    };

    // Handler para click derecho en sesión
    const handleSessionContextMenu = (e, lap) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            lap,
        });
    };

    // Cerrar menú contextual
    React.useEffect(() => {
        if (!contextMenu) return;
        const handleClick = () => setContextMenu(null);
        const handleEsc = (e) => { if (e.key === 'Escape') setContextMenu(null); };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleEsc);
        return () => {
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
        <div className="maincard">

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

                    <div className="max-w-6xl mx-auto px-2">
                        <div className="grid gap-x-4 gap-y-3 md:gap-x-3 md:gap-y-3 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 justify-center items-center">
                            {groupedLaps[selectedMonth]?.map((lap) => (
                                <div
                                    key={lap.id}
                                    className="stat-card bg-[var(--bg-secondary)] rounded-lg p-3 md:p-4 border-2 border-[var(--border-primary)] hover:border-[#444] dark:hover:border-[#444] transition-all duration-200 cursor-pointer relative w-full"
                                    onDoubleClick={() => setSelectedSession(lap)}
                                    onContextMenu={(e) => handleSessionContextMenu(e, lap)}
                                >
                                    {/* Duración arriba del título */}
                                    <div className="flex items-center gap-1 mb-1">
                                        <Clock size={18} className="text-[var(--text-secondary)]" />
                                        <span className="text-sm text-[var(--text-primary)] font-medium">{lap.duration}</span>
                                    </div>
                                    {/* Primera línea: #, título */}
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg text-[var(--accent-primary)] font-mono font-bold">#{lap.session_number}</span>
                                        <span className="text-base font-semibold text-[var(--text-primary)] truncate flex-1" title={lap.name}>{lap.name}</span>
                                    </div>
                                    {/* Footer: izquierda (fecha y tasks) en columna; derecha trash alineado con la última línea */}
                                    <div className="flex items-end justify-between mt-1">
                                        <div className="flex flex-col text-sm">
                                            <span className="text-[var(--text-secondary)] leading-tight">{formatDateShort(lap.created_at)}</span>
                                            <span className="text-[var(--text-secondary)] leading-tight">Tasks Done: {lap.tasks_completed ?? 0}</span>
                                        </div>
                                        <div className="ml-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(lap.id);
                                                }}
                                                className="text-red-500 hover:text-red-600 transition-colors duration-200"
                                                aria-label={`Delete session ${lap.name}`}
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
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
                        // Agrupar los meses por año
                        const monthsByYear = {};
                        Object.entries(groupedLaps).forEach(([monthYear, lapsOfMonth]) => {
                            const [month, year] = monthYear.split(' ');
                            if (!monthsByYear[year]) monthsByYear[year] = [];
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
                                    <div className="grid gap-x-4 gap-y-3 md:gap-x-3 md:gap-y-3 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 justify-center items-center">
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