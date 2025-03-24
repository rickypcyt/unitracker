import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Check } from 'lucide-react';

// Importa tus archivos de sonido
const workSound = new Audio('dist/assets/sounds/pomo-end.mp3');
const breakSound = new Audio('dist/assets/sounds/break-end.mp3');

const WORK_TIME = 5; // 50 minutos en segundos
const BREAK_TIME = 1 * 60; // 10 minutos en segundos

const Pomodoro = () => {
  const [mode, setMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) {
      // Seleccionar el sonido adecuado
      const sound = mode === 'work' ? workSound.cloneNode(true) : breakSound.cloneNode(true);
      sound.play();
      setIsAlarmPlaying(true);

      // Configurar siguiente fase
      setTimeout(() => {
        const nextMode = mode === 'work' ? 'break' : 'work';
        const nextTime = mode === 'work' ? BREAK_TIME : WORK_TIME;
        
        setMode(nextMode);
        setTimeLeft(nextTime);
        setIsRunning(nextMode === 'work' ? false : true);
      }, 100);
    }
  }, [timeLeft, mode]);

  const stopAlarm = () => {
    setIsAlarmPlaying(false);
  };

  const startTimer = () => {
    if (!isRunning) setIsRunning(true);
    stopAlarm();
  };

  const pauseTimer = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    stopAlarm();
  };

  const resetTimer = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? WORK_TIME : BREAK_TIME);
    stopAlarm();
  };

  const finishCycle = () => {
    resetTimer();
    setMode('work');
    setTimeLeft(WORK_TIME);
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative max-w-full mx-auto my-8 bg-secondary border border-border-primary rounded-2xl p-6 shadow-lg mr-1 ml-1">
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
