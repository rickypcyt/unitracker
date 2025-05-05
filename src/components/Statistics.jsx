import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSelector } from "react-redux";
import { BarChart, Eye, EyeOff } from "lucide-react";
import { BarChart3 } from "lucide-react";

const Statistics = () => {
    const [showBarChart, setShowBarChart] = useState(true);
    const { user } = useAuth();
    const { tasks } = useSelector((state) => state.tasks);
    const { laps } = useSelector((state) => state.laps);

    // Aquí deberías generar `weeklyData` basado en tus tareas/laps

    return (
        <div className="p-6 bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold text-white flex items-center gap-3">
                    <BarChart3 size={28} className="text-primary" />
                    Statistics
                </h2>
                <button
                    onClick={() => setShowBarChart(!showBarChart)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-200"
                >
                    {showBarChart ? (
                        <>
                            <EyeOff size={20} />
                            <span className="hidden sm:inline">Hide Chart</span>
                        </>
                    ) : (
                        <>
                            <Eye size={20} />
                            <span className="hidden sm:inline">Show Chart</span>
                        </>
                    )}
                </button>
            </div>

            {!user ? (
                <div className="text-center py-10 text-gray-400 border border-dashed border-gray-600 rounded-lg">
                    Please log in to view your statistics
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Aquí puedes agregar más tarjetas estadísticas */}
                    {showBarChart && (
                        <div className="bg-zinc-700/30 border border-zinc-600 p-6 rounded-xl shadow-lg backdrop-blur-md transition-all duration-300">
                            <h3 className="text-xl font-medium text-white">
                                Weekly Progress
                            </h3>
                            <div className="h-[300px]">
                                <BarChart
                                    data={weeklyData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                display: false,
                                            },
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                grid: {
                                                    color: "rgba(255, 255, 255, 0.05)",
                                                },
                                                ticks: {
                                                    color: "#E5E7EB",
                                                },
                                            },
                                            x: {
                                                grid: {
                                                    color: "rgba(255, 255, 255, 0.05)",
                                                },
                                                ticks: {
                                                    color: "#E5E7EB",
                                                },
                                            },
                                        },
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Statistics;
