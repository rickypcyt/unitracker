import React, { useEffect, useRef, useState } from 'react';

const pad = (n) => n.toString().padStart(2, '0');

const Countdown = () => {
  const [hours, setHours] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  // Manejo de flechas para cambiar horas
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowUp') {
        setHours(h => Math.min(h + 1, 24));
      } else if (e.key === 'ArrowDown') {
        setHours(h => Math.max(h - 1, 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Iniciar countdown
  const startCountdown = () => {
    setSecondsLeft(hours * 3600);
    setIsRunning(true);
  };

  // Manejar el timer
  useEffect(() => {
    if (!isRunning) return;
    if (secondsLeft <= 0) {
      setIsRunning(false);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          // Aquí podrías disparar un callback o sonido
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, secondsLeft]);

  // Formato HH:MM:SS
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Countdown</h3>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-2xl font-bold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
          onClick={() => setHours(h => Math.max(h - 1, 1))}
          disabled={isRunning || hours <= 1}
        >
          -
        </button>
        <span className="text-4xl font-mono font-bold select-none text-[var(--accent-primary)]">{hours}h</span>
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-2xl font-bold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
          onClick={() => setHours(h => Math.min(h + 1, 24))}
          disabled={isRunning || hours >= 24}
        >
          +
        </button>
      </div>
      <button
        className="mt-2 px-8 py-2 rounded-full bg-[var(--accent-primary)] text-white font-semibold text-lg shadow-md hover:bg-[var(--accent-primary)]/90 transition-colors disabled:opacity-60"
        onClick={startCountdown}
        disabled={isRunning}
      >
        Start
      </button>
      {isRunning && (
        <div className="mt-4 text-5xl font-mono font-bold text-[var(--accent-primary)] tracking-widest">
          {formatTime(secondsLeft)}
        </div>
      )}
      {!isRunning && secondsLeft === 0 && (
        <div className="mt-4 text-xl text-green-500 font-semibold">Done!</div>
      )}
    </div>
  );
};

export default Countdown; 