import { AlarmClock, Pause, Play, RotateCcw } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import toast from 'react-hot-toast';

const pad = (n) => n.toString().padStart(2, '0');

const MAX = { hours: 23, minutes: 59, seconds: 59 };

const Countdown = () => {
  const [time, setTime] = useState({ hours: 1, minutes: 0, seconds: 0 });
  const [initialTime, setInitialTime] = useState({ hours: 1, minutes: 0, seconds: 0 });
  const [activeField, setActiveField] = useState('hours'); // 'hours' | 'minutes' | 'seconds'
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const inputRefs = {
    hours: useRef(null),
    minutes: useRef(null),
    seconds: useRef(null)
  };

  // Para sobrescribir el campo activo con el último dígito ingresado
  const lastInputDigit = useRef(null);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isRunning) return;
      const active = document.activeElement;
      const fields = ['hours', 'minutes', 'seconds'];
      // Si un input está enfocado, SOLO permitir navegación y flechas, NO sobrescribir el valor con un solo dígito
      if (active && (active.tagName === 'INPUT' && active.type === 'text')) {
        const idx = fields.indexOf(activeField);
        if (e.key === 'ArrowLeft') {
          const prev = idx === 0 ? 2 : idx - 1;
          setActiveField(fields[prev]);
          inputRefs[fields[prev]].current?.focus();
          e.preventDefault();
        } else if (e.key === 'ArrowRight') {
          const next = idx === 2 ? 0 : idx + 1;
          setActiveField(fields[next]);
          inputRefs[fields[next]].current?.focus();
          e.preventDefault();
        } else if (e.key === 'ArrowUp') {
          setTime(t => {
            const next = { ...t };
            const step = activeField === 'minutes' ? 5 : 1;
            next[activeField] = Math.min(next[activeField] + step, MAX[activeField]);
            return next;
          });
          e.preventDefault();
        } else if (e.key === 'ArrowDown') {
          setTime(t => {
            const next = { ...t };
            const step = activeField === 'minutes' ? 5 : 1;
            next[activeField] = Math.max(next[activeField] - step, 0);
            return next;
          });
          e.preventDefault();
        }
        // NO sobrescribir el valor con un solo dígito aquí
        return;
      }
      // Si ningún input está enfocado, navegación rápida
      if (e.key === 'ArrowLeft') {
        setActiveField(f => {
          const idx = fields.indexOf(f);
          const prev = idx === 0 ? 2 : idx - 1;
          inputRefs[fields[prev]].current?.focus();
          return fields[prev];
        });
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        setActiveField(f => {
          const idx = fields.indexOf(f);
          const next = idx === 2 ? 0 : idx + 1;
          inputRefs[fields[next]].current?.focus();
          return fields[next];
        });
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setTime(t => {
          const next = { ...t };
          next[activeField] = Math.min(next[activeField] + 1, MAX[activeField]);
          return next;
        });
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        setTime(t => {
          const next = { ...t };
          next[activeField] = Math.max(next[activeField] - 1, 0);
          return next;
        });
        e.preventDefault();
      } else if (/^[0-9]$/.test(e.key)) {
        setTime(t => {
          let val = parseInt(e.key, 10);
          if (val > MAX[activeField]) val = MAX[activeField];
          lastInputDigit.current = val;
          return { ...t, [activeField]: val };
        });
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeField, isRunning, inputRefs]);

  // Iniciar countdown
  const startCountdown = () => {
    setInitialTime(time); // Guardar el tiempo inicial antes de empezar
    setSecondsLeft(time.hours * 3600 + time.minutes * 60 + time.seconds);
    setIsRunning(true);
  };

  // Manejar el timer
  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          // Sonido
          try {
            const audio = new window.Audio('/sounds/countdownend.mp3');
            audio.play();
          } catch (e) {}
          // Toast
          toast.success('Countdown finished! Session complete.', {
            position: 'top-center',
            style: {
              backgroundColor: '#000',
              color: '#fff',
              border: '2px solid var(--border-primary)',
            },
          });
          // Desktop notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              const notification = new window.Notification('Countdown finished!', {
                body: 'Your session is complete.',
                silent: false,
                vibrate: [200, 100, 200],
              });
              setTimeout(() => notification.close(), 5000);
            } catch (e) {}
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  // Actualiza el tiempo mostrado cuando cambia secondsLeft
  useEffect(() => {
    if (!isRunning) return;
    setTime({
      hours: Math.floor(secondsLeft / 3600),
      minutes: Math.floor((secondsLeft % 3600) / 60),
      seconds: secondsLeft % 60
    });
  }, [secondsLeft, isRunning]);

  const handleInputChange = (field, value) => {
    // Permite hasta dos dígitos y edición normal
    let clean = value.replace(/\D/g, '');
    if (clean.length === 0) {
      setTime(t => ({ ...t, [field]: 0 }));
      return;
    }
    let val = parseInt(clean.slice(0, 2), 10);
    if (isNaN(val)) val = 0;
    if (val > MAX[field]) val = MAX[field];
    setTime(t => {
      const prev = t[field].toString();
      // Skip automático:
      const fields = ['hours', 'minutes', 'seconds'];
      const idx = fields.indexOf(field);
      if (
        (field === 'hours' && clean.length === 1) ||
        ((field === 'minutes' || field === 'seconds') && prev.length < 2 && clean.length === 2)
      ) {
        if (idx < 2) {
          const nextField = fields[idx + 1];
          setActiveField(nextField);
          setTimeout(() => {
            inputRefs[nextField].current?.focus();
          }, 0);
        }
      }
      return { ...t, [field]: val };
    });
    lastInputDigit.current = val;
  };

  // Mejorar navegación con Tab, Shift+Tab y Enter
  const handleInputKeyDown = (e, field) => {
    const fields = ['hours', 'minutes', 'seconds'];
    const idx = fields.indexOf(field);
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        // Ir al campo anterior
        const prev = idx === 0 ? 2 : idx - 1;
        setActiveField(fields[prev]);
        inputRefs[fields[prev]].current?.focus();
      } else {
        // Ir al campo siguiente
        const next = idx === 2 ? 0 : idx + 1;
        setActiveField(fields[next]);
        inputRefs[fields[next]].current?.focus();
      }
    }
  };

  // Reset timer
  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(0);
    setTime(initialTime); // Restaurar el tiempo inicial
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex items-center justify-center w-full px-4 py-3 relative">
        <div className="flex items-center gap-2 mx-auto">
          <AlarmClock size={22} className="icon self-center" style={{ color: 'var(--accent-primary)' }} />
          <span className="font-bold text-lg truncate mb-0 self-center">Countdown</span>
        </div>
        <div className="absolute right-4 flex items-center"><div className="w-[28px]"></div></div>
      </div>
      <div className="flex items-center justify-center mb-6">
        {['hours', 'minutes', 'seconds'].map((field, idx) => (
          <React.Fragment key={field}>
            <input
              ref={inputRefs[field]}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pad(time[field])}
              onFocus={e => {
                setActiveField(field);
                setTimeout(() => {
                  e.target.select();
                }, 0);
              }}
              onChange={e => handleInputChange(field, e.target.value)}
              onKeyDown={e => handleInputKeyDown(e, field)}
              className={`w-14 sm:w-16 text-center text-4xl sm:text-5xl font-mono font-normal bg-transparent border-none ring-0 outline-none focus:outline-none focus:ring-0 transition-all duration-150 ${activeField === field ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'} ${isRunning ? 'pointer-events-none' : ''}`}
              disabled={isRunning}
              tabIndex={idx + 1}
              style={{ letterSpacing: '0.05em' }}
            />
            {field !== 'seconds' && <span className="text-5xl font-mono font-normal text-[var(--text-primary)] select-none mx-1">:</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="timer-controls flex justify-center items-center gap-3 mb-2">
        <button
          onClick={handleReset}
          className="control-button flex items-center justify-center bg-transparent text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 focus:bg-[var(--accent-primary)]/20 transition-colors rounded-full"
          aria-label="Reset timer"
        >
          <RotateCcw size={24} className="text-[var(--accent-primary)]" />
        </button>
        {!isRunning ? (
          <button
            className="control-button flex items-center justify-center bg-transparent text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 focus:bg-[var(--accent-primary)]/20 transition-colors rounded-full"
            onClick={startCountdown}
            disabled={time.hours === 0 && time.minutes === 0}
            aria-label="Start countdown"
          >
            <Play size={24} className="text-[var(--accent-primary)]" />
          </button>
        ) : (
          <button
            className="control-button flex items-center justify-center bg-transparent text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 focus:bg-[var(--accent-primary)]/20 transition-colors rounded-full"
            onClick={() => setIsRunning(false)}
            aria-label="Pause countdown"
          >
            <Pause size={24} className="text-[var(--accent-primary)]" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Countdown; 