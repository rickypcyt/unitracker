import { ArrowLeft, BookOpen, Calendar, CheckSquare, Clock, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { formatDateShort, formatDateTimeWithAmPm } from '@/utils/dateUtils';
import { useDispatch, useSelector } from 'react-redux';

import DeleteSessionModal from '@/modals/DeleteSessionModal';
import SessionDetailsModal from '@/modals/SessionDetailsModal';
import { deleteLap } from '@/store/LapActions';
import { getMonthYear } from '@/hooks/useTimers';
import moment from 'moment';
import { toast } from 'react-toastify';
import { useAuth } from '@/hooks/useAuth';

const StudySessions = () => {
    const { laps } = useSelector((state) => state.laps);
    const dispatch = useDispatch();
    const { isLoggedIn } = useAuth();
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [sessionToDeleteId, setSessionToDeleteId] = useState(null);

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

    const groupedLaps = groupSessionsByMonth();

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

    if (!isLoggedIn) {
        return (
            <div className="maincard">
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

    return (
        <div className="maincard">
            <div className="flex justify-center items-center ">
                <div className="section-title">
                    {/* <BookOpen size={22} className="icon" /> */}
                    <span>Study Sessions</span>
                </div>
            </div>

            {selectedMonth ? (
                // Vista detallada del mes seleccionado
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => setSelectedMonth(null)}
                            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft size={20}/>Back to Months                             

                        </button>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{selectedMonth}</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupedLaps[selectedMonth]?.map((lap) => (
                            <div
                                key={lap.id}
                                className="stat-card bg-[var(--bg-secondary)] rounded-lg p-4 border-2 border-[var(--border-primary)] hover:border-[#444] dark:hover:border-[#444] transition-all duration-200 cursor-pointer relative"
                                onDoubleClick={() => setSelectedSession(lap)}
                            >
                                {/* Primera línea: #, título, duración */}
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-base text-[var(--accent-primary)] font-mono font-bold">#{lap.session_number}</span>
                                    <span className="text-base font-semibold text-[var(--text-primary)] truncate flex-1" title={lap.name}>{lap.name}</span>
                                    <div className="flex items-center gap-1 ml-2">
                                        <Clock size={18} className="text-[var(--text-secondary)]" />
                                        <span className="text-base text-[var(--text-primary)] font-medium">{lap.duration}</span>
                                    </div>

                                </div>
                                {/* Segunda línea: fecha, tasks done y trash icon */}
                                <div className="flex items-center justify-between text-base text-[var(--text-secondary)] mt-1">
                                    <span>{formatDateShort(lap.created_at)}</span>
                                    <div className="flex items-center gap-2 ml-auto">

                                        <span className="text-base font-normal">Tasks Done: {lap.tasks_completed ?? 0}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick(lap.id);
                                            }}
                                            className="text-red-500 hover:text-red-600 transition-colors duration-200 ml-2"
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
                            <div key={year} className="mb-2">
                                <div className="border-b border-[var(--border-primary)] mb-2 pb-1 pl-1 text-lg font-bold text-[var(--text-primary)]">{year}:</div>
                                <div className="grid gap-3 md:gap-4 w-full grid-cols-2 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-6">
                                    {monthsByYear[year]
                                        .sort((a, b) => monthOrder.indexOf(b.month) - monthOrder.indexOf(a.month))
                                        .map(({ month, monthYear, lapsOfMonth }) => {
                                            const stats = getMonthStats(lapsOfMonth);
                                            return (
                                                <div
                                                    key={monthYear}
                                                    className="stat-card bg-[var(--bg-secondary)] rounded-md p-2 border-2 border-[var(--border-primary)] flex flex-col min-w-[100px] cursor-pointer hover:border-[#444] dark:hover:border-[#444] transition-all duration-200"
                                                    onClick={() => setSelectedMonth(monthYear)}
                                                >
                                                    <div className="flex items-center gap-2 mb-1 align-middle">
                                                        <Calendar size={20} className="text-[var(--accent-primary)]" />
                                                        <span className="text-base font-bold text-[var(--text-primary)] truncate align-middle">{month}</span>
                                                    </div>
                                                    <div className="mb-1">
                                                        <span className="text-lg font-bold text-[var(--text-primary)]">{stats.totalSessions}</span>
                                                        <span className="text-sm font-normal text-[var(--text-secondary)] ml-1 align-middle">session{stats.totalSessions !== 1 ? 's' : ''}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[var(--text-secondary)] text-base">
                                                        <Clock size={18} />
                                                        <span>{formatMinutesToHHMM(stats.totalMinutes)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
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
        </div>
    );
};

export default StudySessions; 