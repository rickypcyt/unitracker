import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Check } from 'lucide-react';

const WORK_TIME = 50 * 60; // 50 minutos en segundos
const BREAK_TIME = 10 * 60; // 10 minutos en segundos

const Pomodoro = () => {
  const [mode, setMode] = useState('work'); // 'work' o 'break'
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Inicia el countdown cuando la cuenta está en ejecución
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }

    // Cuando el contador llega a cero, alterna entre work y break
    if (timeLeft === 0) {
      if (mode === 'work') {
        setMode('break');
        setTimeLeft(BREAK_TIME);
      } else {
        // Finaliza el ciclo de break y regresa a modo trabajo
        setMode('work');
        setTimeLeft(WORK_TIME);
        setIsRunning(false);
      }
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft, mode]);

  const startTimer = () => {
    if (!isRunning) setIsRunning(true);
  };

  const pauseTimer = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
  };

  const resetTimer = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? WORK_TIME : BREAK_TIME);
  };

  const finishCycle = () => {
    // Finaliza el ciclo actual y reinicia en modo trabajo
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setMode('work');
    setTimeLeft(WORK_TIME);
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative max-w-full mx-auto my-8 bg-secondary border border-border-primary rounded-2xl p-6 shadow-lg transition-all duration-300 ease-in-out hover:translate-y-[-0.2rem] hover:shadow-xl mr-1 ml-1">
      <h2 className="text-2xl font-bold mb-6">Pomodoro Timer</h2>
      <div className="text-5xl font-mono mb-2 text-center">
        {formatTime(timeLeft)}
      </div>
      <div className="text-center mb-6">
        <span className="text-xl font-medium text-text-primary">
          {mode === 'work' ? 'Work Time' : 'Break Time'}
        </span>
      </div>
      <div className="flex justify-center space-x-4 mb-6">
        {!isRunning ? (
          <button
            onClick={startTimer}
            className="bg-accent-primary text-text-primary px-4 py-2 rounded-lg hover:bg-accent-deep transition-colors duration-200"
          >
            <Play size={20} />
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="bg-accent-tertiary text-text-primary px-4 py-2 rounded-lg hover:bg-accent-secondary transition-colors duration-200"
          >
            <Pause size={20} />
          </button>
        )}
        <button
          onClick={resetTimer}
          className="bg-accent-secondary text-text-primary px-4 py-2 rounded-lg hover:bg-accent-deep transition-colors duration-200"
        >
          <RotateCcw size={20} />
        </button>
        <button
          onClick={finishCycle}
          className="bg-accent-deep text-text-primary px-4 py-2 rounded-lg hover:bg-accent-secondary transition-colors duration-200"
        >
          <Check size={20} />
        </button>
      </div>
    </div>
  );
};

export default Pomodoro;
