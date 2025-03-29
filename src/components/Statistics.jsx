import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSelector } from 'react-redux';
import { BarChart, Eye, EyeOff } from 'lucide-react';
import { BarChart3 } from 'lucide-react';

const Statistics = () => {
  const [showBarChart, setShowBarChart] = useState(true);
  const { user } = useAuth();
  const { tasks } = useSelector((state) => state.tasks);
  const { laps } = useSelector((state) => state.laps);

  // ... existing code ...

  return (
    <div className="maincard">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><BarChart3 size={24} /> Statistics</h2>
        <button
          onClick={() => setShowBarChart(!showBarChart)}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200"
        >
          {showBarChart ? (
            <>
              <EyeOff size={20} />
              Hide Chart
            </>
          ) : (
            <>
              <Eye size={20} />
              Show Chart
            </>
          )}
        </button>
      </div>

      {!user ? (
        <div className="plslogin">
          Please log in to view your statistics
        </div>
      ) : (
        <div className="space-y-6">
          {/* ... existing stats cards ... */}

          {showBarChart && (
            <div className="bg-bg-surface p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Weekly Progress</h3>
              <div className="h-[300px]">
                <BarChart
                  data={weeklyData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                          color: '#9CA3AF'
                        }
                      },
                      x: {
                        grid: {
                          color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                          color: '#9CA3AF'
                        }
                      }
                    }
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