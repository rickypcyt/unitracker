import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import DeleteSessionModal from '../modals/DeleteSessionModal';
import SessionDetailsModal from '../modals/SessionDetailsModal';
import { deleteLap } from '../../store/actions/LapActions';
import { formatDateTimeWithAmPm } from '../../utils/dateUtils';
import { getMonthYear } from '../../hooks/useTimers';
import moment from 'moment';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';

const MonthLogs = () => {
    const { laps } = useSelector((state) => state.laps);
    const dispatch = useDispatch();
    const { isLoggedIn } = useAuth();
    const [expandedMonths, setExpandedMonths] = useState({});
    const [selectedSession, setSelectedSession] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [sessionToDeleteId, setSessionToDeleteId] = useState(null);

    const toggleVisibility = (monthYear) => {
        setExpandedMonths(prev => ({
            ...prev,
            [monthYear]: !prev[monthYear]
        }));
    };

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

    return (
        <div className="maincard">
            <h2 className="text-2xl font-bold mb-6">Study Sessions</h2>
            
            {!isLoggedIn ? (
                <div className="text-center text-neutral-400 py-8">
                    No sessions yet. Please log in first to start tracking your study sessions.
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupedLaps).map(([monthYear, lapsOfMonth]) => (
                        <div key={monthYear} className="mb-4">
                            <button
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:bg-neutral-800 transition-colors"
                                onClick={() => toggleVisibility(monthYear)}
                                aria-expanded={expandedMonths[monthYear]}
                                aria-controls={`sessions-${monthYear}`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className="text-base text-white">{monthYear}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-neutral-400 text-base">
                                            {lapsOfMonth.length} sessions
                                        </span>
                                        {expandedMonths[monthYear] ? (
                                            <ChevronUp size={22} className="text-neutral-400" />
                                        ) : (
                                            <ChevronDown size={22} className="text-neutral-400" />
                                        )}
                                    </div>
                                </div>
                            </button>
                            
                            {expandedMonths[monthYear] && (
                                <div 
                                    id={`sessions-${monthYear}`}
                                    className="space-y-4 mt-3"
                                    role="list"
                                    aria-label={`Sessions for ${monthYear}`}
                                >
                                    {lapsOfMonth.length === 0 ? (
                                        <div className="text-neutral-400 ml-4">No logs this month</div>
                                    ) : (
                                        lapsOfMonth.map((lap) => (
                                            <div
                                                key={lap.id}
                                                className="mt-2 ml-4 relative p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all duration-300"
                                                role="listitem"
                                                onDoubleClick={() => setSelectedSession(lap)}
                                            >
                                                <div className="flex justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-lg text-[var(--accent-primary)]">
                                                                #{lap.session_number} {lap.name}
                                                            </span>
                                                        </div>
                                                        <p className="text-lg text-neutral-400 mb-1">
                                                            {formatDateTimeWithAmPm(lap.created_at)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-neutral-400 text-lg">
                                                            {lap.duration}
                                                        </span>
                                                        <button
                                                            onClick={() => handleDeleteClick(lap.id)}
                                                            className="text-red-500 hover:text-red-600 transition-colors duration-200"
                                                            aria-label={`Delete session ${lap.name}`}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
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

export default MonthLogs; 