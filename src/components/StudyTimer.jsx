import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../utils/supabaseClient';
import { resetTimerState, setCurrentSession } from '../redux/LapSlice';
import { fetchLaps, createLap, updateLap, deleteLap } from '../redux/LapActions';
import { Play, Pause, RotateCcw, Flag, Edit2, Check, Trash2, ChevronDown, ChevronUp,LibraryBig} from 'lucide-react';

const StudyTimer = () => {
  const dispatch = useDispatch();
  const { laps, error, currentSession } = useSelector((state) => state.laps);
  const [state, setState] = useState({
    isEditing: null,
    time: 0,
    isRunning: false,
    description: '',
    localUser: null,
    expandedMonths: {},
    expandedWeeks: {}
  });

  const intervalRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setState(prev => ({ ...prev, localUser: user }));
      if (user) dispatch(fetchLaps());
    };
    loadUser();
    return () => clearInterval(intervalRef.current);
  }, [dispatch]);

  const toggleVisibility = (type, key) => {
    setState(prev => ({
      ...prev,
      [`expanded${type}`]: {
        ...prev[`expanded${type}`],
        [key]: !prev[`expanded${type}`][key]
      }
    }));
  };

  const timerControls = {
    start: async () => {
      if (!state.isRunning) {
        const sessionNum = await getCurrentSessionNumber();
        dispatch(setCurrentSession(sessionNum));
        setState(prev => ({ ...prev, isRunning: true }));
        intervalRef.current = setInterval(() => {
          setState(prev => ({ ...prev, time: prev.time + 1 }));
        }, 1000);
      }
    },
    pause: () => {
      clearInterval(intervalRef.current);
      setState(prev => ({ ...prev, isRunning: false }));
    },
    reset: () => {
      clearInterval(intervalRef.current);
      setState(prev => ({ 
        ...prev, 
        isRunning: false, 
        time: 0, 
        description: '' 
      }));
      dispatch(resetTimerState());
    }
  };

  const lapHandlers = {
    add: async () => {
      if (!currentSession) return;
      const lapNumber = laps.filter(l => l.session_number === currentSession).length + 1;
      const lapData = {
        name: `Lap ${lapNumber}`,
        duration: formatTime(state.time),
        description: state.description,
        session_number: currentSession
      };
      dispatch(createLap(lapData));
    },
    finish: async () => {
      if (!currentSession) return;
      const sessionData = {
        name: `Session ${currentSession}`,
        duration: formatTime(state.time),
        description: state.description,
        session_number: currentSession
      };
      dispatch(createLap(sessionData));
      timerControls.reset();
    }
  };

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

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const groupSessionsByMonthWeek = () => {
    return laps.reduce((groups, lap) => {
      const monthYear = getMonthYear(lap.created_at);
      const weekKey = getWeekKey(lap.created_at);

      groups[monthYear] = groups[monthYear] || {};
      groups[monthYear][weekKey] = groups[monthYear][weekKey] || [];
      groups[monthYear][weekKey].push(lap);

      return groups;
    }, {});
  };

  const getMonthYear = (date) => {
    const d = new Date(date);
    return `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
  };

  const getWeekKey = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d - yearStart) / 86400000) / 7);
    return `Week ${weekNo}`;
  };

  if (!state.localUser) {
    return (
      <div className="max-w-full mx-auto my-8 bg-secondary border border-border-primary rounded-2xl p-6 shadow-lg mr-2 ml-2">
        <h2 className="text-2xl font-bold mb-6">Study Timer</h2>
        <div className="plslogin">
          Please log in to use the Study Timer
        </div>
      </div>
    );
  }

  const groupedLaps = groupSessionsByMonthWeek();

  return (
    <div className="maincard">
      <div>
      <h2  className="text-2xl font-bold mb-6 flex items-center gap-2"><LibraryBig size={24} /> Study Timer</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      </div>

      <div className="text-5xl font-mono mb-6 text-center">{formatTime(state.time)}</div>
    
      <div className="flex justify-center space-x-4 mb-6">
        {!state.isRunning ? (
          <button onClick={timerControls.start} className="button">
            <Play size={20} />
          </button>
        ) : (
          <button onClick={timerControls.pause} className="bg-accent-tertiary text-text-primary px-4 py-2 rounded-lg hover:bg-accent-secondary transition-colors duration-200">
            <Pause size={20} />
          </button>
        )}
        <button onClick={timerControls.reset} className="button text-text-primary px-4 py-2 rounded-lg hover:bg-accent-deep transition-colors duration-200">
          <RotateCcw size={20} />
        </button>
        <button onClick={lapHandlers.add} className="button">
          <Flag size={20} />
        </button>
        <button onClick={lapHandlers.finish} className="button">
          <Check size={20} />
        </button>
        
      </div>

      <div className="mb-4">
        <textarea
          value={state.description}
          onChange={(e) => setState(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Session description"
          className="textinput"
        />
      </div>

      {Object.entries(groupedLaps).map(([monthYear, weeks]) => (
        <div key={monthYear} className="mb-4">
          <button
            className="infomenu"
            onClick={() => toggleVisibility('Months', monthYear)}
          >
            <span>{monthYear}</span>
            {state.expandedMonths[monthYear] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {state.expandedMonths[monthYear] && (
            <div className="space-y-4 mt-2">
              {Object.entries(weeks).map(([weekKey, sessions]) => (
                <div key={`${monthYear}-${weekKey}`} className="mb-2 ml-4">
                  <button
                    className="flex items-center justify-between w-full py-2 px-3 bg-bg-tertiary rounded-lg text-left font-semibold hover:bg-bg-secondary transition-colors duration-200"
                    onClick={() => toggleVisibility('Weeks', `${monthYear}-${weekKey}`)}
                  >
                    <span>{weekKey}</span>
                    {state.expandedWeeks[`${monthYear}-${weekKey}`] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {state.expandedWeeks[`${monthYear}-${weekKey}`] && sessions.map((lap) => (
                    <div key={lap.id} className="flex items-center justify-between bg-bg-secondary p-3 rounded-lg mt-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-accent-primary">Session #{lap.session_number}</span>
                          {state.isEditing === lap.id ? (
                            <input
                              type="text"
                              value={lap.name}
                              onChange={(e) => dispatch(updateLap(lap.id, { name: e.target.value }))}
                              onBlur={() => {
                                dispatch(updateLap(lap.id, { name: lap.name }));
                                setState(prev => ({ ...prev, isEditing: null }));
                              }}
                              className="bg-bg-surface border border-border-primary rounded px-2 py-1 text-text-primary text-sm"
                            />
                          ) : (
                            <span className="flex items-center gap-2">
                              <span>{lap.name}</span>
                              <button onClick={() => setState(prev => ({ ...prev, isEditing: lap.id }))} className="text-text-secondary hover:text-accent-primary">
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
                          onClick={() => dispatch(deleteLap(lap.id))}
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
          )}
        </div>
      ))}
    </div>
  );
};

export default StudyTimer;