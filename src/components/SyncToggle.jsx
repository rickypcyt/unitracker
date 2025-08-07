import { useDispatch, useSelector } from 'react-redux';

import { Link } from 'lucide-react';
import React from 'react';
import { setIsSynced } from '@/store/slices/uiSlice';

const SyncToggle = () => {
  const dispatch = useDispatch();
  const isSynced = useSelector(state => state.ui.isSynced);

  const handleToggle = () => {
    dispatch(setIsSynced(!isSynced));
  };

  return (
    <div className="flex justify-center mb-6">
      <button
        onClick={handleToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-semibold ${
          isSynced
            ? 'bg-[var(--accent-primary)] text-white shadow-lg'
            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)]'
        }`}
        aria-label={isSynced ? 'Disable timer synchronization' : 'Enable timer synchronization'}
      >
        <Link size={18} className={isSynced ? 'text-white' : 'text-[var(--text-secondary)]'} />
        {isSynced ? 'Synchronized' : 'Sync Timers'}
      </button>
    </div>
  );
};

export default SyncToggle; 