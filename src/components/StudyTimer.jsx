import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Play, Pause, RotateCcw, Flag, Edit2, Check, Trash2 } from 'lucide-react';

const StudyTimer = () => {
  const [laps, setLaps] = useState([]);
  const [isEditing, setIsEditing] = useState(null);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [description, setDescription] = useState('');
  const [currentSessionNumber, setCurrentSessionNumber] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchLaps();
    return () => clearInterval(intervalRef.current);
  }, []);

  const getCurrentSessionNumber = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('study_laps')
      .select('session_number')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .order('session_number', { ascending: false })
      .limit(1);

    return error || !data.length ? 1 : data[0].session_number + 1;
  };

  const fetchLaps = async () => {
    const { data, error } = await supabase
      .from('study_laps')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching laps:', error);
    else setLaps(data);
  };

  const startTimer = async () => {
    if (!isRunning) {
      const sessionNum = await getCurrentSessionNumber();
      setCurrentSessionNumber(sessionNum);
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
    setDescription('');
    setCurrentSessionNumber(null);
  };

  const addLap = async () => {
    if (!currentSessionNumber) return;

    const lapNumber = laps.filter(l => l.session_number === currentSessionNumber).length + 1;
    
    const { data, error } = await supabase
      .from('study_laps')
      .insert({ 
        name: `Lap ${lapNumber}`,
        duration: formatTime(time),
        description,
        session_number: currentSessionNumber
      })
      .select();
    
    if (error) console.error('Error adding lap:', error);
    else setLaps([data[0], ...laps]);
  };

  const finishStudySession = async () => {
    if (!currentSessionNumber) return;

    const { data, error } = await supabase
      .from('study_laps')
      .insert({ 
        name: `Session ${currentSessionNumber}`,
        duration: formatTime(time),
        description,
        session_number: currentSessionNumber
      })
      .select();
    
    if (error) console.error('Error finishing study session:', error);
    else {
      setLaps([data[0], ...laps]);
      resetTimer();
    }
  };

  const updateLap = async (id, newData) => {
    const { error } = await supabase
      .from('study_laps')
      .update(newData)
      .eq('id', id);
    
    if (error) console.error('Error updating lap:', error);
    else {
      setLaps(laps.map(lap => lap.id === id ? { ...lap, ...newData } : lap));
      setIsEditing(null);
    }
  };

  const deleteLap = async (lapId) => {
    const { error } = await supabase
      .from('study_laps')
      .delete()
      .eq('id', lapId);
    
    if (error) console.error('Error deleting lap:', error);
    else setLaps(laps.filter(lap => lap.id !== lapId));
  };

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const groupSessionsByDate = () => {
    return laps.reduce((groups, lap) => {
      const date = new Date(lap.created_at).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(lap);
      return groups;
    }, {});
  };

  return (
    <div className="relative max-w-full mx-auto my-8 bg-secondary border border-border-primary rounded-2xl p-6 shadow-lg transition-all duration-300 ease-in-out hover:translate-y-[-0.2rem] hover:shadow-xl mr-2 ml-2">
      <h2 className="text-2xl font-bold mb-6">Study Timer</h2>
      <div className="text-5xl font-mono mb-6 text-center">{formatTime(time)}</div>
      
      <div className="mb-4">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Session description"
          className="w-full p-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary"
        />
      </div>

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

      <div className="space-y-4 max-h-60 overflow-y-auto">
        {Object.entries(groupSessionsByDate()).map(([date, sessions]) => (
          <div key={date} className="bg-bg-surface p-3 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">{date}</h3>
            {sessions.map((lap) => (
              <div key={lap.id} className="flex items-center justify-between bg-bg-tertiary p-3 rounded-lg mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-accent-primary">Session #{lap.session_number}</span>
                    {isEditing === lap.id ? (
                      <input
                        type="text"
                        value={lap.name}
                        onChange={(e) =>
                          setLaps(laps.map(l => l.id === lap.id ? { ...l, name: e.target.value } : l))
                        }
                        onBlur={() => updateLap(lap.id, { name: lap.name, description: lap.description })}
                        className="bg-bg-surface border border-border-primary rounded px-2 py-1 text-text-primary text-sm"
                      />
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>{lap.name}</span>
                        <button onClick={() => setIsEditing(lap.id)} className="text-text-secondary hover:text-accent-primary">
                          <Edit2 size={16} />
                        </button>
                      </span>
                    )}
                  </div>
                  {lap.description && (
                    <p className="text-sm text-text-secondary">{lap.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-text-secondary text-sm">{lap.duration}</span>
                  <button
                    onClick={() => deleteLap(lap.id)}
                    className="text-accent-secondary transition-all duration-200 hover:text-accent-primary hover:scale-110"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudyTimer;