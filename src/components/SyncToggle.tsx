import { Link } from 'lucide-react';
import { useTimerActions } from '@/store/appStore';
import { useUi } from '@/store/appStore';

const SyncToggle = () => {
  const ui = useUi();
  const isSynced = ui.isSynced;
  const { setStudyTimerState } = useTimerActions();

  const handleToggle = () => {
    setStudyTimerState(isSynced ? 'stopped' : 'running');
  };

  return (
    <div className="flex justify-center mb-6">
      <button
        onClick={handleToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-semibold ${
          isSynced
            ? 'border border-[var(--accent-primary)] text-[var(--accent-primary)] bg-transparent hover:bg-[var(--accent-primary)]/10'
            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)]'
        }`}
        aria-label={isSynced ? 'Disable timer synchronization' : 'Enable timer synchronization'}
      >
        <Link size={18} className={isSynced ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'} />
        {isSynced ? 'Synchronized' : 'Sync Timers'}
      </button>
    </div>
  );
};

export default SyncToggle; 