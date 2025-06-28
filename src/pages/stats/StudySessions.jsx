import { BookOpen, Calendar, Clock, Trash2 } from 'lucide-react';
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
                    <BookOpen size={22} className="icon" />
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
                            <Calendar size={20} />
                            ← Back to Months
                        </button>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{selectedMonth}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupedLaps[selectedMonth]?.map((lap) => (
                            <div
                                key={lap.id}
                                className="stat-card bg-[var(--bg-secondary)] rounded-lg p-4 border-2 border-[var(--border-primary)] hover:bg-[var(--bg-primary)] transition-all duration-200 cursor-pointer relative min-h-[140px]"
                                onDoubleClick={() => setSelectedSession(lap)}
                            >
                                {/* Título - arriba */}
                                <div className="pb-1">
                                    <h3 className="text-base font-semibold text-[var(--text-primary)] break-words whitespace-normal">
                                        {lap.name}
                                    </h3>
                                </div>

                                {/* Información inferior */}
                                <div className="absolute bottom-3 left-3 right-3">
                                    <div className="flex justify-between items-center">
                                        {/* Número de sesión y horas - izquierda inferior */}
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-[var(--accent-primary)] font-mono font-bold">
                                                #{lap.session_number}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} className="text-[var(--text-secondary)]" />
                                                <span className="text-sm text-[var(--text-primary)] font-medium">
                                                    {lap.duration}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Fecha - derecha inferior */}
                                        <div className="text-xs text-[var(--text-secondary)]">
                                            {formatDateShort(lap.created_at)}
                                        </div>

                                        {/* Trash icon - esquina inferior derecha */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick(lap.id);
                                            }}
                                            className="text-red-500 hover:text-red-600 transition-colors duration-200 ml-2"
                                            aria-label={`Delete session ${lap.name}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // Vista de tarjetas de meses
                <div
                  className="grid gap-6 md:gap-8 justify-center items-center"
                  style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
                >
                    {Object.entries(groupedLaps).map(([monthYear, lapsOfMonth]) => {
                        const stats = getMonthStats(lapsOfMonth);
                        return (
                            <div
                                key={monthYear}
                                className="stat-card bg-[var(--bg-secondary)] rounded-lg p-4 border-2 border-[var(--border-primary)] flex flex-col items-center text-center min-w-[140px] min-h-[120px] cursor-pointer hover:bg-[var(--bg-primary)] transition-all duration-200"
                                onClick={() => setSelectedMonth(monthYear)}
                            >
                                <div className="mb-2">
                                    <Calendar size={24} className="text-[var(--accent-primary)]" />
                                </div>
                                <div className="text-[var(--text-secondary)] text-sm font-medium mb-1">
                                    {monthYear}
                                </div>
                                <div className="text-xl font-bold text-[var(--text-primary)] mb-1">
                                    {stats.totalSessions}
                                </div>
                                <div className="text-[var(--text-secondary)] text-xs mb-1">
                                    sessions
                                </div>
                                <div className="flex items-center gap-1 text-[var(--text-secondary)] text-xs">
                                    <Clock size={14} />
                                    <span>{formatMinutesToHHMM(stats.totalMinutes)}</span>
                                </div>
                            </div>
                        );
                    })}
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
        </div>
    );
};

export default StudySessions; 