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
            ? 'border-2 border-(--accent-primary) text-(--accent-primary) bg-transparent hover:bg-(--accent-primary)/10'
            : 'bg-(--bg-secondary) text-(--text-secondary) hover:text-(--text-primary) border-2 border-(--border-primary)'
        }`}
        aria-label={isSynced ? 'Disable timer synchronization' : 'Enable timer synchronization'}
      >
        <Link size={18} className={isSynced ? 'text-(--accent-primary)' : 'text-(--text-secondary)'} />
        {isSynced ? 'Synchronized' : 'Sync Timers'}
      </button>
    </div>
  );
};

export default SyncToggle; 