import { X, Play, Check, Trash2 } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store/store';
import { updateLap } from '@/store/LapActions';
import { motion } from 'framer-motion';

interface UnfinishedSession {
  id: string;
  name: string;
  created_at: string;
  started_at: string;
  duration: string | null; // stored as HH:MM:SS in DB
  session_number: number;
}

interface UnfinishedSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionResumed: (sessionId: string) => void;
  onFinishAllSessions?: () => Promise<void>;
}

const UnfinishedSessionsModal = ({ 
  isOpen, 
  onClose, 
  onSessionResumed, 
  onFinishAllSessions 
}: UnfinishedSessionsModalProps) => {
  const [sessions, setSessions] = useState<UnfinishedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch<AppDispatch>();

  // Safely parse date string, return null if invalid
  const safeParseDate = (value?: string | null): Date | null => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchUnfinishedSessions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('study_laps')
          .select('id, name, created_at, started_at, duration, session_number')
          .is('ended_at', null)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setSessions(data || []);
      } catch (error) {
        console.error('Error fetching unfinished sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnfinishedSessions();
  }, [isOpen]);

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('study_laps')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(sessions.filter(session => session.id !== sessionId));
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleFinishSession = async (sessionId: string) => {
    try {
      const now = new Date().toISOString();
      const session = sessions.find(s => s.id === sessionId);
      
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
      
      await dispatch(updateLap(sessionId, { 
        ended_at: now,
        duration
      }));
      
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Error finishing session:', error);
    }
  };

  const handleResumeSession = (sessionId: string) => {
    onSessionResumed(sessionId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--bg-primary)] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-[var(--border-primary)]">
        <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center sticky top-0 bg-[var(--bg-primary)] z-10">
          <h2 className="text-xl font-semibold">Unfinished Sessions</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-secondary)]">
              No unfinished sessions found.
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <motion.div 
                  key={session.id}
                  className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-primary)]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-[var(--text-primary)]">
                        {session.name || `Session #${session.session_number}`}
                      </h3>
                      {(() => {
                        const created = safeParseDate(session.created_at) || safeParseDate(session.started_at);
                        return (
                          <p className="text-sm text-[var(--text-secondary)] mt-1">
                            Started {created ? formatDistanceToNowStrict(created, { addSuffix: true }) : 'Unknown'}
                          </p>
                        );
                      })()}
                      <p className="text-sm text-[var(--text-secondary)]">
                        Duration: {session.duration || '00:00:00'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 self-end">
                      <button
                        onClick={() => handleResumeSession(session.id)}
                        className="p-2 rounded-md text-green-600 hover:text-green-500 transition-colors"
                        title="Resume session"
                        aria-label="Resume session"
                      >
                        <Play size={18} />
                      </button>
                      <button
                        onClick={() => handleFinishSession(session.id)}
                        className="p-2 rounded-md text-gray-500 hover:text-gray-400 transition-colors"
                        title="Finish session"
                        aria-label="Finish session"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-2 rounded-md text-red-600 hover:text-red-500 transition-colors"
                        title="Delete session"
                        aria-label="Delete session"
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
          {onFinishAllSessions && (
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
              onClick={() => onSessionResumed('')}
              className="px-4 py-2 rounded-lg border border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
            >
              Start New Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnfinishedSessionsModal;
