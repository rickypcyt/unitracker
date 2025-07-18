import { AlarmClock, Pause, Play, RotateCcw } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import toast from 'react-hot-toast';

const fields = ['hours', 'minutes', 'seconds'];
const fieldMax = { hours: 23, minutes: 59, seconds: 59 };

const pad = (n, field) => {
  const max = fieldMax[field];
  const val = Math.min(Math.max(n, 0), max);
  return val.toString().padStart(2, '0');
};

const Countdown = () => {
  const [time, setTime] = useState({ hours: 1, minutes: 0, seconds: 0 });
  const [initialTime, setInitialTime] = useState(time);
  const [activeField, setActiveField] = useState('hours');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [programmaticFocusField, setProgrammaticFocusField] = useState(null);
  // Eliminamos fieldPrevValue y fieldOverwrite

  const inputRefs = useRef({
    hours: React.createRef(),
    minutes: React.createRef(),
    seconds: React.createRef()
  });

  const calculateSeconds = ({ hours, minutes, seconds }) =>
    hours * 3600 + minutes * 60 + seconds;

  const startCountdown = () => {
    // Corrige los valores antes de iniciar
    const correctedTime = {
      hours: Math.min(Math.max(time.hours, 0), fieldMax.hours),
      minutes: Math.min(Math.max(time.minutes, 0), fieldMax.minutes),
      seconds: Math.min(Math.max(time.seconds, 0), fieldMax.seconds),
    };
    setTime(correctedTime);
    const total = calculateSeconds(correctedTime);
    if (total > 0) {
      setInitialTime(correctedTime);
      setSecondsLeft(total);
      setIsRunning(true);
    }
  };

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);

          try {
            new Audio('/sounds/countdownend.mp3').play();
          } catch {}

          toast.success('Countdown finished! Session complete.', {
            position: 'top-center',
            style: {
              backgroundColor: '#000',
              color: '#fff',
              border: '2px solid var(--border-primary)'
            }
          });

          if (Notification.permission === 'granted') {
            try {
              const notification = new Notification('Countdown finished!', {
                body: 'Your session is complete.',
                silent: false,
                vibrate: [200, 100, 200]
              });
              setTimeout(() => notification.close(), 5000);
            } catch {}
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      setTime({
        hours: Math.floor(secondsLeft / 3600),
        minutes: Math.floor((secondsLeft % 3600) / 60),
        seconds: secondsLeft % 60
      });
    }
  }, [secondsLeft, isRunning]);

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(0);
    setTime(initialTime);
  };

  const handleInputChange = useCallback((field, value) => {
    const clean = value.replace(/\D/g, ''); // Solo números
    let val = parseInt(clean, 10);
    if (isNaN(val)) val = 0;
    setTime(prev => ({ ...prev, [field]: val }));
  }, []);

  const navigateField = useCallback((direction, currentIdx) => {
    const newIndex = (currentIdx + direction + fields.length) % fields.length;
    const nextField = fields[newIndex];
    setActiveField(nextField);
    setProgrammaticFocusField(nextField);
    inputRefs.current[nextField].current?.focus();
  }, []);

  const handleInputKeyDown = useCallback((e, field) => {
    const idx = fields.indexOf(field);
    const step = field === 'minutes' ? 5 : 1;

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        navigateField(e.shiftKey ? -1 : 1, idx);
        break;
      case 'Enter':
        if (field === 'seconds') {
          e.preventDefault();
          startCountdown();
        } else {
          e.preventDefault();
          navigateField(1, idx);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        navigateField(1, idx);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        navigateField(-1, idx);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setTime(prev => {
          const next = (prev[field] + step) % (fieldMax[field] + 1);
          return { ...prev, [field]: next };
        });
        break;
      case 'ArrowDown':
        e.preventDefault();
        setTime(prev => {
          const next = (prev[field] - step + (fieldMax[field] + 1)) % (fieldMax[field] + 1);
          return { ...prev, [field]: next };
        });
        break;
      default:
        break;
    }
  }, [navigateField, startCountdown]);

  const handleFocus = (field, e) => {
    setActiveField(field);
    setTime(prev => ({ ...prev, [field]: 0 }));
    setTimeout(() => {
      e.target.setSelectionRange(e.target.value.length, e.target.value.length);
      setProgrammaticFocusField(null);
    }, 0);
  };

  const handleBlur = (field, e) => {
    let val = parseInt(e.target.value.replace(/\D/g, ''), 10);
    if (isNaN(val)) val = 0;
    if (val > fieldMax[field]) val = fieldMax[field];
    setTime(prev => ({ ...prev, [field]: val }));
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex items-center justify-center w-full px-4 py-3 relative">
        <div className="flex items-center gap-2 mx-auto">
          <AlarmClock size={22} className="icon" style={{ color: 'var(--accent-primary)' }} />
          <span className="font-bold text-lg">Countdown</span>
        </div>
      </div>

      <div className="flex items-center justify-center mb-6">
        {fields.map((field, idx) => (
          <React.Fragment key={field}>
            <input
              ref={inputRefs.current[field]}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pad(time[field], field)}
              placeholder={undefined}
              onFocus={e => handleFocus(field, e)}
              onBlur={e => handleBlur(field, e)}
              onChange={e => handleInputChange(field, e.target.value)}
              onKeyDown={e => handleInputKeyDown(e, field)}
              className={`w-14 sm:w-16 text-center text-4xl sm:text-5xl font-mono bg-transparent border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-transparent transition-all duration-150 ${activeField === field ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}
              tabIndex={idx + 1}
              style={{ letterSpacing: '0.05em' }}
            />
            {field !== 'seconds' && <span className="text-5xl font-mono text-[var(--text-primary)] mx-1">:</span>}
          </React.Fragment>
        ))}
      </div>

      <div className="flex justify-center items-center gap-3 mb-2">
        <button
          onClick={handleReset}
          className="p-2 rounded-full hover:bg-[var(--accent-primary)]/10 focus:bg-[var(--accent-primary)]/20"
          aria-label="Reset timer"
        >
          <RotateCcw size={24} className="text-[var(--accent-primary)]" />
        </button>

        {isRunning ? (
          <button
            onClick={() => setIsRunning(false)}
            className="p-2 rounded-full hover:bg-[var(--accent-primary)]/10 focus:bg-[var(--accent-primary)]/20"
            aria-label="Pause countdown"
          >
            <Pause size={24} className="text-[var(--accent-primary)]" />
          </button>
        ) : (
          <button
            onClick={startCountdown}
            disabled={calculateSeconds(time) === 0}
            className="p-2 rounded-full hover:bg-[var(--accent-primary)]/10 focus:bg-[var(--accent-primary)]/20"
            aria-label="Start countdown"
          >
            <Play size={24} className="text-[var(--accent-primary)]" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Countdown;
