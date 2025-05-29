import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import moment from 'moment';
import { getMonthYear } from '../../hooks/useTimers';
import { deleteLap } from '../../store/actions/LapActions';
import { toast } from 'react-toastify';
import SessionDetailsModal from '../modals/SessionDetailsModal';

const MonthLogs = () => {
    const { laps } = useSelector((state) => state.laps);
    const dispatch = useDispatch();
    const [expandedMonths, setExpandedMonths] = useState({});
    const [selectedSession, setSelectedSession] = useState(null);

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

    const handleDelete = async (sessionId) => {
        try {
            await dispatch(deleteLap(sessionId));
            toast.success("Session deleted successfully");
        } catch (error) {
            console.error("Error deleting session:", error);
            toast.error(error.message || "Failed to delete session");
        }
    };

    const groupedLaps = groupSessionsByMonth();

    return (
        <div className="maincard">
            <h2 className="text-2xl font-bold mb-6">Study Sessions</h2>
            
            <div className="space-y-4">
                {Object.entries(groupedLaps).map(([monthYear, lapsOfMonth]) => (
                    <div key={monthYear} className="mb-4">
                        <button
                            className="infomenu w-full"
                            onClick={() => toggleVisibility(monthYear)}
                            aria-expanded={expandedMonths[monthYear]}
                            aria-controls={`sessions-${monthYear}`}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className="text-base">{monthYear}</span>
                                <div className="flex items-center gap-4">
                                    <span className="text-text-secondary text-base">
                                        {lapsOfMonth.length} sessions
                                    </span>
                                    {expandedMonths[monthYear] ? (
                                        <ChevronUp size={22} />
                                    ) : (
                                        <ChevronDown size={22} />
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
                                    <div className="text-gray-400 ml-4">No logs this month</div>
                                ) : (
                                    lapsOfMonth.map((lap) => (
                                        <div
                                            key={lap.id}
                                            className="mt-2 ml-4 relative p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg border-2 border-border-primary mx-auto"
                                            role="listitem"
                                            onDoubleClick={() => setSelectedSession(lap)}
                                        >
                                            <div className="flex justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-lg text-accent-primary">
                                                            #{lap.session_number} {lap.name}
                                                        </span>
                                                    </div>
                                                    <p className="text-lg text-text-secondary mb-1">
                                                        {moment(lap.created_at).format("MMM D, YYYY h:mm A")}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-text-secondary text-lg">
                                                        {lap.duration}
                                                    </span>
                                                    <button
                                                        onClick={() => handleDelete(lap.id)}
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

            {selectedSession && (
                <SessionDetailsModal
                    session={selectedSession}
                    onClose={() => setSelectedSession(null)}
                />
            )}
        </div>
    );
};

export default MonthLogs; 