import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Play, Pause, RotateCcw, Flag, Edit2, Check } from 'lucide-react';

const Counter = () => {
  const [laps, setLaps] = useState([]);
  const [isEditing, setIsEditing] = useState(null);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchLaps();
    return () => clearInterval(intervalRef.current);
  }, []);

  const fetchLaps = async () => {
    const { data, error } = await supabase
      .from('study_laps')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching laps:', error);
    else setLaps(data);
  };

  const startTimer = () => {
    if (!isRunning) {
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }
  };

  const pauseTimer = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
  };

  const resetTimer = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setTime(0);
  };

  const addLap = async () => {
    const { data, error } = await supabase
      .from('study_laps')
      .insert({ name: `Lap ${laps.length + 1}`, duration: formatTime(time) })
      .select();
    if (error) console.error('Error adding lap:', error);
    else setLaps([data[0], ...laps]);
  };

  const finishStudySession = async () => {
    const { data, error } = await supabase
      .from('study_laps')
      .insert({ name: `Study Session ${laps.length + 1}`, duration: formatTime(time) })
      .select();
    if (error) console.error('Error finishing study session:', error);
    else {
      setLaps([data[0], ...laps]);
      resetTimer();
    }
  };

  const updateLapName = async (id, newName) => {
    const { error } = await supabase
      .from('study_laps')
      .update({ name: newName })
      .eq('id', id);
    if (error) console.error('Error updating lap name:', error);
    else {
      setLaps(laps.map(lap => lap.id === id ? { ...lap, name: newName } : lap));
      setIsEditing(null);
    }
  };

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative max-w-full mx-auto my-8 bg-secondary border border-border-primary rounded-2xl p-6 shadow-lg transition-all duration-300 ease-in-out hover:translate-y-[-0.2rem] hover:shadow-xl mr-1 ml-1">
      <h2 className="text-2xl font-bold mb-6">Study Timer</h2>
      <div className="text-5xl font-mono mb-6 text-center">{formatTime(time)}</div>
      <div className="flex justify-center space-x-4 mb-6">
        {!isRunning ? (
          <button onClick={startTimer} className="bg-accent-primary text-text-primary px-4 py-2 rounded-lg hover:bg-accent-deep transition-colors duration-200">
            <Play size={20} />
          </button>
        ) : (
          <button onClick={pauseTimer} className="bg-accent-tertiary text-text-primary px-4 py-2 rounded-lg hover:bg-accent-secondary transition-colors duration-200">
            <Pause size={20} />
          </button>
        )}
        <button onClick={resetTimer} className="bg-accent-secondary text-text-primary px-4 py-2 rounded-lg hover:bg-accent-deep transition-colors duration-200">
          <RotateCcw size={20} />
        </button>
        <button onClick={addLap} className="bg-accent-primary text-text-primary px-4 py-2 rounded-lg hover:bg-accent-deep transition-colors duration-200">
          <Flag size={20} />
        </button>
        <button onClick={finishStudySession} className="bg-accent-deep text-text-primary px-4 py-2 rounded-lg hover:bg-accent-secondary transition-colors duration-200">
          <Check size={20} />
        </button>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {laps.map((lap) => (
          <div key={lap.id} className="flex items-center justify-between bg-bg-tertiary p-3 rounded-lg">
            {isEditing === lap.id ? (
              <input
                type="text"
                value={lap.name}
                onChange={(e) => setLaps(laps.map(l => l.id === lap.id ? { ...l, name: e.target.value } : l))}
                onBlur={() => updateLapName(lap.id, lap.name)}
                className="bg-bg-surface border border-border-primary rounded px-2 py-1 text-text-primary"
              />
            ) : (
              <span className="flex items-center">
                <span>{lap.name}</span>
                <button onClick={() => setIsEditing(lap.id)} className="ml-2 text-text-secondary hover:text-accent-primary">
                  <Edit2 size={16} />
                </button>
              </span>
            )}
            <span className="text-text-secondary">{lap.duration}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Counter;
