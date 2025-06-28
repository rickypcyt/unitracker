import { Clock, Pause, Play, RotateCcw } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { formatDate } from '@/utils/dateUtils';

const Session = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    if (time > 0) {
      setSessions(prev => [...prev, {
        duration: time,
        date: new Date().toISOString(),
      }]);
    }
    setTime(0);
    setIsRunning(false);
  };

  return (
    <div className="maincard">
      <div className="flex justify-center items-center">
        <div className="section-title">
          <Clock size={22} className="icon" />
          <span>Study Session</span>
        </div>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-8">
        <div className="text-6xl font-mono mb-4">
          {formatTime(time)}
        </div>
        <div className="flex justify-center gap-4">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="control-button w-12 h-12 flex items-center justify-center"
              aria-label="Start timer"
            >
              <Play size={22} style={{ color: "white" }} />
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="control-button w-12 h-12 flex items-center justify-center"
              aria-label="Pause timer"
            >
              <Pause size={22} style={{ color: "white" }} />
            </button>
          )}
          <button
            onClick={handleReset}
            className="control-button w-12 h-12 flex items-center justify-center"
            aria-label="Reset timer"
          >
            <RotateCcw size={22} style={{ color: "white" }} />
          </button>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Recent Sessions</h3>
        <div className="space-y-2">
          {sessions.slice(-5).reverse().map((session, index) => (
            <div key={index} className="bg-neutral-900 rounded-lg p-3 flex justify-between items-center">
              <span className="text-neutral-400">
                {formatDate(session.date)}
              </span>
              <span className="font-mono">
                {formatTime(session.duration)}
              </span>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-center text-neutral-500 py-4">
              No sessions recorded yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Session; 