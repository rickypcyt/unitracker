import { AlertCircle, Calendar, Check, CheckCircle, Clock, Play, Trash2, TrendingUp, X } from 'lucide-react';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';

import DeleteSessionModal from './DeleteSessionModal';
import { motion } from 'framer-motion';
import { supabase } from '@/utils/supabaseClient';

interface Session {
  id: string;
  name: string;
  created_at: string;
  started_at: string;
  ended_at?: string;
  duration: string;
  session_number: number;
  description?: string;
  tasks_completed?: number;
  pomodoros_completed?: number;
}

interface SessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionSelected: (sessionId: string) => void;
  onSessionResumed?: (sessionId: string) => void;
  onFinishAllSessions?: () => Promise<void>;
  onStartNewSession?: () => void;
}

type TabType = 'unfinished' | 'today';

const SessionsModal = ({ 
  isOpen, 
  onClose, 
  onSessionSelected,
  onSessionResumed,
  onFinishAllSessions,
  onStartNewSession
}: SessionsModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('unfinished');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [unfinishedSessions, setUnfinishedSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const fetchTodaysSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const { data, error } = await supabase
        .from('study_laps')
        .select('id, name, created_at, started_at, ended_at, duration, session_number, description, tasks_completed, pomodoros_completed')
        .eq('user_id', user.id)
        .not('ended_at', 'is', null) // Only completed sessions
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching today\'s sessions:', error);
    }
  };

  const fetchUnfinishedSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('study_laps')
        .select('id, name, created_at, started_at, ended_at, duration, session_number, description, tasks_completed, pomodoros_completed')
        .is('ended_at', null)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setUnfinishedSessions(data || []);
    } catch (error) {
      console.error('Error fetching unfinished sessions:', error);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    
    setLoading(true);
    Promise.all([fetchTodaysSessions(), fetchUnfinishedSessions()]).finally(() => {
      setLoading(false);
    });
  }, [isOpen]);

  const handleContinueSession = (sessionId: string) => {
    onSessionSelected(sessionId);
    onClose();
  };

  const handleResumeSession = (sessionId: string) => {
    if (onSessionResumed) {
      onSessionResumed(sessionId);
    } else {
      onSessionSelected(sessionId);
    }
    onClose();
  };

  const handleFinishSession = async (sessionId: string) => {
    try {
      const now = new Date().toISOString();
      const session = unfinishedSessions.find(s => s.id === sessionId);
      
      if (!session) return;

      const seconds = Math.floor((new Date().getTime() - new Date(session.started_at).getTime()) / 1000);
      const toHMS = (totalSeconds: number) => {
        const s = Math.max(0, Math.floor(totalSeconds));
        const h = Math.floor(s / 3600).toString().padStart(2, '0');
        const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
        const sec = (s % 60).toString().padStart(2, '0');
        return `${h}:${m}:${sec}`;
      };
      const duration = toHMS(seconds);
      
      const { error } = await supabase
        .from('study_laps')
        .update({ 
          ended_at: now,
          duration
        })
        .eq('id', sessionId);
        
      if (error) {
        console.error('Error finishing session:', error);
        return;
      }
      
      // Refresh both lists
      fetchTodaysSessions();
      fetchUnfinishedSessions();
    } catch (error) {
      console.error('Error finishing session:', error);
    }
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
  };

  const confirmDeleteHandler = async () => {
    if (!sessionToDelete) return;

    try {
      const { error } = await supabase
        .from('study_laps')
        .delete()
        .eq('id', sessionToDelete);

      if (error) {
        console.error('Error deleting session:', error);
        return;
      }

      console.log('Session deleted successfully');
      // Refresh both lists
      fetchTodaysSessions();
      fetchUnfinishedSessions();
      setSessionToDelete(null); // Close modal
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  // Safely parse date string, return null if invalid
  const safeParseDate = (value?: string | null): Date | null => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const currentSessions = activeTab === 'unfinished' ? unfinishedSessions : sessions;
  const hasUnfinished = unfinishedSessions.length > 0;
  const hasToday = sessions.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--bg-primary)] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-[var(--border-primary)]">
        <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center sticky top-0 bg-[var(--bg-primary)] z-10">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-[var(--accent-primary)]" />
            <h2 className="text-xl font-semibold">Sessions</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border-primary)]">
          <button
            onClick={() => setActiveTab('unfinished')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'unfinished'
                ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <AlertCircle size={16} />
              Unfinished
              {hasUnfinished && (
                <span className="bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] px-2 py-0.5 rounded-full text-xs">
                  {unfinishedSessions.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'today'
                ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle size={16} />
              Today's
              {hasToday && (
                <span className="bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full text-xs">
                  {sessions.length}
                </span>
              )}
            </div>
          </button>
        </div>

        <div className="p-4 space-y-4">
  {loading ? (
    <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
    </div>
  ) : currentSessions.length === 0 ? (
    <div className="text-center py-8 text-[var(--text-secondary)]">
      {activeTab === 'unfinished' ? (
        <>
          <AlertCircle size={48} className="mx-auto mb-2 opacity-50" />
          <p>No unfinished sessions</p>
          <p className="text-sm mt-1">All caught up! Great job! 🎉</p>
        </>
      ) : (
        <>
          <Calendar size={48} className="mx-auto mb-2 opacity-50" />
          <p>No sessions completed today yet.</p>
          <p className="text-sm mt-1">Start a new study session to begin tracking!</p>
        </>
      )}
    </div>
  ) : (
    <div className="space-y-3">
      {currentSessions.map((session) => (
        <motion.div 
          key={session.id}
          className={`bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-primary)] ${
            activeTab === 'today' ? 'hover:border-[var(--accent-primary)]/30 transition-colors cursor-pointer' : ''
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => activeTab === 'today' && handleContinueSession(session.id)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-[var(--text-primary)]">
                  {session.name || `Session #${session.session_number}`}
                </h3>
                {activeTab === 'today' && <CheckCircle size={16} className="text-green-500" />}
              </div>
              
              {session.description && (
                <p className="text-sm text-[var(--text-secondary)] mb-2 line-clamp-2">
                  {session.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>Duration: {session.duration || '00:00:00'}</span>
                </div>
                {session.tasks_completed !== undefined && session.tasks_completed > 0 && (
                  <div className="flex items-center gap-1">
                    <CheckCircle size={14} />
                    <span>{session.tasks_completed} tasks</span>
                  </div>
                )}
                {session.pomodoros_completed !== undefined && session.pomodoros_completed > 0 && (
                  <div className="flex items-center gap-1">
                    <TrendingUp size={14} />
                    <span>{session.pomodoros_completed} pomodoros</span>
                  </div>
                )}
              </div>
                      
                      <div className="text-xs text-[var(--text-secondary)] mt-2">
                        {activeTab === 'unfinished' ? (
                          (() => {
                            const created = safeParseDate(session.created_at) || safeParseDate(session.started_at);
                            return `Started ${created ? formatDistanceToNowStrict(created, { addSuffix: true }) : 'Unknown'}`;
                          })()
                        ) : (
                          `Completed ${formatDistanceToNowStrict(parseISO(session.ended_at!), { addSuffix: true })}`
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center ml-4 gap-2">
                      {activeTab === 'unfinished' ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResumeSession(session.id);
                            }}
                            className="p-2 rounded-md text-green-600 hover:text-green-500 transition-colors"
                            title="Resume session"
                            aria-label="Resume session"
                          >
                            <Play size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFinishSession(session.id);
                            }}
                            className="p-2 rounded-md text-gray-500 hover:text-gray-400 transition-colors"
                            title="Finish session"
                            aria-label="Finish session"
                          >
                            <Check size={18} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContinueSession(session.id);
                          }}
                          className="p-2 rounded-md text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
                          title="Continue this session"
                          aria-label="Continue this session"
                        >
                          <Play size={18} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="p-2 rounded-md text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Delete this session"
                        aria-label="Delete this session"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-[var(--border-primary)] flex justify-between flex-wrap gap-2 sticky bottom-0 bg-[var(--bg-primary)] z-10">
          {activeTab === 'unfinished' && onFinishAllSessions && (
            <button
              onClick={onFinishAllSessions}
              className="px-4 py-2 rounded-lg border border-amber-500 text-amber-500 hover:bg-amber-500/10 transition-colors"
            >
              Finish All Sessions
            </button>
          )}
          <div className="flex space-x-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                // Close current modal and open StartSessionModal
                onClose();
                if (onStartNewSession) {
                  onStartNewSession();
                }
              }}
              className="px-4 py-2 rounded-lg border border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
            >
              Start New Session
            </button>
          </div>
        </div>
        
      <DeleteSessionModal
        isOpen={sessionToDelete !== null}
        onClose={() => setSessionToDelete(null)}
        onConfirm={confirmDeleteHandler}
      />
      </div>
    </div>
  );
};

export default SessionsModal;
