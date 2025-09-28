import { X, Play, Square, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useDispatch } from 'react-redux';
import { updateLap } from '@/store/LapActions';
import { formatStudyTime } from '@/hooks/useTimers';
import { motion } from 'framer-motion';

interface UnfinishedSession {
  id: string;
  name: string;
  started_at: string;
  duration: number;
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
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchUnfinishedSessions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('study_laps')
          .select('id, name, started_at, duration, session_number')
          .is('end_time', null)
          .eq('user_id', user.id)
          .order('started_at', { ascending: false });

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

      const duration = Math.floor((new Date().getTime() - new Date(session.started_at).getTime()) / 1000);
      
      await dispatch(updateLap(sessionId, { 
        end_time: now,
        duration,
        status: 'completed' 
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
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Started {formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        <span className="text-sm text-[var(--text-secondary)]">{formatStudyTime(session.duration)}</span>: {formatStudyTime(session.duration || 0)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleResumeSession(session.id)}
                        className="p-2 rounded-lg bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity"
                        title="Resume session"
                      >
                        <Play size={16} />
                      </button>
                      <button
                        onClick={() => handleFinishSession(session.id)}
                        className="p-2 rounded-lg bg-green-600 text-white hover:opacity-90 transition-opacity"
                        title="Finish session"
                      >
                        <Square size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-2 rounded-lg bg-red-600 text-white hover:opacity-90 transition-opacity"
                        title="Delete session"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-[var(--border-primary)] flex justify-between flex-wrap gap-2">
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
              className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity"
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
